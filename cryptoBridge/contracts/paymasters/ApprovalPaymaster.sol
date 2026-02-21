// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IPaymaster, ExecutionResult, PAYMASTER_VALIDATION_SUCCESS_MAGIC} from "@matterlabs/zksync-contracts/contracts/system-contracts/interfaces/IPaymaster.sol";
import {IPaymasterFlow} from "@matterlabs/zksync-contracts/contracts/system-contracts/interfaces/IPaymasterFlow.sol";
import "@matterlabs/zksync-contracts/contracts/system-contracts/libraries/TransactionHelper.sol";
import "@matterlabs/zksync-contracts/contracts/system-contracts/Constants.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Chainlink Oracle Interface
interface IAggregatorV3 {
    function latestRoundData()
        external
        view
        returns (
            uint80  roundId,
            int256  price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80  answeredInRound
        );
}


contract PakFlowOraclePaymaster is IPaymaster, Ownable {


    /// Max age of Chainlink price before we consider it stale (10 minutes).
    uint256 public constant ORACLE_STALENESS_LIMIT = 10 minutes;

    address          public allowedToken; // USDT address
    IAggregatorV3    public priceFeed;    // Chainlink ETH/USD feed
    address          public treasury;     // Where collected USDT goes


    event GasPaidInToken(address indexed user, uint256 ethAmount, uint256 tokenCharged);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event PriceFeedUpdated(address indexed oldFeed, address indexed newFeed);


    modifier onlyBootloader() {
        require(msg.sender == BOOTLOADER_FORMAL_ADDRESS, "Only bootloader");
        _;
    }


    constructor(
        address _erc20,
        address _priceFeed,
        address _treasury,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_erc20     != address(0), "Invalid token");
        require(_priceFeed != address(0), "Invalid price feed");
        require(_treasury  != address(0), "Invalid treasury");

        allowedToken = _erc20;
        priceFeed    = IAggregatorV3(_priceFeed);
        treasury     = _treasury;
    }


    function getRequiredTokenAmount(uint256 _requiredETH) public view returns (uint256) {
        (
            ,
            int256  price,
            ,
            uint256 updatedAt,

        ) = priceFeed.latestRoundData();


        require(
            block.timestamp - updatedAt <= ORACLE_STALENESS_LIMIT,
            "Oracle price stale"
        );

        require(price > 0, "Invalid oracle price");

        uint256 priceUsd = uint256(price);

    
        return (_requiredETH * priceUsd) / 1e20;
    }


    function validateAndPayForPaymasterTransaction(
        bytes32,
        bytes32,
        Transaction calldata _transaction
    )
        external
        payable
        onlyBootloader
        returns (bytes4 magic, bytes memory context)
    {
        magic = PAYMASTER_VALIDATION_SUCCESS_MAGIC;

        require(_transaction.paymasterInput.length >= 4, "Input too short");

        bytes4 paymasterInputSelector = bytes4(_transaction.paymasterInput[0:4]);

        if (paymasterInputSelector == IPaymasterFlow.approvalBased.selector) {

        
            (address token, uint256 minAllowance, ) = abi.decode(
                _transaction.paymasterInput[4:],
                (address, uint256, bytes)
            );

            require(token == allowedToken, "Invalid token");

            address userAddress = address(uint160(_transaction.from));

       
            uint256 requiredETH = _transaction.gasLimit * _transaction.maxFeePerGas;

            uint256 tokenAmountToCharge = getRequiredTokenAmount(requiredETH);

            require(
                tokenAmountToCharge <= minAllowance,
                "Token charge exceeds user approval: price moved"
            );

        
            uint256 userAllowance = IERC20(token).allowance(userAddress, address(this));
            require(userAllowance >= tokenAmountToCharge, "Insufficient token allowance");

            // 5. Pull USDT from user
            bool transferred = IERC20(token).transferFrom(
                userAddress,
                address(this),
                tokenAmountToCharge
            );
            require(transferred, "USDT transferFrom failed");

            // 6. Pay bootloader in ETH
            (bool success, ) = payable(BOOTLOADER_FORMAL_ADDRESS).call{value: requiredETH}("");
            require(success, "ETH payment to bootloader failed");

            emit GasPaidInToken(userAddress, requiredETH, tokenAmountToCharge);

        } else {
            revert("Only ApprovalBased flow supported");
        }
    }

    function postTransaction(
        bytes calldata,
        Transaction calldata,
        bytes32,
        bytes32,
        ExecutionResult,
        uint256
    ) external payable override onlyBootloader {}


    function updateTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        emit TreasuryUpdated(treasury, _treasury);
        treasury = _treasury;
    }

    function updatePriceFeed(address _priceFeed) external onlyOwner {
        require(_priceFeed != address(0), "Invalid feed");
        emit PriceFeedUpdated(address(priceFeed), _priceFeed);
        priceFeed = IAggregatorV3(_priceFeed);
    }


    function withdrawTokens(address _token) external onlyOwner {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(balance > 0, "Nothing to withdraw");
        IERC20(_token).transfer(treasury, balance);
    }

    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
}
