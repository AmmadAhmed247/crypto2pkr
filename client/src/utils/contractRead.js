import { Contract, BrowserProvider } from "ethers";
import vaultAbi from '../utils/abi.json';

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

const ZKSYNC_SEPOLIA_CHAIN_ID = 300;


const getReadOnlyProvider = async (wallets) => {
  if (!wallets?.length) throw new Error("No wallet connected.");
  const eip1193 = await wallets[0].getEthereumProvider();
  return new BrowserProvider(eip1193);
};

const getReadOnlyContract = async (wallets) => {
  const provider = await getReadOnlyProvider(wallets);
  return new Contract(contractAddress, vaultAbi.abi, provider);
};


export const isOnZkSyncSepolia = (currentChainId) => {
  return (
    currentChainId === `eip155:${ZKSYNC_SEPOLIA_CHAIN_ID}` ||
    currentChainId === ZKSYNC_SEPOLIA_CHAIN_ID ||
    currentChainId === "0x12C"
  );
};


export const getTokenBalance = async (tokenAddress, userAddress, wallets) => {
  try {
    const provider = await getReadOnlyProvider(wallets);
    const isEth = tokenAddress === "0x0000000000000000000000000000000000000000";

    if (isEth) {
      const balance = await provider.getBalance(userAddress);
      return (Number(balance) / 1e18).toFixed(6);
    }

    const tokenContract = new Contract(
      tokenAddress,
      ["function balanceOf(address) view returns (uint256)"],
      provider
    );
    const balance = await tokenContract.balanceOf(userAddress);
    return (Number(balance) / 1e6).toFixed(2);
  } catch (error) {
    console.error("Failed to fetch balance:", error);
    return "0.00";
  }
};


export const fetchPendingStatus = async (address, wallets) => {
  if (!address) return null;
  try {
    const contract = await getReadOnlyContract(wallets);
    const counter = await contract.userRequestCounter(address);
    if (counter === 0n) return null;

    const latestId = counter - 1n;
    const result = await contract.withdrawals(address, latestId);

    if (result.amount === 0n || result.isProcessed) return null;

    return {
      requestId: latestId.toString(),
      amount: result.amount.toString(),
      raastId: result.raastId,
      isProcessed: result.isProcessed,
      timestamp: Number(result.timestamp),
    };
  } catch (error) {
    console.error("Failed to fetch pending status:", error);
    return null;
  }
};


export const fetchAllWithdrawals = async (address, wallets) => {
  if (!address) return [];
  try {
    const contract = await getReadOnlyContract(wallets);
    const counter = await contract.userRequestCounter(address);
    if (counter === 0n) return [];
    const now = Math.floor(Date.now() / 1000);
    const TIMELOCK = 60 * 60 ;
    const ids = Array.from({ length: Number(counter) }, (_, i) => BigInt(i));
    const results = await Promise.all(
      ids.map(async (id) => {
        const w = await contract.withdrawals(address, id);
        if (w.amount === 0n || w.isProcessed) return null;

        const unlocksAt = Number(w.timestamp) + TIMELOCK;
        const isClaimable = now > unlocksAt;
        
        

        return {
          requestId: id.toString(),
          amount: w.amount,
          token: w.token,
          raastId: w.raastId,
          timestamp: Number(w.timestamp),
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


export const isTokenWhitelisted = async (tokenAddress, wallets, signerAddress) => {
  const contract = await getReadOnlyContract(wallets);
  return contract.whiteListedTokens(tokenAddress);
};