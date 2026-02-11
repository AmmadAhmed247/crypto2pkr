import { Contract } from "zksync-ethers";
import { BrowserProvider, parseUnits } from "ethers";
import vaultAbi from '../utils/abi.json';

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

const ZKSYNC_SEPOLIA = {
  chainId: 300,
  chainIdHex: "0x12C",
  name: "zkSync Sepolia Testnet",
  rpcUrl: "https://sepolia.era.zksync.dev",
  explorer: "https://sepolia.explorer.zksync.io/"
};


const getMetaMaskProvider = () => {
  if (window.ethereum?.isMetaMask) {
    return window.ethereum;
  }
  
  if (window.ethereum?.providers) {
    const metamaskProvider = window.ethereum.providers.find(
      (provider) => provider.isMetaMask
    );
    if (metamaskProvider) {
      return metamaskProvider;
    }
  }
  
  throw new Error("MetaMask not detected. Please install MetaMask extension.");
};


const getProvider = async () => {
  const ethereum = getMetaMaskProvider();
  await ensureZkSyncNetwork();
  const provider = new BrowserProvider(ethereum);
  try {
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== ZKSYNC_SEPOLIA.chainId) {
      throw new Error(`Wrong network: got ${network.chainId}, expected ${ZKSYNC_SEPOLIA.chainId}`);
    }
  } catch (err) {
    console.error("Provider network check failed:", err);
    throw new Error("Failed to verify zkSync Sepolia network");
  }

  return provider;
};

const getContract = async () => {
  const provider = await getProvider();
  const signer = await provider.getSigner();

  return new Contract(contractAddress, vaultAbi.abi, signer);
};

const getReadOnlyContract = async () => {
  const provider = await getProvider();
  return new Contract(contractAddress, vaultAbi.abi, provider);
};

export const lockUserFund = async ({ tokenAddress, amount, raastId }) => {
  try {
    await ensureZkSyncNetwork();
    const contract = await getContract();

    const parsedAmount = parseUnits(amount.toString(), 18);
    const isEth = tokenAddress === "0x0000000000000000000000000000000000000000";

    console.log(" Locking funds:", {
      tokenAddress,
      raastId,
      amount: parsedAmount.toString(),
      isEth
    });

    const tx = await contract.lockUserRequest(
      tokenAddress,
      parsedAmount,
      raastId,
      {
        value: isEth ? parsedAmount : 0n,
      }
    );

    console.log(" Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.hash);

    return receipt;
  } catch (error) {
    console.error(" Lock failed:", error);

    if (error.code === 4001 || error.code === "ACTION_REJECTED") {
      throw new Error("Transaction rejected by user");
    }
    if (error.code === "INSUFFICIENT_FUNDS") {
      throw new Error("Insufficient balance for amount + gas");
    }
    if (error.message?.includes("Wait for previous request")) {
      throw new Error("You have a pending request. Please wait.");
    }
    if (error.message?.includes("Token not whitelisted")) {
      throw new Error("This token is not supported");
    }
    
    throw error;
  }
};
export const refundUserFunds=async(address)=>{
  if(!address) return null;
  try {
    await ensureZkSyncNetwork()
    const contract=await getContract();
    const tx=await contract.requestFund();
    console.log(`Refund Transaction Hash:${tx.hash}`);
    const recipt=await tx.wait();
    console.log(`Refunded Successfully:${recipt.hash}`);
    return recipt;
    
    
  } catch (error) {
    console.error(`Refund Claim failed.. ${error}`);
    if(error.message?.includes("Refund timelock active")){
      throw new Error(`Please wait ! time lock is still active..`);

    }
    if(error.message?.includes("No pending request")){
      console.error(`No Refund request Available..`);
      }

    throw error;

  }
}

export const fetchPendingStatus = async (address) => {
  if (!address) return null;

  try {
    const contract = await getReadOnlyContract();
    const result = await contract.pendingWithdrawals(address)
    if (result.amount.toString() === '0' || result.isProcessed) {
      return null;
    }

    return {
      amount: result.amount.toString(),
      raastId: result.raastId,
      isProcessed: result.isProcessed,
      timestamp: Number(result.timestamp) 
    };
  } catch (error) {
    console.error("Failed to fetch pending status:", error);
    return null;
  }
};

export const ensureZkSyncNetwork = async () => {
  const ethereum = getMetaMaskProvider();

  let chainId;
  try {
    chainId = await ethereum.request({ method: 'eth_chainId' });
  } catch (err) {
    throw new Error("Cannot read current chain");
  }

  if (chainId === ZKSYNC_SEPOLIA.chainIdHex) {
    return true;
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ZKSYNC_SEPOLIA.chainIdHex }],
    });
    await new Promise(r => setTimeout(r, 1000));
    return true;
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: ZKSYNC_SEPOLIA.chainIdHex,
            chainName: ZKSYNC_SEPOLIA.name,
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: [ZKSYNC_SEPOLIA.rpcUrl],
            blockExplorerUrls: [ZKSYNC_SEPOLIA.explorer]
          }]
        });
        await new Promise(r => setTimeout(r, 1500));
        return true;
      } catch (addError) {
        console.error("Failed to add network:", addError);
        throw new Error("Failed to add zkSync Sepolia to MetaMask");
      }
    }
    console.error("Switch network failed:", switchError);
    throw new Error("Please manually switch to zkSync Sepolia in MetaMask");
  }
};

export const getTokenBalance = async (tokenAddress, userAddress) => {
  try {
    await ensureZkSyncNetwork();
    const provider = await getProvider();
    const isEth = tokenAddress === "0x0000000000000000000000000000000000000000";

    if (isEth) {
      const balance = await provider.getBalance(userAddress);
      return (Number(balance) / 1e18).toFixed(6);
    }

    const tokenAbi = ["function balanceOf(address) view returns (uint256)"];
    const tokenContract = new Contract(tokenAddress, tokenAbi, provider);
    const balance = await tokenContract.balanceOf(userAddress);
    return (Number(balance) / 1e18).toFixed(6);
  } catch (error) {
    console.error("Failed to fetch balance:", error);
    return "0.000000";
  }
};


export const isMetaMaskInstalled = () => {
  if (window.ethereum?.isMetaMask) return true;
  if (window.ethereum?.providers) {
    return window.ethereum.providers.some(p => p.isMetaMask);
  }
  return false;
};

export const connectMetaMask = async () => {
  try {
    const ethereum = getMetaMaskProvider();
    const accounts = await ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    return accounts[0];
  } catch (error) {
    console.error("Failed to connect MetaMask:", error);
    throw new Error("Failed to connect to MetaMask");
  }
};