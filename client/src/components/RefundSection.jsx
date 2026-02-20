import React from 'react'
import { refundUserFunds } from '../api/bridgeService'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import{usePrivy  , useWallets} from "@privy-io/react-auth"
const RefundSection = ({ pendingTimeStamps }) => {
    const{authenticated , user}=usePrivy();
    const{wallet}=useWallets();
    const address=user?.wallet?.address;
    const queryClient = useQueryClient()
    const oneHour = 3600;
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = (Number(pendingTimeStamps) + oneHour) - now;
    const canRefund = timeLeft <= 0;
    const mutation = useMutation({
        mutationFn: () => refundUserFunds(address), 
        onSuccess: () => {
            alert(`Refund Successfully...`);
            queryClient.invalidateQueries({ queryKey: ['pendingwithdrawals', address] }); 
            queryClient.invalidateQueries({ queryKey: ['balance', address] }); 
        },
        onError: (error) => {
            alert(`Error while refunding... ${error.message}`)
        }
    });

    if (!pendingTimeStamps) {
        return null;
    }

    return (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
            {!canRefund ? (
                <p className='text-xs text-gray-600 italic text-center'>
                    Self Refund Available in {Math.ceil(timeLeft / 60)} mins
                </p>
            ) : (
                <button 
                    onClick={() => mutation.mutate()} 
                    disabled={mutation.isPending} 
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-all"
                >
                    {mutation.isPending ? "Claiming..." : "Claim Refund (Time Lock Over)"}
                </button>
            )}
        </div>
    )
}

export default RefundSection