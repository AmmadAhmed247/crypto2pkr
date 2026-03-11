import { usePrivy, useWallets, useCreateWallet } from "@privy-io/react-auth";
import { formatEther } from "ethers";
import React, { useEffect, useState, createContext, useContext, useMemo } from "react";
import { BrowserProvider } from "zksync-ethers";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const { user, authenticated, ready, logout, login, linkWallet } = usePrivy();
    const { wallets } = useWallets();
    const { createWallet } = useCreateWallet();
    const [balance, setBalance] = useState("0.000000");
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
            const rawBalance = await provider.getBalance(address);
            setBalance(Number(formatEther(rawBalance)).toFixed(6));
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