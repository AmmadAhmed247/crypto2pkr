import React, { useState } from 'react'
import {DollarSign , Phone , Fuel} from "lucide-react"
function SendModal({ onClose }) {
  const [amount, setAmount] = useState("");
  const [raast,  setRaast]  = useState("");
  const [token,  setToken]  = useState("USDT");
  const fee   = (parseFloat(amount||0) * 0.01).toFixed(2);
  const saved = (parseFloat(amount||0) * 0.28).toFixed(2);
  const ready = amount && raast;
  const PKR   = 279.3;

  return (
    <div className="animate-fade-in fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="animate-slide-up bg-white rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center px-6 py-5 border-b border-green-100">
          <h2 className="text-lg font-bold text-green-900">Send Funds</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-50 text-gray-400 hover:text-gray-600 transition-colors text-lg">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Amount (USDT)</label>
            <div className="flex items-center bg-green-50 border border-green-200 rounded-xl overflow-hidden focus-within:border-green-500 transition-colors">
              <span className="px-3 text-green-500 text-lg font-bold"><DollarSign  /></span>
              <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
                className="flex-1 bg-transparent py-3 text-green-900 font-semibold text-lg outline-none placeholder:text-green-200"/>
              <span className="px-3 text-xs font-bold text-green-400">USDT</span>
            </div>
            {amount && <p className="text-xs text-emerald-500 mt-1.5 font-medium">≈ PKR {(parseFloat(amount)*PKR).toLocaleString(undefined,{maximumFractionDigits:0})}</p>}
          </div>

          {/* Raast */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Recipient Raast ID</label>
            <div className="flex items-center bg-green-50 border border-green-200 rounded-xl overflow-hidden focus-within:border-green-500 transition-colors">
              <span className="px-3 text-green-400"><Phone  size={20}/></span>
              <input type="text" placeholder="03XX-XXXXXXX or IBAN" value={raast} onChange={e => setRaast(e.target.value)}
                className="flex-1 bg-transparent py-3 text-green-900 outline-none placeholder:text-green-200 text-sm"/>
            </div>
          </div>

          {/* Token */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Token</label>
            <div className="flex gap-2">
              {["USDT","USDC","ETH"].map(t => (
                <button key={t} onClick={() => setToken(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${token===t ? "bg-green-600 text-white shadow-lg shadow-green-200" : "bg-green-50 text-green-700 border border-green-200 hover:border-green-400"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Fee breakdown */}
          <div className="bg-green-50 rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="flex justify-between text-sm text-gray-600"><span>Amount</span><span className="font-semibold">${amount || "0.00"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">PakFlow Fee (1%)</span><span className="text-green-600 font-semibold">-${fee}</span></div>
            <div className="flex flex-row justify-between text-sm">
                <span className="text-gray-600">Gas Fee</span>
                <span className="text-green-600 flex flex-row gap-1 items-center font-semibold">$0.100 <Fuel size={15} /></span>
            </div>
            <div className="border-t border-green-200 pt-2.5 flex justify-between text-sm font-bold">
              <span className="text-gray-700">You Save vs Pioneer</span>
              <span className="text-green-600">~${saved}</span>
            </div>
          </div>

          <button disabled={!ready}
            className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${ready ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 active:scale-[0.98]" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
            Lock & Send → PKR
          </button>
        </div>
      </div>
    </div>
  );
}

export default SendModal