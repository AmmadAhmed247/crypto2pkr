import { BrowserProvider, Contract } from "ethers";
import vaultAbi from "./abi.json";

export const ZKSYNC_SEPOLIA = {
  chainId: 300,
  chainIdHex: "0x12C",
  name: "zkSync Sepolia Testnet",
  rpcUrl: "https://sepolia.era.zksync.dev",
  explorer: "https://sepolia.explorer.zksync.io/",
};

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

export const switchToZkSyncSepolia = async (wallets) => {
  if (!wallets?.length) throw new Error("No wallet connected");
  try {
    await wallets[0].switchChain(ZKSYNC_SEPOLIA.chainId);
    return true;
  } catch (error) {
    console.error("Failed to switch network:", error);
    throw new Error(
      "Failed to switch to zkSync Sepolia. Please switch manually in your wallet."
    );
  }
};

export const isOnZkSyncSepolia = (currentChainId) =>
  currentChainId === `eip155:${ZKSYNC_SEPOLIA.chainId}` ||
  currentChainId === ZKSYNC_SEPOLIA.chainId ||
  currentChainId === ZKSYNC_SEPOLIA.chainIdHex;


export const getProvider = async (wallets, activeAddress) => {
  if (!wallets?.length) throw new Error("No wallet connected.");

  const activeWallet = wallets.find(
    (w) => w.address.toLowerCase() === activeAddress.toLowerCase()
  );

  if (activeWallet?.walletClientType !== "privy") {
    if (window.ethereum) return new BrowserProvider(window.ethereum);
  }

  const eip1193 = await activeWallet.getEthereumProvider();
  return new BrowserProvider(eip1193);
};


export const getSignedContract = async (wallets, activeAddress) => {
  const provider = await getProvider(wallets, activeAddress);
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, vaultAbi.abi, signer);
};

export const getReadOnlyContract = async (wallets, activeAddress) => {
  const provider = await getProvider(wallets, activeAddress);
  return new Contract(CONTRACT_ADDRESS, vaultAbi.abi, provider);
};