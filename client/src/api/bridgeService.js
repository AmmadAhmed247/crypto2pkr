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


const getPrivyProvider = async (wallets) => {
  if (!wallets || wallets.length === 0) {
    throw new Error("No wallet connected. Please connect your wallet.");
  }

  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
  const activeWallet = embeddedWallet || wallets[0];

  const provider = await activeWallet.getEthereumProvider();
  return new BrowserProvider(provider);
};


export const switchToZkSyncSepolia = async (wallets) => {
  if (!wallets || wallets.length === 0) {
    throw new Error("No wallet connected");
  }

  const activeWallet = wallets[0];
  
  try {
    await activeWallet.switchChain(ZKSYNC_SEPOLIA.chainId);
    console.log("Switched to zkSync Sepolia");
    return true;
  } catch (error) {
    console.error("Failed to switch network:", error);
    throw new Error("Failed to switch to zkSync Sepolia. Please switch manually in your wallet.");
  }
};


export const isOnZkSyncSepolia = (currentChainId) => {
  return currentChainId === `eip155:${ZKSYNC_SEPOLIA.chainId}` || 
         currentChainId === ZKSYNC_SEPOLIA.chainId ||
         currentChainId === ZKSYNC_SEPOLIA.chainIdHex;
};

const getContract = async (wallets) => {
  const provider = await getPrivyProvider(wallets);
  const signer = await provider.getSigner();
  return new Contract(contractAddress, vaultAbi.abi, signer);
};

const getReadOnlyContract = async (wallets) => {
  const provider = await getPrivyProvider(wallets);
  return new Contract(contractAddress, vaultAbi.abi, provider);
};


export const lockUserFund = async ({ tokenAddress, amount, raastId, wallets }) => {
  try {
    if (!wallets || wallets.length === 0) {
      throw new Error("No wallet connected");
    }

    const contract = await getContract(wallets);
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
    const receipt =await tx.wait();
    console.log(" Transaction confirmed:", receipt.hash);

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


export const refundUserFunds = async (wallets) => {
  if (!wallets || wallets.length === 0) {
    throw new Error("No wallet connected");
  }

  try {
    const contract = await getContract(wallets);
    const tx = await contract.requestFund();
    
    console.log(` Refund transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(` Refund successful: ${receipt.hash}`);
    
    return receipt;
  } catch (error) {
    console.error(`Refund failed:`, error);
    
    if (error.message?.includes("Refund timelock active")) {
      throw new Error("Please wait! Timelock is still active.");
    }
    if (error.message?.includes("No pending request")) {
      throw new Error("No pending request to refund");
    }
    
    throw error;
  }
};

export const fetchPendingStatus = async (address, wallets) => {
  if (!address) return null;

  try {
    const contract = await getReadOnlyContract(wallets);
    const result = await contract.pendingWithdrawals(address);
    
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


export const getTokenBalance = async (tokenAddress, userAddress, wallets) => {
  try {
    const provider = await getPrivyProvider(wallets);
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