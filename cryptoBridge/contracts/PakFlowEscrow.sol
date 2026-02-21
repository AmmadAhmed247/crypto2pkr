// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PakFlowVault
 * @notice Locks user tokens until PKR payout is confirmed via relay server.
 *
 * FIXES vs original:
 *  1. Multi-request support — requests keyed by (user, requestId) not just user.
 *  2. Explicit `treasury` address (separate from owner).
 *  3. `confirmPayout` sends to treasury, not owner.
 *  4. `requestId` returned on lock so frontend/relay can track it.
 *  5. Relay server backup: owner can manually confirm after RELAY_TIMEOUT.
 *  6. Request counter per user prevents ID collisions.
 */
contract PakFlowVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public owner;
    address public relayServer;
    address public treasury;

    uint256 public constant REFUND_TIMELOCK = 1 hours;
    uint256 public constant RELAY_TIMEOUT   = 2 hours; // owner can confirm after this

    struct Withdrawal {
        address token;
        uint256 amount;
        string  raastId;
        uint256 timestamp;
        bool    isProcessed;
    }

    mapping(address => mapping(uint256 => Withdrawal)) public withdrawals;
    mapping(address => uint256) public userRequestCounter;
    mapping(address => bool) public whiteListedTokens;

//all events
    event LockInitiated(
        address indexed user,
        uint256 indexed requestId,
        address indexed token,
        uint256 amount,
        string  raastId,
        uint256 timestamp
    );
    event PayoutConfirmed(
        address indexed user,
        uint256 indexed requestId,
        address indexed token,
        uint256 amount
    );
    event RefundClaimed(
        address indexed user,
        uint256 indexed requestId,
        address indexed token,
        uint256 amount
    );
    event TokenWhiteListed(address indexed token, bool status);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event RelayServerUpdated(address indexed oldRelay, address indexed newRelay);

//modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyRelay() {
        require(msg.sender == relayServer, "Not authorized relay");
        _;
    }


    constructor(
        address _relayServer,
        address _treasury,
        address[] memory _tokens
    ) {
        require(_relayServer != address(0), "Invalid relay");
        require(_treasury    != address(0), "Invalid treasury");

        owner       = msg.sender;
        relayServer = _relayServer;
        treasury    = _treasury;

        for (uint256 i = 0; i < _tokens.length; i++) {
            whiteListedTokens[_tokens[i]] = true;
            emit TokenWhiteListed(_tokens[i], true);
        }
    }


    function updateRelayServer(address _relayServer) external onlyOwner {
        require(_relayServer != address(0), "Invalid relay");
        emit RelayServerUpdated(relayServer, _relayServer);
        relayServer = _relayServer;
    }

    function updateTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        emit TreasuryUpdated(treasury, _treasury);
        treasury = _treasury;
    }

    function updateWhiteListedToken(address _token, bool _status) external onlyOwner {
        whiteListedTokens[_token] = _status;
        emit TokenWhiteListed(_token, _status);
    }

    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        if (_token == address(0)) {
            (bool success, ) = owner.call{value: _amount}("");
            require(success, "ETH withdraw failed");
        } else {
            IERC20(_token).safeTransfer(owner, _amount);
        }
    }


    function lockUserRequest(
        address _token,
        uint256 _amount,
        string memory _raastId
    ) external payable nonReentrant returns (uint256 requestId) {
        require(_amount > 0,"Amount must be > 0");
        require(whiteListedTokens[_token],"Token not whitelisted");
        require(bytes(_raastId).length > 0,"Invalid Raast ID");

        if (_token == address(0)) {
            require(msg.value == _amount, "Incorrect ETH sent");
        } else {
            require(msg.value == 0, "Do not send ETH with token transfer");
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }

        requestId = userRequestCounter[msg.sender]++;
        withdrawals[msg.sender][requestId] = Withdrawal({
            token:       _token,
            amount:      _amount,
            raastId:     _raastId,
            timestamp:   block.timestamp,
            isProcessed: false
        });

        emit LockInitiated(msg.sender, requestId, _token, _amount, _raastId, block.timestamp);
    }


    function confirmPayout(address _user, uint256 _requestId) external onlyRelay nonReentrant {
        Withdrawal storage request = withdrawals[_user][_requestId];
        require(request.amount > 0,    "No such request");
        require(!request.isProcessed,  "Already processed");

        address token  = request.token;
        uint256 amount = request.amount;

        request.isProcessed = true; 

        _transferToTreasury(token, amount);

        emit PayoutConfirmed(_user, _requestId, token, amount);
        delete withdrawals[_user][_requestId];
    }


    function ownerConfirmPayout(address _user, uint256 _requestId) external onlyOwner nonReentrant {
        Withdrawal storage request = withdrawals[_user][_requestId];
        require(request.amount > 0,   "No such request");
        require(!request.isProcessed, "Already processed");
        require(
            block.timestamp > request.timestamp + RELAY_TIMEOUT,
            "Relay timeout not reached"
        );

        address token  = request.token;
        uint256 amount = request.amount;

        request.isProcessed = true;

        _transferToTreasury(token, amount);

        emit PayoutConfirmed(_user, _requestId, token, amount);
        delete withdrawals[_user][_requestId];
    }


    function claimRefund(uint256 _requestId) external nonReentrant {
        Withdrawal storage request = withdrawals[msg.sender][_requestId];
        require(request.amount > 0,   "No such request");
        require(!request.isProcessed, "Already processed");
        require(
            block.timestamp > request.timestamp + REFUND_TIMELOCK,
            "Refund timelock active"
        );

        uint256 amount = request.amount;
        address token  = request.token;

        request.isProcessed = true; 

        if (token == address(0)) {
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "ETH refund failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }

        emit RefundClaimed(msg.sender, _requestId, token, amount);
        delete withdrawals[msg.sender][_requestId];
    }


    function getRequest(address _user, uint256 _requestId)
        external
        view
        returns (
            address token,
            uint256 amount,
            string memory raastId,
            uint256 timestamp,
            bool isProcessed
        )
    {
        Withdrawal storage r = withdrawals[_user][_requestId];
        return (r.token, r.amount, r.raastId, r.timestamp, r.isProcessed);
    }



    function _transferToTreasury(address token, uint256 amount) internal {
        if (token == address(0)) {
            (bool success, ) = treasury.call{value: amount}("");
            require(success, "ETH to treasury failed");
        } else {
            IERC20(token).safeTransfer(treasury, amount);
        }
    }

    receive() external payable {}
}
