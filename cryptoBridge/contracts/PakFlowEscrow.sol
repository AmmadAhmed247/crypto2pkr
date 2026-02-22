// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CryptoPkr is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public owner;
    address public relayServer; 
    address public treasury; 

    uint256 public constant REFUND_TIMElOCK = 1 hours;
    uint256 public constant RELAY_TIMEOUT = 1 hours; 

    struct Withdrawal {
        address token;
        uint256 amount;
        string raastId;
        uint256 timestamp;
        bool isProcessed;
    }

    mapping(address => mapping(uint256 => Withdrawal)) public withdrawals;
    mapping(address => uint256) public userRequestCounter;
    mapping(address => bool) public WhiteListedTokens;

    // Events (Fixed names and types)
    event LockInitiated(address indexed user, uint256 indexed requestId, address indexed token, uint256 amount, string raastId, uint256 timeStamp);
    event PayoutConfirmed(address indexed user, uint256 indexed requestId, address indexed token, uint256 amount);
    event RefundClaimed(address indexed user, uint256 indexed requestId, address indexed token, uint256 amount);
    event WhiteListed(address indexed token, bool status);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event RelayServerUpdated(address indexed oldRelay, address indexed newRelay);
    event AdminReleaseToUser(address indexed user,uint256 indexed requestId , address indexed token , uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only Owner Can Access This!");
        _;
    }

    modifier onlyRelay() {
        require(msg.sender == relayServer, "Not Authorized");
        _;
    }

    constructor(address _relayServer, address _treasury, address[] memory _tokens) {
        require(_relayServer != address(0) && _treasury != address(0), "Invalid Address..");
        owner = msg.sender;
        relayServer = _relayServer;
        treasury = _treasury;

        for(uint256 i = 0; i < _tokens.length; i++) {
            WhiteListedTokens[_tokens[i]] = true;
            emit WhiteListed(_tokens[i], true);
        }
    }

    function updateRelayServer(address newRelayServer) external onlyOwner {
        emit RelayServerUpdated(relayServer, newRelayServer);
        relayServer = newRelayServer;
    }

    function updateTreasury(address newTreasuryWallet) external onlyOwner {
        emit TreasuryUpdated(treasury, newTreasuryWallet);
        treasury = newTreasuryWallet;
    }

    function updateWhiteListedTokenList(address _token, bool _status) external onlyOwner {
        WhiteListedTokens[_token] = _status;
        emit WhiteListed(_token, _status);
    }

    function lockUserRequest(address _token, uint256 _amount, string memory _raastId) external payable nonReentrant returns(uint256 requestId) {
        require(_amount > 0, "Amount must be greater than 0");
        require(WhiteListedTokens[_token], "Token Not WhiteListed");
        require(bytes(_raastId).length > 0, "Invalid RaastId");

        if(_token == address(0)) {
            require(msg.value == _amount, "Incorrect Eth Amount");
        } else {
            require(msg.value == 0, "Do not send eth with tokens");
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }

        requestId = userRequestCounter[msg.sender]++;
        withdrawals[msg.sender][requestId] = Withdrawal({
            token: _token,
            amount: _amount,
            raastId: _raastId,
            timestamp: block.timestamp,
            isProcessed: false
        });

        emit LockInitiated(msg.sender, requestId, _token, _amount, _raastId, block.timestamp);
    }

    function confirmPayout(address user, uint256 requestId) external onlyRelay nonReentrant {
        Withdrawal storage r = withdrawals[user][requestId];
        require(r.amount > 0 && !r.isProcessed, "Invalid Request");
        
        r.isProcessed = true;
        _transferToTreasury(r.token, r.amount);
        
        emit PayoutConfirmed(user, requestId, r.token, r.amount);
        delete withdrawals[user][requestId];
    }

    function claimRefund(uint256 _requestId) external nonReentrant {
        Withdrawal storage w = withdrawals[msg.sender][_requestId];
        require(w.amount > 0 && !w.isProcessed, "Invalid Request");
        require(block.timestamp > w.timestamp + REFUND_TIMElOCK, "TimeLock Active");

        uint256 amount = w.amount;
        address token = w.token;
        w.isProcessed = true;

        if(token == address(0)) {
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "ETH Refund Failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }

        emit RefundClaimed(msg.sender, _requestId, token, amount);
        delete withdrawals[msg.sender][_requestId];
    }

    function _transferToTreasury(address token, uint256 amount) internal {
        if(token == address(0)) {
            (bool success, ) = treasury.call{value: amount}("");
            require(success, "Treasury Transfer failed");
        } else {
            IERC20(token).safeTransfer(treasury, amount);
        }
    }

    function adminReleaseToUser(address _user, uint256 _requestId) external onlyOwner nonReentrant {
        Withdrawal storage w = withdrawals[_user][_requestId];
        require(w.amount > 0 && !w.isProcessed, "No such request");
        
        uint256 amount = w.amount;
        address token = w.token;
        w.isProcessed = true;

        if (token == address(0)) {
            (bool success, ) = payable(_user).call{value: amount}("");
            require(success, "ETH Release Failed");
        } else {
            IERC20(token).safeTransfer(_user, amount);
        }

        emit AdminReleaseToUser(_user, _requestId, token, amount);
        delete withdrawals[_user][_requestId];
    }

    receive() external payable {}
}