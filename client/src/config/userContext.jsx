import { usePrivy, useWallets } from "@privy-io/react-auth";
import { formatEther } from "ethers";
import React, { useEffect, useState, createContext, useContext, useMemo } from "react";
import { BrowserProvider } from "zksync-ethers";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const { user, authenticated, ready, logout ,login , linkWallet} = usePrivy();
    const { wallets } = useWallets();
    const [balance, setBalance] = useState("0.000000");
    const wallet = wallets.length > 0 ? wallets[0] : null;
    const smartAddress = user?.smartWallet?.address;
    const embeddedAddress = user?.wallet?.address;
    const address = smartAddress || embeddedAddress;

    console.log(address);
    
 

    const fetchBalance = async () => {
        if (!wallet || !address) return;
        try {
            const eip1193Provider = await wallet.getEthereumProvider();
            const provider = new BrowserProvider(eip1193Provider);
            const rawBalance = await provider.getBalance(address);
            const balance=formatEther(rawBalance)
            setBalance(Number(balance).toFixed(6));
        } catch (error) {
            console.error("Failed to fetch balance:", error);
        }
    };

    useEffect(() => {
        if (authenticated && wallet) {
            fetchBalance();
            const interval = setInterval(fetchBalance, 10000);
            return () => clearInterval(interval);
        }
    }, [authenticated, wallet, address]);

    const configValues = useMemo(() => ({
        address: address?.toLowerCase(),
        email: user?.google?.email || user?.email?.address,
        isAuthenticated: authenticated && !!address,
        balance,
        isReady: ready,
        wallet,
        wallets,
        logout,
        login,
        linkWallet
    }), [address, user, authenticated, ready, wallet, wallets, balance, logout, login, linkWallet]);

    return (
        <UserContext.Provider value={configValues}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);