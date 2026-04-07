import { usePrivy, useWallets, useCreateWallet } from "@privy-io/react-auth";
import { formatEther , formatUnits , Contract } from "ethers";
import React, { useEffect, useState, createContext, useContext, useMemo } from "react";
import { BrowserProvider } from "zksync-ethers";

const UserContext = createContext();

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const TOKENS = {
    USDC: "0xae045de5638162fa134807cb558e15a3f5a7f853",
    USDT: "0x0000000000000000000000000000000000000000", 
}

export const UserProvider = ({ children }) => {
    const { user, authenticated, ready, logout, login, linkWallet } = usePrivy();
    const { wallets } = useWallets();
    const { createWallet } = useCreateWallet();
    const [balance, setBalances] = useState({
        eth: "0.000",
        usdc: "0.00",
        usdt: "0.00"
    });
    const [walletReady, setWalletReady] = useState(false);
    const wallet = wallets.length > 0 ? wallets[0] : null;
    const smartAddress = user?.smartWallet?.address;
    const embeddedAddress = user?.wallet?.address;
    const address = smartAddress || embeddedAddress;

    useEffect(() => {
        const ensureWallet = async () => {
            if (!ready || !authenticated) return;

            const hasEmbeddedWallet = user?.linkedAccounts?.some(
                (account) => account.type === "wallet" && account.walletClientType === "privy"
            );

            if (!hasEmbeddedWallet) {
                try {
                    console.log("Creating embedded wallet...");
                    await createWallet();
                    setWalletReady(true);
                } catch (err) {
                    console.error("Failed to create wallet:", err);
                }
            } else {
                setWalletReady(true);
            }
        };

        ensureWallet();
    }, [ready, authenticated, user]);

    const fetchBalance = async () => {
  if (!wallet || !address) return;
  try {
    await wallet.switchChain(300);
    const eip1193Provider = await wallet.getEthereumProvider();
    const provider = new BrowserProvider(eip1193Provider);

    const ethRaw = await provider.getBalance(address);
    const ethFormatted = Number(formatEther(ethRaw)).toFixed(4);

    let usdcFormatted = "0.00";
    try {
      const usdcContract = new Contract(TOKENS.USDC, ERC20_ABI, provider);
      const usdcRaw = await usdcContract.balanceOf(address);
      usdcFormatted = Number(formatUnits(usdcRaw, 6)).toFixed(2);
    } catch (e) { console.error("USDC fetch failed", e); }

    let usdtFormatted = "0.00";
    if (TOKENS.USDT !== "0x0000000000000000000000000000000000000000") {
      try {
        const usdtContract = new Contract(TOKENS.USDT, ERC20_ABI, provider);
        const usdtRaw = await usdtContract.balanceOf(address);
        usdtFormatted = Number(formatUnits(usdtRaw, 6)).toFixed(2);
      } catch (e) { console.error("USDT fetch failed", e); }
    }

    setBalances({
      eth: ethFormatted,
      usdc: usdcFormatted,
      usdt: usdtFormatted
    });

  } catch (error) {
    console.error("Failed to fetch balance:", error);
  }
};

    useEffect(() => {
        if (authenticated && wallet && walletReady) {
            fetchBalance();
            const interval = setInterval(fetchBalance, 10000);
            return () => clearInterval(interval);
        }
    }, [authenticated, wallet, address, walletReady]);

    const configValues = useMemo(() => ({
        address: address?.toLowerCase(),
        email: user?.google?.email || user?.email?.address,
        isAuthenticated: authenticated,
        isWalletReady: walletReady && !!address,
        balance,
        isReady: ready,
        wallet,
        wallets,
        logout,
        login,
        linkWallet,
    }), [address, user, authenticated, ready, wallet, wallets, balance, logout, login, linkWallet, walletReady]);

    return (
        <UserContext.Provider value={configValues}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);