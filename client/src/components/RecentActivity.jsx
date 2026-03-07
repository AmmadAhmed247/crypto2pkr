import { useQuery } from '@tanstack/react-query';
import React from 'react'
import axios from "axios"
function TypeBadge({ type }) {
  const cfg = {
    send:    "bg-green-50 text-green-700 border-green-200",
    receive: "bg-emerald-50 text-emerald-700 border-emerald-200",
    claim:   "bg-teal-50 text-teal-700 border-teal-200",
  };
  const icons = { send:"↑", receive:"↓", claim:"◈" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg[type]}`}>
      {icons[type]} {type.charAt(0).toUpperCase()+type.slice(1)}
    </span>
  );
}
function StatusBadge({ status }) {
  const cfg = {
    confirmed:{ wrap:"bg-green-50 text-green-700 border-green-200",  dot:"bg-green-500"  },
    pending:{ wrap:"bg-yellow-50 text-yellow-700 border-yellow-200",dot:"bg-yellow-400" },
    claimable:{ wrap:"bg-teal-50 text-teal-700 border-teal-200",     dot:"bg-teal-500"   },
    failed:{ wrap:"bg-red-50 text-red-700 border-red-200",        dot:"bg-red-500"    },
    BRIDGE:{ wrap:"bg-green-50 text-green-700 border-green-200", dot:"bg-green-500" },
    SENT:{ wrap:"bg-orange-50 text-orange-700 border-orange-200", dot:"bg-orange-500" },
    DEPOSIT:{ wrap:"bg-emerald-50 text-emerald-700 border-emerald-200", dot:"bg-emerald-500" },
    
  };
  const s = cfg[status] || cfg.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.wrap}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>
      {status.charAt(0).toUpperCase()+status.slice(1)}
    </span>
  );
}
const trunc = (a) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : "—";


const RecentActivity=({  address , txFilter })=> {
const { data: userTransactions, isLoading } = useQuery({
    queryKey: ["transactionData", address],
    queryFn: async () => {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/transactions/user/${address}`);
        return res.data;
    },
    enabled: !!address,
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval: 5000,
});
const allTxs = userTransactions?.transactions ?? [];
const filtered = allTxs.filter(tx => {
        if (!txFilter || txFilter === "all") return true;
        if (txFilter === "send")      return tx.type === "SENT";
        if (txFilter === "receive")   return tx.type === "DEPOSIT";
        if (txFilter === "claim")     return tx.type === "BRIDGE";
        if (txFilter === "confirmed") return tx.status === "PAID";
        if (txFilter === "pending")   return tx.status === "LOCKED";
        if (txFilter === "claimable") return tx.status === "REFUNDED";
        return true;
    });

    console.log(filtered);
    


console.log('Backend Response:', userTransactions);
console.log('PKR:', userTransactions?.totalPkr); 
console.log('USD:', userTransactions?.totalUsd);
  
const fmt=(d)=> new Date(d).toLocaleDateString("en-US",{day:"numeric",year:"numeric",month:"short"})
  
  const heads = ["Address","Amount","PKR Value","Raast ID","Status","Type","Lock TxHash","Payout TxHash" , "Date"].filter(Boolean);
  if (isLoading) return <div className="py-16 text-center text-green-300">Fetching history...</div>;
  if (!filtered.length) return <div className="py-16 text-center text-green-300 text-sm">No transactions found.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-green-50 border-b border-green-100">
            {heads.map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold text-green-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered?.map((tx, i) => (
            <tr key={tx.id} className={`border-b border-green-50 hover:bg-green-50/60 transition-colors ${i%2===0 ? "bg-white" : "bg-green-50/20"}`}>
              <td className="px-4 py-3.5 mono text-xs text-gray-400">{trunc(tx.userAddress)}</td>
              <td className="px-4 py-3.5 font-bold text-green-900">{tx.lockedAmount} <span className={` text-xs  ${tx.tokenSymbol=="ETH" ? "text-blue-600 bg-blue-50 py-1 px-0.5 rounded-md":"text-green-500"}`} >{tx.tokenSymbol}</span> </td>
              {/* <td className={`${tx.tokenSymbol=="ETH" ? "text-blue-500 ": "text-green-400"}  px-4 py-3.5`}><TypeBadge type={tx.tokenSymbol}/></td> */}
              <td className="px-4 py-3.5 text-emerald-600 text-xs font-medium">{tx.pkrAmount}</td>
              <td className="px-4 py-3.5 mono text-xs text-gray-500">{tx.raastId}</td>
              <td className="px-4 py-3.5"><StatusBadge status={tx.status}/></td>
              <td className="px-4 py-3.5"><StatusBadge status={tx.type}/></td>
              <td className="px-4 py-3.5 mono text-xs text-zinc-600">{trunc(tx.lockTxHash)}</td>
              <td className="px-4 py-3.5 mono text-xs text-zinc-600">{trunc(tx.payoutTxHash)}</td>
              <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{fmt(tx.createdAt)}</td>
              
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecentActivity