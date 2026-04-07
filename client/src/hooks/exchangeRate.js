
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const USD_TO_PKR = 282;

export const useExchangeRate = (symbol) => {
  return useQuery({
    queryKey: ["price", symbol],
    enabled: !!symbol, 
    queryFn: async () => {
      const { data } = await axios.get(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`
      );
      const usdPrice = parseFloat(data.price);
      return usdPrice * USD_TO_PKR;
    },
    refetchInterval: 60000,
  });
};
