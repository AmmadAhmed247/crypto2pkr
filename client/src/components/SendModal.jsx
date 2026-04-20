import React, { useState } from 'react'
import { DollarSign, Phone, Fuel, Wallet } from "lucide-react"
import { useUser } from '../context/userContext';
import { TokenETH, TokenUSDT, TokenUSDC } from '@web3icons/react';
import { BrowserProvider, parseEther, parseUnits, Contract } from "ethers";

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const TOKEN_ADDRESSES = {
  USDC: "0xAe045DE5638162fa134807Cb558E15A3F5A7F853",
  USDT: "0x0000000000000000000000000000000000000000", 
  ETH:  "0x0000000000000000000000000000000000000000",
};

const TOKEN_ICONS = {
  ETH:  <TokenETH size={20} />,
  USDC: <TokenUSDC size={20} />,
  USDT: <TokenUSDT size={20} />,
};

function SendModal({ onClose }) {
  const { wallet, address, balance } = useUser();
  const [amount, setAmount]   = useState("");
  const [token, setToken]     = useState("ETH");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);

  const fee= (parseFloat(amount || 0) * 0.01).toFixed(4);
  const saved = (parseFloat(amount || 0) * 0.28).toFixed(4);
  const ready = amount && recipient;

  const getCurrentBalance = () => {
    if (token === "ETH")  return balance.eth  || "0.0000";
    if (token === "USDC") return balance.usdc || "0.00";
    if (token === "USDT") return balance.usdt || "0.00";
    return "0.00";
  };

  
  const handleTransfer = async () => {
    if (!wallet || !amount || !recipient) return;
    setLoading(true);

    try {
      const eip1193 = await wallet.getEthereumProvider();
      const provider = new BrowserProvider(eip1193);
      const signer   = await provider.getSigner();
      const target   = recipient.trim();

      if (!target.startsWith("0x") || target.length !== 42) {
        throw new Error("Invalid wallet address!");
      }
      let tx;
      if (token === "ETH") {
        const parsedAmount = parseEther(amount.toString());
        const userBalance  = await provider.getBalance(address);

        if (parsedAmount > userBalance) {
          throw new Error("Insufficient ETH balance");
        }

        tx = await signer.sendTransaction({
          to:target,
          value:parsedAmount,
        });

      } else {
        const tokenAddress = TOKEN_ADDRESSES[token];
        if (tokenAddress === "0x0000000000000000000000000000000000000000") {
          throw new Error(`${token} address not configured yet`);
        }

        const contract= new Contract(tokenAddress, ERC20_ABI, signer);
        const parsedAmount=parseUnits(amount.toString(), 6); 
        const userBalance=await contract.balanceOf(address);

        if (parsedAmount > userBalance) {
          throw new Error(`Insufficient ${token} balance`);
        }

        tx = await contract.transfer(target, parsedAmount);
      }

      console.log(`Tx Hash: ${tx.hash}`);
      await tx.wait();
      alert(`Transfer Successful! Tx: ${tx.hash}`);
      onClose();

    } catch (error) {
      console.error(error);
      if (error.code === "INSUFFICIENT_FUNDS" || error.message.toLowerCase().includes("insufficient")) {
        alert("Transaction Failed: Insufficient funds");
      } else if (error.code === "ACTION_REJECTED") {
        alert("Transaction Cancelled by user");
      } else if (error.code === "INVALID_ARGUMENT") {
        alert("Invalid Address");
      } else {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="animate-slide-up bg-white rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center px-6 py-5 border-b border-green-100">
          <h2 className="text-lg font-bold text-green-900">Send Funds</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-50 text-gray-400 hover:text-gray-600 transition-colors text-lg">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* Token Selector */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Token</label>
            <div className="flex gap-2">
              {["ETH", "USDC", "USDT"].map(t => (
                <button key={t} onClick={() => { setToken(t); setAmount(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    token === t
                      ? "bg-green-600 text-white shadow-lg shadow-green-200"
                      : "bg-green-50 text-green-700 border border-green-200 hover:border-green-400"
                  }`}>
                  {TOKEN_ICONS[t]} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Amount</label>
            <div className="flex items-center bg-green-50 border border-green-200 rounded-xl overflow-hidden focus-within:border-green-500 transition-colors">
              <span className="px-3 text-green-500 text-lg font-bold">{TOKEN_ICONS[token]}</span>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="flex-1 bg-transparent py-3 text-green-900 font-semibold text-lg outline-none placeholder:text-green-200"
              />
              <span className="px-3 text-xs font-bold text-green-400">{token}</span>
            </div>
            {/* dynamic balance */}
            <p className="text-xs text-emerald-500 mt-1.5 font-medium">
              Balance: {getCurrentBalance()} {token}
            </p>
          </div>

          {/* Recipient */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Recipient Wallet Address</label>
            <div className="flex items-center bg-green-50 border border-green-200 rounded-xl overflow-hidden focus-within:border-green-500 transition-colors">
              <span className="px-3 text-green-400"><Wallet size={20} /></span>
              <input
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                className="flex-1 bg-transparent py-3 text-green-900 outline-none placeholder:text-green-200 text-xs font-mono"
              />
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="bg-green-50 rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Amount</span>
              <span className="font-semibold">{amount || "0.00"} {token}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Rupia Fee (1%)</span>
              <span className="text-green-600 font-semibold">-{fee} {token}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gas Fee</span>
              <span className="text-green-600 flex items-center gap-1 font-semibold">~$0.001 <Fuel size={15} /></span>
            </div>
            <div className="border-t border-green-200 pt-2.5 flex justify-between text-sm font-bold">
              <span className="text-gray-700">You Save vs Payoneer</span>
              <span className="text-green-600">~{saved} {token}</span>
            </div>
          </div>

          <button
            disabled={!ready || loading}
            onClick={handleTransfer}
            className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${
              ready && !loading
                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 active:scale-[0.98]"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            {loading ? "Processing..." : `Send ${token} →`}
          </button>

        </div>
      </div>
    </div>
  );
}

export default SendModal;