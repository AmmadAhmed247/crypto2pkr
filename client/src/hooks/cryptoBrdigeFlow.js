import { QueryClient, useMutation , useQuery , useQueryClient } from "@tanstack/react-query";
import { lockUserFunds , refundFunds , getPending } from "../services/allContractServices.js";
import {useAccount}from "wagmi"

export const completeUserFlow=()=>{
    const{address}=useAccount();
    const queryClient=useQueryClient()
    const lockMutation=useMutation({
        mutationFn:lockUserFunds,
        onSuccess:(tx)=>{
            console.log(`Success ~  HASH :${tx.hash}`);
            queryClient.invalidateQueries(['pendingWithdrawal',address])
        }
    })
    const refundMutation=useMutation({
        mutationFn:refundFunds,
        onSuccess:()=>{
            queryClient.invalidateQueries(["pendingWithdrawal",address])
            alert('Refund process sucessfully...')
        }
    })
    const pendingWithdrawalMutation=useQuery({
        queryKey:['pendingWithdrawal', address],
        queryFn:()=>getPending(address),
        enabled:!!address , 
        refetchInterval:5000,
    });

    return {
        //for lock 
        lock:lockMutation.mutate,
        isLocking:lockMutation.isPending,
        lockError:lockMutation.error,


        //Refund
        refund:refundMutation.mutate,
        refundError:refundMutation.error,
        isRefunding:refundMutation.isPending,

        //Data
        pendingData:pendingWithdrawalMutation.data,
        isLoadingPending:pendingWithdrawalMutation.isLoading
    }
}


