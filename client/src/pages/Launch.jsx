import React, { useState } from 'react';
import { Wallet, ArrowDown, CheckCircle, AlertCircle, Loader, ExternalLink, Info } from 'lucide-react';

export default function BridgeComponent() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [pkrAmount, setPkrAmount] = useState('0.00');
  const [selectedCrypto, setSelectedCrypto] = useState('ETH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [raastId, setRaastId] = useState('');
  const [step, setStep] = useState(1); // 1: input, 2: confirm, 3: processing, 4: success

  const exchangeRate = 285000; // 1 ETH = 285,000 PKR (example rate)
  
  const cryptoOptions = [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
    { symbol: 'USDT', name: 'Tether', icon: '₮' },
    { symbol: 'USDC', name: 'USD Coin', icon: '$' }
  ];

  const connectWallet = async () => {
    setIsProcessing(true);
    // Simulate wallet connection
    setTimeout(() => {
      setIsConnected(true);
      setWalletAddress('0x742d...8f9a');
      setIsProcessing(false);
    }, 1500);
  };

  const handleAmountChange = (value) => {
    setCryptoAmount(value);
    if (value && !isNaN(value)) {
      const pkr = (parseFloat(value) * exchangeRate).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      setPkrAmount(pkr);
    } else {
      setPkrAmount('0.00');
    }
  };

  const handleBridge = async () => {
    if (raastId.trim()) {
      setStep(2);
    }
  };

  const confirmBridge = async () => {
    setStep(3);
    setIsProcessing(true);
    
    // Simulate transaction
    setTimeout(() => {
      setTxHash('0x8f9a...3b2c');
      setStep(4);
      setIsProcessing(false);
    }, 3000);
  };

  const resetBridge = () => {
    setStep(1);
    setCryptoAmount('');
    setPkrAmount('0.00');
    setTxHash('');
    setRaastId('');
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-zinc-800 mb-2">Bridge to PKR</h1>
          <p className="text-zinc-600">Convert your crypto to Pakistani Rupees instantly</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
          {/* Network Info Bar */}
          <div className={`bg-zinc-800 text-white px-6 py-3 flex items-center ${isConnected ? "justify-between" : "justify-center"}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">zkSync Era</span>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2 text-sm">
                <Wallet className="w-4 h-4" />
                <span className="font-mono">{walletAddress}</span>
              </div>
            )}
          </div>

          <div className="p-6">
            {!isConnected ? (
              /* Connect Wallet View */
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wallet className="w-10 h-10 text-zinc-800" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-800 mb-3">Connect Your Wallet</h3>
                <p className="text-zinc-600 mb-8">Connect your wallet to start bridging crypto to PKR</p>
                <button
                  onClick={connectWallet}
                  disabled={isProcessing}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5" />
                      Connect Wallet
                    </>
                  )}
                </button>
              </div>
            ) : step === 1 ? (
              /* Bridge Input View */
              <div className="space-y-4">
                {/* From Section */}
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-zinc-600">From</label>
                    <span className="text-xs text-zinc-500">Balance: 2.5 ETH</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <select 
                      value={selectedCrypto}
                      onChange={(e) => setSelectedCrypto(e.target.value)}
                      className="bg-white border border-zinc-200 rounded-lg px-3 py-2 font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-800"
                    >
                      {cryptoOptions.map(crypto => (
                        <option key={crypto.symbol} value={crypto.symbol}>
                          {crypto.icon} {crypto.symbol}
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="number"
                      value={cryptoAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-transparent text-3xl font-bold text-zinc-800 focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    {['0.1', '0.5', '1.0', 'Max'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleAmountChange(preset === 'Max' ? '2.5' : preset)}
                        className="px-3 py-1 bg-white border border-zinc-200 rounded-md text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center -my-2">
                  <div className="bg-green-100 border-4 border-green-50 rounded-full p-2">
                    <ArrowDown className="w-5 h-5 text-zinc-800" />
                  </div>
                </div>

                {/* To Section */}
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-zinc-600">To</label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 font-medium text-zinc-800">
                      🇵🇰 PKR
                    </div>
                    
                    <div className="flex-1 text-3xl font-bold text-zinc-800">
                      {pkrAmount}
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-green-100 border border-green-200 rounded-xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-zinc-700 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-zinc-700">
                    <p className="font-medium mb-1">Exchange Rate: 1 {selectedCrypto} = {exchangeRate.toLocaleString()} PKR</p>
                    <p className="text-xs text-zinc-600">Fee: 0.1% • Estimated time: ~2 minutes</p>
                  </div>
                </div>

                {/* Raast ID Input */}
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                  <label className="text-sm font-medium text-zinc-600 mb-3 block">Raast ID (Payout Destination)</label>
                  <input
                    type="text"
                    value={raastId}
                    onChange={(e) => setRaastId(e.target.value)}
                    placeholder="Enter your Raast ID"
                    className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-800 font-mono"
                  />
                  <p className="text-xs text-zinc-500 mt-2">Your PKR will be sent to this Raast ID</p>
                </div>

                {/* Bridge Button */}
                <button
                  onClick={handleBridge}
                  disabled={!cryptoAmount || parseFloat(cryptoAmount) <= 0 || !raastId.trim()}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-800"
                >
                  Review Bridge
                </button>
              </div>
            ) : step === 2 ? (
              /* Confirmation View */
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-zinc-800 mb-2">Confirm Bridge</h3>
                  <p className="text-zinc-600">Review your transaction details</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-zinc-50 rounded-xl p-4">
                    <div className="text-sm text-zinc-600 mb-1">You send</div>
                    <div className="text-2xl font-bold text-zinc-800">{cryptoAmount} {selectedCrypto}</div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowDown className="w-5 h-5 text-zinc-400" />
                  </div>

                  <div className="bg-zinc-50 rounded-xl p-4">
                    <div className="text-sm text-zinc-600 mb-1">You receive</div>
                    <div className="text-2xl font-bold text-zinc-800">{pkrAmount} PKR</div>
                  </div>
                </div>

                <div className="bg-green-100 border border-green-200 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Exchange Rate</span>
                    <span className="font-medium text-zinc-800">1 {selectedCrypto} = {exchangeRate.toLocaleString()} PKR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Bridge Fee</span>
                    <span className="font-medium text-zinc-800">0.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Network</span>
                    <span className="font-medium text-zinc-800">zkSync Era</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Raast ID</span>
                    <span className="font-medium text-zinc-800 font-mono text-xs">{raastId}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 py-4 rounded-xl font-semibold transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={confirmBridge}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-xl font-semibold transition-all"
                  >
                    Confirm Bridge
                  </button>
                </div>
              </div>
            ) : step === 3 ? (
              /* Processing View */
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader className="w-10 h-10 text-zinc-800 animate-spin" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-800 mb-3">Processing Bridge</h3>
                <p className="text-zinc-600 mb-6">Your transaction is being processed on zkSync...</p>
                <div className="space-y-2 text-sm text-zinc-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Sending to smart contract</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Success View */
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-800 mb-3">Bridge Successful!</h3>
                <p className="text-zinc-600 mb-6">Your PKR will be transferred shortly</p>
                
                <div className="bg-zinc-50 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Amount Bridged</span>
                    <span className="font-medium text-zinc-800">{cryptoAmount} {selectedCrypto}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">PKR Received</span>
                    <span className="font-medium text-zinc-800">{pkrAmount} PKR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Raast ID</span>
                    <span className="font-medium text-zinc-800 font-mono text-xs">{raastId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-600">Transaction Hash</span>
                    <a href="#" className="font-mono text-xs text-zinc-800 hover:text-zinc-600 flex items-center gap-1">
                      {txHash}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={resetBridge}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-xl font-semibold transition-all"
                >
                  Bridge Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-zinc-600">
          <p>Powered by zkSync Era • Secure Smart Contracts</p>
        </div>
      </div>
    </div>
  );
}