import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDown, CheckCircle, Loader, Info, AlertCircle } from 'lucide-react';
import { useExchangeRate } from '../hooks/exchangeRate';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TokenETH, TokenUSDT, TokenBTC, TokenUSDC } from '@web3icons/react';
import { 
  fetchPendingStatus, 
  lockUserFund, 
  getTokenBalance, 
  ensureZkSyncNetwork,
  isMetaMaskInstalled ,

} from '../api/bridgeService.js';
import RefundSection from '../components/RefundSection.jsx';
export default function BridgeComponent() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const queryClient = useQueryClient();

  const [cryptoAmount, setCryptoAmount] = useState('');
  const [pkrAmount, setPkrAmount] = useState('0.00');
  const [selectedCrypto, setSelectedCrypto] = useState('ETH');
  const [raastId, setRaastId] = useState('');
  const [step, setStep] = useState(1);
  const [networkError, setNetworkError] = useState(false);
  const [metaMaskMissing, setMetaMaskMissing] = useState(false);
  const oneHour=3600;
  

  const { data: exchangeRate = 0 } = useExchangeRate(selectedCrypto);

  const cryptoOptions = [
    { symbol: 'BTC', name: 'Bitcoin',  icon: <TokenBTC  size={20} />, address: '0x0000000000000000000000000000000000000000' },
    { symbol: 'ETH', name: 'Ethereum', icon: <TokenETH  size={20} />, address: '0x0000000000000000000000000000000000000000' },
    { symbol: 'USDT', name: 'Tether',  icon: <TokenUSDT size={20} />, address: '0xYOUR_USDT_ADDRESS' },
    { symbol: 'USDC', name: 'USD Coin', icon: <TokenUSDC size={20} />, address: '0xYOUR_USDC_ADDRESS' },
  ];

  const selectedToken = cryptoOptions.find(t => t.symbol === selectedCrypto);
  const tokenAddress = selectedToken?.address || '0x0000000000000000000000000000000000000000';

  useEffect(() => {
    setMetaMaskMissing(!isMetaMaskInstalled());
  }, []);

  // Check network on connect
  useEffect(() => {
    if (isConnected) {
      ensureZkSyncNetwork()
        .then(() => setNetworkError(false))
        .catch(() => setNetworkError(true));
    }
  }, [isConnected]);



  // Fetch user's balance
  const { data: balance = '0.000000', isLoading: isLoadingBalance } = useQuery({
    queryKey: ['balance', address, selectedCrypto],
    queryFn: () => getTokenBalance(tokenAddress, address),
    enabled: !!address && isConnected && !networkError,
    refetchInterval: 10000,
  });

  // Monitor pending withdrawals
  const { data: pendingData } = useQuery({
    queryKey: ['pendingwithdrawals', address],
    queryFn: () => fetchPendingStatus(address),
    enabled: !!address && isConnected && !networkError,
    refetchInterval: 10000,
  });
  console.log(`Pending Requests...${pendingData}`)
  // const{mutate:refundInitiated , isPending:isRefunding , error:refundsError}=useMutation({
  //   mutationFn:()
  // })

  const { mutate: lockFunds, isPending: isLocking, error: lockError } = useMutation({
    mutationFn: ({ tokenAddress, amount, raastId }) =>
      lockUserFund({ tokenAddress, amount: amount.toString(), raastId }),
    onSuccess: (tx) => {
      console.log(`Lock transaction hash: ${tx.hash || tx.transactionHash}`);
      queryClient.invalidateQueries({ queryKey: ['pendingwithdrawals', address] });
      queryClient.invalidateQueries({ queryKey: ['balance', address, selectedCrypto] });
      setStep(4);
    },
    onError: (err) => {
      console.error('Lock failed:', err);
      setStep(2);
    },
  });

  const handleAmountChange = (value) => {
    setCryptoAmount(value);
    if (!value || isNaN(value) || exchangeRate <= 0) {
      setPkrAmount('0.00');
      return;
    }
    const pkr = (parseFloat(value) * exchangeRate).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setPkrAmount(pkr);
  };

  const handleReview = () => {
    if (!cryptoAmount || Number(cryptoAmount) <= 0 || !raastId.trim() || exchangeRate <= 0) return;
    setStep(2);
  };

  const handleConfirm = () => {
    if (!tokenAddress || !cryptoAmount || !raastId.trim()) return;
    setStep(3);
    lockFunds({ tokenAddress, amount: cryptoAmount, raastId });
  };

  const resetBridge = () => {
    setStep(1);
    setCryptoAmount('');
    setPkrAmount('0.00');
    setRaastId('');
  };

  const connectWallet = () => {
    const metaMaskConnector = connectors.find(
      (connector) => connector.id === 'metaMask' || connector.name === 'MetaMask'
    );
    
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector });
    } else if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  };

  if (metaMaskMissing) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg text-center py-12">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-800 mb-4">MetaMask Required</h1>
          <p className="text-zinc-600 mb-8">
            Please install MetaMask extension to use this bridge
          </p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-semibold"
          >
            Install MetaMask
          </a>
          <button
            onClick={() => window.location.reload()}
            className="block mx-auto mt-4 text-zinc-600 hover:text-zinc-800 text-sm"
          >
            Refresh after installing
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-zinc-800" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-800 mb-4">Connect MetaMask</h1>
          <p className="text-zinc-600 mb-8">Connect to start bridging to PKR</p>
          <button
            onClick={connectWallet}
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-10 py-4 rounded-xl font-semibold flex items-center gap-3 mx-auto"
          >
            <Wallet className="w-5 h-5" />
            Connect MetaMask
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-zinc-800 mb-2">Bridge to PKR</h1>
          <p className="text-zinc-600">Crypto → Pakistani Rupees • zkSync Era</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
          <div className="bg-zinc-900 text-white px-6 py-3 flex justify-between text-sm font-medium">
            <span>zkSync Sepolia</span>
            <div className="font-mono flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              {address?.slice(0,6)}...{address?.slice(-4)}
            </div>
          </div>
          <RefundSection pendingTimeStamps={pendingData?.timestamp} />

          {networkError && (
            <div className="bg-red-50 border-b border-red-200 p-4 flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-900">Wrong Network</p>
                <p className="text-red-700">Please switch to zkSync Sepolia in MetaMask</p>
              </div>
              <button
                onClick={() => ensureZkSyncNetwork().then(() => setNetworkError(false))}
                className="text-red-700 underline text-sm"
              >
                Switch
              </button>
            </div>
          )}

          {pendingData && (
            <div className="bg-yellow-50 border-b border-yellow-200 p-4 flex items-center gap-3 text-sm">
              <Info className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">Pending Transaction</p>
                <p className="text-yellow-700">You have a pending withdrawal. Please wait.</p>
              </div>
            </div>
          )}

          <div className="p-6">
            {step === 1 && (
              <div className="space-y-5">
                <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200">
                  <div className="flex justify-between mb-3 text-sm">
                    <label className="font-medium text-zinc-700">From</label>
                    <span className="text-zinc-500">
                      Balance: {isLoadingBalance ? '...' : balance} {selectedCrypto}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white border border-zinc-200 rounded-lg px-4 py-2.5 flex items-center gap-2 font-semibold">
                      {selectedToken?.icon}
                      {selectedCrypto}
                    </div>
                    <input
                      type="number"
                      value={cryptoAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-transparent text-3xl font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    {['0.001', '0.01', '0.1', 'Max'].map(v => (
                      <button
                        key={v}
                        onClick={() => handleAmountChange(v === 'Max' ? balance : v)}
                        className="px-3 py-1 text-xs border border-zinc-200 rounded hover:bg-zinc-100"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center -my-2">
                  <div className="bg-green-100 rounded-full p-3 border-4 border-white">
                    <ArrowDown className="w-5 h-5 text-zinc-700" />
                  </div>
                </div>

                <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200">
                  <label className="block text-sm font-medium text-zinc-700 mb-3">To</label>
                  <div className="flex items-center gap-3">
                    <div className="bg-white border border-zinc-200 rounded-lg px-4 py-2.5 font-semibold">
                      🇵🇰 PKR
                    </div>
                    <div className="text-3xl font-bold text-zinc-900">{pkrAmount}</div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm space-y-1">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-zinc-700 mt-0.5" />
                    <div>
                      <p>
                        1 {selectedCrypto} ≈ {exchangeRate > 0 ? exchangeRate.toLocaleString() : '—'} PKR
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">Fee 0.1% • ~2 min</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700">
                    Raast ID (Recipient)
                  </label>
                  <input
                    type="text"
                    value={raastId}
                    onChange={e => setRaastId(e.target.value.trim())}
                    placeholder="Enter Raast ID"
                    className="w-full px-4 py-3 border border-zinc-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                  <p className="text-xs text-zinc-500">PKR payout destination</p>
                </div>

                <button
                  onClick={handleReview}
                  disabled={Number(cryptoAmount) <= 0 || !raastId.trim() || exchangeRate <= 0 || isLocking || !!pendingData || networkError}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Review Bridge
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-zinc-900">Confirm Bridge</h2>
                  <p className="text-zinc-600 mt-1">Review details before proceeding</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-zinc-50 p-5 rounded-xl">
                    <div className="text-sm text-zinc-600">You send</div>
                    <div className="text-2xl font-bold mt-1">{cryptoAmount} {selectedCrypto}</div>
                  </div>
                  <div className="flex justify-center my-2">
                    <ArrowDown className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div className="bg-zinc-50 p-5 rounded-xl">
                    <div className="text-sm text-zinc-600">You receive (estimated)</div>
                    <div className="text-2xl font-bold mt-1">{pkrAmount} PKR</div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Rate</span>
                    <span>1 {selectedCrypto} ≈ {exchangeRate.toLocaleString()} PKR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Raast ID</span>
                    <span className="font-mono break-all">{raastId}</span>
                  </div>
                </div>

                {lockError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm">
                    {lockError.message || 'Failed to send transaction'}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    disabled={isLocking}
                    className="flex-1 border border-zinc-300 py-4 rounded-xl font-medium hover:bg-zinc-50 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isLocking}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLocking ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm & Send'
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-20">
                <Loader className="w-16 h-16 text-zinc-800 animate-spin mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-zinc-900 mb-3">Bridging in Progress</h2>
                <p className="text-zinc-600">Waiting for zkSync confirmation…</p>
              </div>
            )}

            {step === 4 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 mb-4">Bridge Completed!</h2>
                <p className="text-zinc-600 mb-8">PKR should arrive via Raast shortly</p>

                <div className="bg-zinc-50 rounded-xl p-5 mb-8 text-sm space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Sent</span>
                    <span className="font-medium">{cryptoAmount} {selectedCrypto}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Received (est.)</span>
                    <span className="font-medium">{pkrAmount} PKR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Raast ID</span>
                    <span className="font-mono break-all">{raastId}</span>
                  </div>
                </div>

                <button
                  onClick={resetBridge}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-semibold"
                >
                  Start New Bridge
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Powered by zkSync Era • Secured by MetaMask
        </p>
      </div>
    </div>
  );
}