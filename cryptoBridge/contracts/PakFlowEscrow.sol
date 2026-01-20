// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PakFlowVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public owner;
    address public relayServer;
    uint256 public constant REFUND_TIMELOCK = 1 hours;

    struct Withdrawal {
        address token;
        uint256 amount; 
        string raastId;
        uint256 timestamp;
        bool isProcessed;
    }
    mapping(address => Withdrawal) public pendingWithdrawals;
    mapping(address => bool) public whiteListedTokens;
    event LockInitiated(address indexed user, address indexed token, uint256 amount, string raastId, uint256 timestamp);
    event PayoutConfirmed(address indexed user, address indexed token, uint256 amount);
    event RefundClaim(address indexed user, address indexed token, uint256 amount);
    event TokenWhiteListed(address indexed token, bool status);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can access!");
        _;
    }

    modifier onlyRelay() {
        require(msg.sender == relayServer, "Not Authorized Server");
        _;
    }

    constructor(address _relayServer, address[] memory _tokens) {
        owner = msg.sender;
        relayServer = _relayServer;
        for (uint256 i = 0; i < _tokens.length; i++) {
            whiteListedTokens[_tokens[i]] = true;
            emit TokenWhiteListed(_tokens[i], true);
        }
    }

    function updateRelayServer(address _relayServer) external onlyOwner {
        relayServer = _relayServer;
    }

    function updateWhiteListedTokenList(address _token, bool _status) external onlyOwner {
        whiteListedTokens[_token] = _status;
        emit TokenWhiteListed(_token, _status);
    }

    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        if (_token == address(0)) {
            (bool success, ) = owner.call{value: _amount}("");
            require(success, "ETH Withdraw Failed");
        } else {
            IERC20(_token).safeTransfer(owner, _amount);
        }
    }

    function lockUserRequest(address _token, uint256 _amount, string memory _raastId) external payable nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(whiteListedTokens[_token], "Token not whitelisted");
        require(pendingWithdrawals[msg.sender].amount == 0, "Wait for previous request");

        if (_token == address(0)) {
            require(msg.value == _amount, "Incorrect ETH sent");
        } else {
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }

        pendingWithdrawals[msg.sender] = Withdrawal({
            token: _token,
            amount: _amount,
            raastId: _raastId,
            timestamp: block.timestamp,
            isProcessed: false
        });

        emit LockInitiated(msg.sender, _token, _amount, _raastId, block.timestamp);
    }

    function confirmPayout(address _user) external onlyRelay nonReentrant {
        Withdrawal storage request = pendingWithdrawals[_user];
        require(request.amount > 0, "No pending request");
        require(!request.isProcessed, "Already processed");

        address token = request.token;
        uint256 amount = request.amount;

        if (token == address(0)) {
            (bool success, ) = owner.call{value: amount}("");
            require(success, "ETH Transfer Failed");
        } else {
            IERC20(token).safeTransfer(owner, amount);
        }

        emit PayoutConfirmed(_user, token, amount);
        delete pendingWithdrawals[_user];
    }

    function requestFund() external nonReentrant {
        Withdrawal storage request = pendingWithdrawals[msg.sender];
        require(request.amount > 0, "No pending request");
        require(block.timestamp > request.timestamp + REFUND_TIMELOCK, "Refund timelock active");

        uint256 amount = request.amount;
        address token = request.token;

        if (token == address(0)) {
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "ETH Refund Failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }

        emit RefundClaim(msg.sender, token, amount);
        delete pendingWithdrawals[msg.sender];
    }

    function getPendingWithdrawals(address _user) external view returns (uint256 amount, string memory raastId, bool isProcessed) {
        Withdrawal storage request = pendingWithdrawals[_user];
        return (request.amount, request.raastId, request.isProcessed);
    }

    receive() external payable {}
}
