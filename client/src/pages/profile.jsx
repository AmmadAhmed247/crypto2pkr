import { useState, useEffect, useCallback  } from "react";
import { Link, useNavigate   } from 'react-router-dom'
import SendModal from "../components/SendModal";
import ReceiveModal from "../components/ReceiveModal";
import { Menu, LayoutDashboard, BadgeCheck, Stone ,Verified , LogOut} from "lucide-react";
import { useUser } from "../context/userContext";
import RecentActivity from "../components/RecentActivity";
import { useQuery } from "@tanstack/react-query";
import { useBridgeLogic } from "../hooks/bridgeLogic";
import axios from "axios";
import { useExchangeRate } from "../hooks/exchangeRate";
import { formatEther, ZeroAddress } from "ethers";
import { fetchAllWithdrawals, refundUserFunds } from "../api/bridgeService.js";

const Animations = () => (
  <style>{`
    .mono { font-family: 'Roboto Mono', 'Courier New', monospace !important; }
    @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.35} }
    @keyframes slide-up  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fade-in   { from{opacity:0} to{opacity:1} }
    @keyframes shimmer   { 0%{background-position:200%} 100%{background-position:-200%} }
    .animate-slide-up  { animation: slide-up .28s ease both; }
    .animate-fade-in   { animation: fade-in .2s ease both; }
    .pulse-dot         { animation: pulse-dot 2s infinite; }
    .shimmer-bar       { background:linear-gradient(90deg,#bbf7d0 25%,#6ee7b7 50%,#bbf7d0 75%);background-size:200%;animation:shimmer 1.4s infinite; }
  `}</style>
);



const NAV = [
  { id: "overview",      icon: <LayoutDashboard size={17} />, label: "Overview" },
  { id: "transactions",  icon: <Menu size={17} />,            label: "Transactions" },
  { id: "claims",        icon: <BadgeCheck size={17} />,      label: "Claims" },
];

const fmt   = (d) => new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
const trunc = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";
const PKR   = 279.3;

function Countdown({ secondsLeft: initial }) {
  const [secs, setSecs] = useState(initial);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");

  return (
    <span className="font-mono text-amber-500 text-xs tabular-nums">
      {h}:{m}:{s}
    </span>
  );
}

export default function Dashboard() {
  const [tab, setTab]           = useState("overview");
  const [showSend, setShowSend] = useState(false);
  const [showRec, setShowRec]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [txFilter, setTxFilter] = useState("all");
  const navigate=useNavigate()
  console.log(txFilter);

  

  // Claims state
  const [withdrawals, setWithdrawals]     = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [claiming, setClaiming]           = useState({}); 

  const { address, isAuthenticated, email, balance, wallets  , logout} = useUser();
  console.log(email);
  
  const { data: exchangeRate = 0 } = useExchangeRate("ETH");
  const amount = exchangeRate * balance;

  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const { data: userAnalytics, isLoading } = useQuery({
    queryKey: ["userAnalytics", address],
    queryFn: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/analytics/${address}`);
      return res.data;
    },
    enabled: !!address,
  });

  const handleLogout=()=>{
    logout();
    navigate("/")
  }

  const analytics = userAnalytics?.data;
  const STATS = [
    { label: "Total Bridged",   value: `PKR ${analytics?.totalBridged   ?? "0.00"}`, pkr: `${analytics?.totalCrypto   ?? "0.00"} ETH`, accent: "border-l-green-500"   },
    { label: "Total Received",  value: `${analytics?.receivedVolume     ?? "0.00"} ETH`,  pkr: "On Chain",       accent: "border-l-emerald-400"  },
    { label: "Claimable",       value: `${analytics?.totalClaiming      ?? "0.00"} ETH`,  pkr: "Pending claims", accent: "border-l-teal-400"     },
    { label: "Transactions",    value:  analytics?.count                ?? 0,              pkr: "Total transactions", accent: "border-l-cyan-400" },
  ];

  const user = {
  email: email,
  picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=pakflow",
  wallet: address,
};

  const claimable      = parseFloat(analytics?.totalClaiming ?? "0.00");
  const claimableCount = analytics?.count ?? "0";

  const claimableList  = withdrawals.filter(w => w.isClaimable);
  const pendingList    = withdrawals.filter(w => !w.isClaimable);
  const totalClaimable = claimableList.reduce((sum, w) => sum + w.amount, 0n);

  const loadWithdrawals = useCallback(async () => {
    if (!address || !wallets?.length) return;
    setLoadingClaims(true);
    try {
      const data = await fetchAllWithdrawals(address, wallets);
      setWithdrawals(data);
    } catch (e) {
      console.error("Failed to load withdrawals:", e);
    } finally {
      setLoadingClaims(false);
    }
  }, [address, wallets]);

  useEffect(() => {
    if (tab === "claims") loadWithdrawals();
  }, [tab, loadWithdrawals]);

  const handleClaim = async (requestId) => {
    setClaiming(c => ({ ...c, [requestId]: true }));
    try {
      await refundUserFunds(wallets, requestId);
      await loadWithdrawals();
    } catch (e) {
      alert(e.message);
    } finally {
      setClaiming(c => ({ ...c, [requestId]: false }));
    }
  };

  const handleClaimAll = async () => {
    for (const w of claimableList) {
      await handleClaim(w.requestId);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSomeClaming = Object.values(claiming).some(Boolean);

  return (
    <>
      <Animations />
      <div className="flex min-h-screen bg-green-50/40">

        <aside className="w-60 shrink-0 bg-white rounded-md border-r border-green-100 flex flex-col p-5 gap-2 sticky top-0 h-screen overflow-y-auto">
          <nav className="flex flex-col gap-1 flex-1">
            {NAV.map(n => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative text-left
                  ${tab === n.id
                    ? "bg-green-600 text-white shadow-md shadow-green-200"
                    : "text-gray-600 hover:bg-green-50 hover:text-green-700"}`}
              >
                <span className="text-base w-5 text-center">{n.icon}</span>
                {n.label}
                {n.id === "claims" && claimableList.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {claimableList.length}
                  </span>
                )}
              </button>
            ))}

            <div className="mt-4 pt-4 border-t border-green-100 flex flex-col gap-1">
              <button
                onClick={() => setShowSend(true)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all text-left"
              >
                <span className="w-5 text-center">↑</span> Send
              </button>
              <button
                onClick={() => setShowRec(true)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all text-left"
              >
                <span className="w-5 text-center">↓</span> Receive
              </button>
            </div>
          </nav>

          <div className="bg-green-50 rounded-2xl p-3 flex items-center gap-2.5">
            <img src={user.picture} className="w-9 h-9 rounded-full border-2 border-green-200" alt="avatar" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{user.email}</p>
              <p className="mono text-xs text-green-400 truncate">{trunc(user.wallet)}</p>
            </div>
            <button
              onClick={() => handleLogout()}
              className="text-red-400 hover:text-red-600 transition-colors"
              title="Logout"
            ><LogOut size={15} /></button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-auto">

          <div className="flex justify-between items-center px-8 py-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-green-900 tracking-tight">
                {tab === "overview"     && "Dashboard"}
                {tab === "transactions" && "Transactions"}
                {tab === "claims"       && "Claimable Funds"}
              </h1>
              <p className="text-xs text-green-400 mt-0.5">
                {new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <span className="flex items-center gap-1.5 bg-white border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                <span className="pulse-dot w-2 h-2 rounded-full bg-green-500 inline-block" />zkSync Era
              </span>
            </div>
          </div>

          <div className="px-8 pb-8 flex flex-col gap-5">

            {tab === "overview" && (
              <>
                <div className="bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 rounded-3xl p-7 text-white relative overflow-hidden shadow-xl shadow-green-200/60">
                  <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
                  <div className="absolute bottom-0 left-1/3 w-36 h-36 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
                  <div className="relative z-10 flex flex-wrap justify-between items-start gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-green-300 mb-2">zkSync Wallet</p>
                      <p className="mono text-base font-medium tracking-wide">{trunc(address)}</p>
                      <div className="flex gap-2 mt-4 flex-wrap">
                        <button onClick={copy} className="bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-95">
                          {copied ? "✓ Copied" : "⎘ Copy"}
                        </button>
                        <button onClick={() => setShowSend(true)} className="bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-95">↑ Send</button>
                        <button onClick={() => setShowRec(true)}  className="bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-95">↓ Receive</button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-widest text-green-300 mb-1">Total Balance</p>
                      <p className="text-4xl font-extrabold">{balance}</p>
                      <p className="text-lg text-green-300 mt-1">{formatted} <span className="text-white">PKR</span></p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {STATS.map(st => (
                    <div key={st.label} className={`bg-white rounded-2xl p-5 border border-green-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all border-l-4 ${st.accent}`}>
                      <p className="text-xs text-green-400 font-semibold uppercase tracking-wider">{st.label}</p>
                      <p className="text-2xl font-extrabold text-green-900 mt-1.5">{st.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{st.pkr}</p>
                    </div>
                  ))}
                </div>

                {claimableList.length > 0 && (
                  <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 flex items-center gap-4 flex-wrap">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 text-xl shrink-0">◈</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-teal-800">
                        {claimableList.length} claimable request{claimableList.length > 1 ? "s" : ""} ready
                      </p>
                      <p className="text-xs text-teal-600 mt-0.5">
                        Total: {Number(formatEther(totalClaimable)).toFixed(4)} ETH — timelock expired
                      </p>
                    </div>
                    <button
                      onClick={() => setTab("claims")}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 shrink-0"
                    >
                      Claim Now
                    </button>
                  </div>
                )}

                {/* Recent activity */}
                <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
                  <div className="flex justify-between items-center px-5 py-4 border-b border-green-50">
                    <p className="text-sm font-bold text-green-900">Recent Activity</p>
                    <button onClick={() => setTab("transactions")} className="text-xs text-green-500 hover:text-green-700 font-semibold transition-colors">See all →</button>
                  </div>
                  <RecentActivity address={address} />
                </div>
              </>
            )}

            {/* Transactions Tab*/}
            {tab === "transactions" && (
              <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
                <div className="flex gap-2 px-5 py-4 border-b border-green-50 flex-wrap">
                  {["all", "send", "receive", "Bridge", "Paid", "pending", "Claimed"].map(f => (
                    <button
                      key={f}
                      onClick={() => setTxFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                        ${txFilter === f
                          ? "bg-green-600 text-white shadow-md shadow-green-200"
                          : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"}`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <RecentActivity address={address} txFilter={txFilter} />
              </div>
            )}

            {/* Claims Tab */}
            {tab === "claims" && (
              <>
                {/* Loading spinner */}
                {loadingClaims ? (
                  <div className="flex justify-center items-center py-24">
                    <div className="w-9 h-9 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" />
                  </div>

                ) : withdrawals.length === 0 ? (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                    <span className="text-5xl"><Stone /></span>
                    <p className="text-lg font-bold text-green-900">No claimable funds</p>
                    <p className="text-sm text-green-400">When your timelock expires, funds will appear here.</p>
                  </div>

                ) : (
                  <div className="flex flex-col gap-4">
                    {claimableList.length > 0 && (
                      <div className="bg-gradient-to-br from-green-800 to-emerald-600 rounded-3xl p-6 text-white flex flex-wrap justify-between items-center gap-4 shadow-xl shadow-green-200/50">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-green-300 mb-1">Total Claimable</p>
                          <p className="text-3xl font-extrabold">
                            {Number(formatEther(totalClaimable)).toFixed(4)}{" "}
                            <span className="text-lg font-normal text-green-300">ETH</span>
                          </p>
                        </div>
                        <button
                          onClick={handleClaimAll}
                          disabled={isSomeClaming}
                          className="bg-white/20 hover:bg-white/30 border border-white/25 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSomeClaming ? "Claiming…" : "Claim All"}
                        </button>
                      </div>
                    )}

                    {pendingList.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                        <span className="text-amber-500 text-lg">⏳</span>
                        <p className="text-xs text-amber-700 font-semibold">
                          {pendingList.length} request{pendingList.length > 1 ? "s" : ""} still locked — timelock hasn't expired yet
                        </p>
                      </div>
                    )}

             
                    {[...claimableList, ...pendingList].map((w) => (
                      <div
                        key={w.requestId}
                        className={`flex justify-between items-center rounded-2xl px-5 py-4 border transition-all
                          ${w.isClaimable
                            ? "bg-green-50 border-green-200"
                            : "bg-amber-50/60 border-amber-200 opacity-75"}`}
                      >
                        <div className="flex flex-col gap-1">
                          <p className="font-bold text-green-900 text-sm">
                            {Number(formatEther(w.amount)).toFixed(4)}{" "}
                            {w.token === ZeroAddress ? "ETH" : "USDC"}
                          </p>
                          {w.raastId && (
                            <p className="text-xs text-green-500">Raast ID: {w.raastId}</p>
                          )}
                          <p className="text-xs mt-0.5">
                            {w.isClaimable
                              ? <div className="flex gap-1 flex-row">
                                <Verified size={15} />
                                <span className="text-emerald-600 font-semibold"> Ready to claim</span>
                                </div>
                                
                              : <span className="text-amber-600">⏳ Unlocks in <Countdown secondsLeft={w.secondsLeft} /></span>
                            }
                          </p>
                        </div>

                        {w.isClaimable && (
                          <button
                            onClick={() => handleClaim(w.requestId)}
                            disabled={claiming[w.requestId]}
                            className="bg-green-700 hover:bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {claiming[w.requestId] ? "…" : "Claim"}
                          </button>
                        )}
                      </div>
                    ))}

                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {showSend && <SendModal onClose={() => setShowSend(false)} />}
      {showRec  && <ReceiveModal wallet={user.wallet} onClose={() => setShowRec(false)} />}
    </>
  );
}