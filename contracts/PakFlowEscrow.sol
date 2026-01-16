// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PakFlowVault is ReentrancyGuard {
    address public owner;
    address public relayServer;

    struct Withdrawal{
        uint256 amount; 
        string raastId;
        bool isProcessed;
    }

    mapping(address=>Withdrawal) public pendingWithdrawals;
    mapping(address => bool ) public whiteListedTokens;
    event LockInitiated(address indexed user , address indexed token , uint256 amount ,string raastId ,uint256 timestamped);
    event PayoutConfirmed(address indexed user , address indexed token , uint256 amount);
    event TokenWhiteListed(address indexed token , bool status);

    // we can use bool too but it cost more fees 
    // uint256 private locked=1;
    // modifier nonReentrant(){
    //     require(locked==1 , "Reentrant called");
    //     locked=2;
    //     _;
    //     locked=1;
    // }
    modifier onlyOwner(){
        require(msg.sender == owner , "Only owner can access!");
        _;
    }

    modifier onlyRelay(){
        require(msg.sender==relayServer , "Not Authorized Server ");
        _;
    }

    constructor (address _relayServer , address [] memory _tokens){
        owner=msg.sender;
        relayServer=_relayServer;

        for (uint256 i = 0; i < _tokens.length; i++) {
            whiteListedTokens[_tokens[i]]=true;
            emit TokenWhiteListed(_tokens[i], true);
        }
    }

    function updateRelayServer(address _relayServer)external onlyOwner{
        relayServer=_relayServer;
    } 

    // update whitelisted token list

    function updateWhiteListedTokenList(address _token , bool _status )external onlyOwner{
        whiteListedTokens[_token]=_status;
        emit TokenWhiteListed(_token, _status);
    }


    function emerygencyWithdraw(address _token , uint256 _amount  )external onlyOwner {
        require(IERC20(_token).transfer(owner,_amount),"Transfered Failed!");
    }


    function lockUserRequest(address _token , uint256 _amount , string memory _raastId)external  nonReentrant{
        require(_amount > 0 , "Must be greater than 0!");
        require(whiteListedTokens[_token],"The token is not in the List");
        Withdrawal storage existing=pendingWithdrawals[msg.sender];
        require(existing.amount==0 || existing.isProcessed , "Previous request is in Pending!");
        require(IERC20(_token).transferFrom(msg.sender,address(this),_amount),"Transaction Failed!");

        pendingWithdrawals[msg.sender]=Withdrawal(_amount , _raastId , false);
        emit LockInitiated(msg.sender, _token, _amount, _raastId, block.timestamp);

    }

    function confirmPayout(address _user , address _token)external onlyRelay nonReentrant {
        Withdrawal storage request=pendingWithdrawals[_user];
        require(!request.isProcessed , "Already Processed!");
        require(request.amount>0 ,"No Pending Request!");
        // request.isProcessed=true; This is unnecessary because we have to delete the rqst in the end hmm 
        //transfer locked crypto to treasury Wallet 
        require(IERC20(_token).transfer(owner , request.amount),"Trasnfer to treasury Failed!");
        emit PayoutConfirmed(_user, _token, request.amount);
        // delete the withdrawl request 
        delete pendingWithdrawals[_user];
    }


   // view fn for frontend maybe 
   function getPendingWithdrawals(address _user)external view returns (uint256 amount , string raastId , bool isProcessed) {
    Withdrawal storage request=pendingWithdrawals[_user];
    return (request.amount , request.raastId , request.isProcessed);
   } 
}