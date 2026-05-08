import { useQuery } from "@tanstack/react-query";

const CUSTOM_USDC_RATE = Number(import.meta.env.VITE_PKR_RATE) || 285;

export const useExchangeRate = (symbol) => {
  return useQuery({
    queryKey: ["exchangeRate", symbol],

    queryFn: async () => {

      if (symbol === "USDC") {
        console.log("Using custom USDC rate:", CUSTOM_USDC_RATE);
        return CUSTOM_USDC_RATE;
      }

      if (symbol === "USDT") {
        return CUSTOM_USDC_RATE;
      }
      if (symbol!== "ETH") {
        throw new Error("Unsupported token"); 
      }

      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=pkr"
      );

      const data = await response.json();

      return data.ethereum.pkr;
    },

    refetchInterval: 50000,
    staleTime: 50000,
  });
};