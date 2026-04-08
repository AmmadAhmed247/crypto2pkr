import { usePrivy, useWallets, useCreateWallet } from "@privy-io/react-auth";
import { formatEther, formatUnits, Contract } from "ethers";
import React, { useEffect, useState, createContext, useContext, useMemo } from "react";
import { getProvider } from "../utils/contractHelpers.js"

const UserContext = createContext();

const TOKENS = {
  USDC: "0xae045de5638162fa134807cb558e15a3f5a7f853",
  USDT: "0x0000000000000000000000000000000000000000",
};

const ERC20_BALANCE_ABI = ["function balanceOf(address) view returns (uint256)"];

export const UserProvider = ({ children }) => {
  const { user, authenticated, ready, logout, login, linkWallet } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();

  const [balance, setBalances] = useState({ eth: "0.000", usdc: "0.00", usdt: "0.00" });
  const [walletReady, setWalletReady] = useState(false);

  const wallet = wallets[0] ?? null;
  const address = user?.smartWallet?.address || user?.wallet?.address;

  // Create embedded wallet on first login if one doesn't exist yet
  useEffect(() => {
    const ensureWallet = async () => {
      if (!ready || !authenticated) return;

      const hasEmbeddedWallet = user?.linkedAccounts?.some(
        (a) => a.type === "wallet" && a.walletClientType === "privy"
      );

      if (!hasEmbeddedWallet) {
        try {
          console.log("Creating embedded wallet...");
          await createWallet();
        } catch (err) {
          console.error("Failed to create wallet:", err);
        }
      }

      setWalletReady(true);
    };

    ensureWallet();
  }, [ready, authenticated, user]);

  // Poll balances every 4s while the wallet is active
  useEffect(() => {
    if (!authenticated || !wallet || !walletReady || !address) return;

    const fetchBalance = async () => {
      try {
        await wallet.switchChain(300);
        const provider = await getProvider(wallets, address);

        const ethRaw = await provider.getBalance(address);
        const ethFormatted = Number(formatEther(ethRaw)).toFixed(4);

        let usdcFormatted = "0.00";
        try {
          const usdcContract = new Contract(TOKENS.USDC, ERC20_BALANCE_ABI, provider);
          const usdcRaw = await usdcContract.balanceOf(address);
          usdcFormatted = Number(formatUnits(usdcRaw, 6)).toFixed(2);
        } catch (e) {
          console.error("USDC fetch failed", e);
        }

        let usdtFormatted = "0.00";
        if (TOKENS.USDT !== "0x0000000000000000000000000000000000000000") {
          try {
            const usdtContract = new Contract(TOKENS.USDT, ERC20_BALANCE_ABI, provider);
            const usdtRaw = await usdtContract.balanceOf(address);
            usdtFormatted = Number(formatUnits(usdtRaw, 6)).toFixed(2);
          } catch (e) {
            console.error("USDT fetch failed", e);
          }
        }

        setBalances({ eth: ethFormatted, usdc: usdcFormatted, usdt: usdtFormatted });
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 4000);
    return () => clearInterval(interval);
  }, [authenticated, wallet, address, walletReady]);

  const configValues = useMemo(
    () => ({
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
    }),
    [address, user, authenticated, ready, wallet, wallets, balance, logout, login, linkWallet, walletReady]
  );

  return <UserContext.Provider value={configValues}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);