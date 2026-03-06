import { useUser } from "../config/userContext";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { lockUserFund } from "../api/bridgeService";


export const useBridgeLogic=(exchangeRate , selectedCrypto)=>{
    const {wallet , address}=useUser();

    const queryClient=useQueryClient();
    const[cryptoAmount, setCryptoAmount]=useState('');
    const[pkrAmount, setPkrAmount]=useState('0.00');
    const[raastId , setRaastId]=useState("");
    const[step , setStep]=useState(1);
    

    const handleChangeAmount=(value)=>{
        setCryptoAmount(value);
        if(!value || exchangeRate<=0){
            setPkrAmount("0");
            return;
        }
        const pkr=(parseFloat(value)*exchangeRate).toLocaleString('en-US',{
            minimumFractionDigits:2 , maximumFractionDigits:2
        });
        setPkrAmount(pkr);
    }

    const{mutate:lockFunds , isPending:isLocking , error:lockError}=useMutation({
        mutationFn:({ tokenAddress, amount, raastId }) =>{
            if(!wallet){
                throw new Error("Wallet not connected!");
            };
            return lockUserFund({ tokenAddress, amount, raastId, wallets:[wallet] });
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
        setPkrAmount("");
        setRaastId("")
    }
    return {
        cryptoAmount , pkrAmount , raastId , step , setStep , isLocking , lockError , handleChangeAmount , lockFunds , resetBridge , setRaastId
    }
}