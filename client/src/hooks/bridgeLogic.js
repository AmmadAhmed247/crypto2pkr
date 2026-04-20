import { useUser } from "../context/userContext";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { lockUserFund } from "../utils/contractWrites";


export const useBridgeLogic=(exchangeRate , selectedCrypto)=>{
    const {wallet, wallets , address}=useUser();
    const queryClient=useQueryClient();
    const[cryptoAmount, setCryptoAmount]=useState('');
    
    const[raastId , setRaastId]=useState("");
    const[step , setStep]=useState(1);
    const pkrAmount = (!cryptoAmount || exchangeRate <= 0) 
    ? "0.00" 
    : (parseFloat(cryptoAmount) * exchangeRate).toFixed(2);
    

    const handleChangeAmount = (value) => {
    if (value === '' || !isNaN(value)) {
      setCryptoAmount(value);
    }
  };

    const{mutate:lockFunds , isPending:isLocking , error:lockError}=useMutation({
        mutationFn:({ tokenAddress, amount, raastId }) =>{
            if(!wallet){
                throw new Error("Wallet not connected!");
            };
            return lockUserFund({ tokenAddress, amount, raastId, wallets , address });
        },
        onSuccess:()=>{
            queryClient.invalidateQueries({queryKey:["balance",address]});
            setStep(4);
        },
        onError:()=>{
            setStep(2);
        }
    })

    const resetBridge=()=>{
        setStep(1);
        setCryptoAmount("");
        
        setRaastId("")
    }
    return {
        cryptoAmount , pkrAmount , raastId , step , setStep , isLocking , lockError , handleChangeAmount , lockFunds , resetBridge , setRaastId
    }
}