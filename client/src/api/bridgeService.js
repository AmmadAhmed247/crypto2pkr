import { Contract, parseUnits, BrowserProvider } from "ethers";
import vaultAbi from '../utils/abi.json';


const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

const ZKSYNC_SEPOLIA = {
  chainId: 300,
  chainIdHex: "0x12C",
  name: "zkSync Sepolia Testnet",
  rpcUrl: "https://sepolia.era.zksync.dev",
  explorer: "https://sepolia.explorer.zksync.io/"
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


const getPrivyProvider = async (wallets, activeAddress) => {
  if (!wallets || wallets.length === 0) throw new Error("No wallet connected.");

  const activeWallet = wallets.find(
    (w) => w.address.toLowerCase() === activeAddress.toLowerCase()
  );

  if (activeWallet?.walletClientType !== 'privy') {
    console.log("Using Extension Provider (MetaMask/OKX)");
    // Directly use window.ethereum for extension wallets to avoid Privy UI
    if (window.ethereum) {
      return new BrowserProvider(window.ethereum);
    }
  }

  console.log("Using Privy Embedded Provider");
  const eip1193 = await activeWallet.getEthereumProvider();
  return new BrowserProvider(eip1193);
};

const getContract = async (wallets, activeAddress) => {
  const provider = await getPrivyProvider(wallets, activeAddress);
  const signer = await provider.getSigner();
  console.log("Signer address:", await signer.getAddress());
  return new Contract(contractAddress, vaultAbi.abi, signer);
};

export const lockUserFund = async ({ tokenAddress, amount, raastId, wallets, address }) => {
  try {
    const contract = await getContract(wallets, address);
    const isWhitelisted = await contract.whiteListedTokens(tokenAddress);
    
    if (!isWhitelisted && tokenAddress !== "0x0000000000000000000000000000000000000000") {
      throw new Error("Token is NOT whitelisted in the contract!");
    }

    if (!wallets || wallets.length === 0) throw new Error("No wallet connected");

    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    const isEth = tokenAddress === "0x0000000000000000000000000000000000000000";
    const decimal = isEth ? 18 : 6;
    const parsedAmount = parseUnits(amount.toString(), decimal);
    // ERC20: handle approval first
    if (!isEth) {
      const eip1193 = await wallets[0].getEthereumProvider();
      const provider = new BrowserProvider(eip1193);
      const signer = await provider.getSigner();
      const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);

      const currentAllowance = await tokenContract.allowance(address, contractAddress);
      if (BigInt(currentAllowance) < BigInt(parsedAmount)) {
        const approveTx = await tokenContract.approve(contractAddress, parsedAmount);
        await approveTx.wait(1);
        console.log("Approval confirmed.");
      }
    }

    let lockTx;
    if (isEth) {
      lockTx = await contract.lockUserRequest(
        tokenAddress,
        parsedAmount,
        raastId,
        { value: parsedAmount } 
      );
    } else {
      lockTx = await contract.lockUserRequest(
        tokenAddress,
        parsedAmount,
        raastId
      );
    }

    await lockTx.wait(1);
    console.log("Funds locked successfully:", lockTx.hash);
    return lockTx;

  } catch (error) {
    console.error("Lock failed:", error);
    
    if (error.code === 4001 || error.code === "ACTION_REJECTED") {
      throw new Error("Transaction rejected by user");
    }
    if (error.code === "INSUFFICIENT_FUNDS") {
      throw new Error("Insufficient balance for amount + gas");
    }
    if (error.message?.includes("Wait for previous request")) {
      throw new Error("You have a pending request. Please wait.");
    }
    if (error.message?.includes("Token Not WhiteListed")) {
      throw new Error("This token is not supported");
    }
    throw error;
  }
}


export const fetchPendingStatus = async (address, wallets) => {
  if (!address) return null;
  try {
    await switchToZkSyncSepolia(wallets);
    const contract = await getContract(wallets , address);
    const counter = await contract.userRequestCounter(address);
    if (counter === 0n) return null;
    const latestId = counter - 1n;
    const result = await contract.withdrawals(address, latestId);
    if (result.amount === 0n || result.isProcessed) {
      return null;
    }

    return {
      requestId: latestId.toString(), 
      amount: result.amount.toString(),
      raastId: result.raastId,
      isProcessed: result.isProcessed,
      timestamp: Number(result.timestamp)
    };
  } catch (error) {
    console.error("Failed to fetch pending status:", error);
    return null;
  }
}

export const fetchAllWithdrawals = async (address, wallets) => {
  if (!address) return [];
  try {
    const contract = await getReadOnlyContract(wallets);
    const counter= await contract.userRequestCounter(address);
    if (counter === 0n) return [];
    const now = Math.floor(Date.now() / 1000);
    const TIMELOCK = 24 * 60 * 60;
    const ids = Array.from({ length: Number(counter) }, (_, i) => BigInt(i));

    const results = await Promise.all(
      ids.map(async (id) => {
        const w = await contract.withdrawals(address, id);
        if (w.amount === 0n || w.isProcessed) return null;
        const unlocksAt   = Number(w.timestamp) + TIMELOCK;
        const isClaimable = now > unlocksAt;

        return {
          requestId:   id.toString(),
          amount:      w.amount,        
          token:       w.token,
          raastId:     w.raastId,
          timestamp:   Number(w.timestamp),
          unlocksAt,
          isClaimable,
          secondsLeft: isClaimable ? 0 : unlocksAt - now,
        };
      })
    );

    return results.filter(Boolean);
  } catch (error) {
    console.error("Failed to fetch withdrawals:", error);
    return [];
  }
};


export const refundUserFunds = async (wallets, requestId) => {
  if (!wallets?.length) throw new Error("No wallet connected");

  try {
    const contract = await getContract(wallets);
    const tx       = await contract.claimRefund(requestId);
    console.log(`Refund tx sent: ${tx.hash}`);
    const receipt  = await tx.wait();
    console.log(`Refund confirmed: ${receipt.hash}`);
    return receipt;
  } catch (error) {
    console.error("Refund failed:", error);

    if (error.code === 4001 || error.code === "ACTION_REJECTED") {
      throw new Error("Transaction rejected by user.");
    }
    if (error.message?.includes("TimeLock Active")) {
      throw new Error("Please wait — the 24h timelock is still active.");
    }
    if (error.message?.includes("Invalid Request")) {
      throw new Error("This request doesn't exist or was already claimed.");
    }

    throw error;
  }
};


export const getTokenBalance = async (tokenAddress, userAddress, wallets) => {
  try {
    const provider = await getPrivyProvider(wallets, userAddress);
    const isEth = tokenAddress === "0x0000000000000000000000000000000000000000";

    if (isEth) {
      const balance = await provider.getBalance(userAddress);
      return (Number(balance) / 1e18).toFixed(6);
    }


    const tokenAbi = ["function balanceOf(address) view returns (uint256)"];
    const tokenContract = new Contract(tokenAddress, tokenAbi, provider);
    const balance = await tokenContract.balanceOf(userAddress);
    
  
    return (Number(balance) / 1e6).toFixed(2); 
  } catch (error) {
    console.error("Failed to fetch balance:", error);
    return "0.00";
  }
};