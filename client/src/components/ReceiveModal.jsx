import React, { useState } from 'react'
import { CopyIcon , CopyCheck , Check} from 'lucide-react';
function ReceiveModal({ wallet, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(wallet); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="animate-fade-in fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="animate-slide-up bg-white rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center px-6 py-5 border-b border-green-100">
          <h2 className="text-lg font-bold text-green-900">Receive Funds</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-50 text-gray-400 transition-colors text-lg">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="flex justify-center">
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 flex flex-col items-center gap-3">
              <div className="grid gap-1" style={{gridTemplateColumns:"repeat(7,1fr)"}}>
                {Array.from({length:49},(_,i) => {
                  const r=Math.floor(i/7), c=i%7;
                  const on=(r<2&&c<2)||(r<2&&c>4)||(r>4&&c<2)||(r===3&&[1,3,5].includes(c))||(r===1&&c===3)||(r===5&&c===5);
                  return <div key={i} className={`w-3.5 h-3.5 rounded-sm ${on ? "bg-green-600" : "bg-green-100"}`}/>;
                })}
              </div>
              <span className="mono text-xs text-green-400">zkSync Era</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Your Wallet Address</label>
            <div onClick={copy} className="flex items-center bg-green-50 border border-green-200 rounded-xl px-3 py-3 cursor-pointer hover:border-green-400 transition-colors gap-2">
              <span className="mono text-xs text-green-800 flex-1 break-all">{wallet}</span>
              <span className={`text-sm font-bold shrink-0 ${copied ? "text-green-600" : "text-green-400"}`}>{copied ? <CopyCheck size={18}/> : <CopyIcon size={15}/>}</span>
            </div>
          </div>

          <div className="bg-green-50 rounded-2xl p-4 flex flex-col gap-2">
            {["Send USDT or USDC on zkSync Era","No gas needed — PakFlow covers it","Funds reflect instantly on-chain"].map(t => (
              <p key={t} className="text-sm text-emerald-600 font-medium flex items-center gap-2"><span className="text-green-500"><Check size={15} /></span>{t}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReceiveModal