import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from 'react-router-dom';
import SendModal from "../components/SendModal";
import ReceiveModal from "../components/ReceiveModal";
import { Menu, LayoutDashboard, BadgeCheck, LogOut, X, ArrowUpRight, ArrowDownLeft, Copy, Check, RefreshCw, Clock, ChevronRight, Zap } from "lucide-react";
import { useUser } from "../context/userContext";
import RecentActivity from "../components/RecentActivity";
import { useQuery } from "@tanstack/react-query";
import { useBridgeLogic } from "../hooks/bridgeLogic";
import axios from "axios";
import { useExchangeRate } from "../hooks/exchangeRate";
import { formatEther, formatUnits, ZeroAddress } from "ethers";
import { fetchAllWithdrawals } from "../utils/contractRead.js";
import { refundUserFunds } from "../utils/contractWrites.js";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,600&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

    .f-serif { font-family: 'Fraunces', Georgia, serif; }
    .f-sans  { font-family: 'Instrument Sans', sans-serif; }
    .f-mono  { font-family: 'JetBrains Mono', monospace; }

    @keyframes pulse-glow {
      0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.55); }
      55%      { box-shadow: 0 0 0 8px rgba(74,222,128,0); }
    }
    .pulse-glow { animation: pulse-glow 2.4s ease-in-out infinite; }

    @keyframes spin-slow { to { transform: rotate(360deg); } }
    .spin-slow { animation: spin-slow 1s linear infinite; }

    @keyframes fade-up {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .fade-up { animation: fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both; }

    @keyframes count-flash { 0%,100%{opacity:1} 40%{opacity:0.4} }
    .count-flash { animation: count-flash 2s ease-in-out infinite; }

    .sidebar-link {
      display:flex; align-items:center; gap:10px;
      padding:10px 12px; border-radius:12px;
      font-family:'Instrument Sans',sans-serif; font-weight:500; font-size:13.5px;
      cursor:pointer; border:none; background:transparent; width:100%;
      text-align:left; transition:all 0.2s ease; color:#2d4a30;
    }
    .sidebar-link:hover { background:rgba(22,163,74,0.07); color:#14532d; }
    .sidebar-link.active {
      background:#14532d; color:white;
      box-shadow: 0 4px 14px rgba(20,83,45,0.25);
    }
    .sidebar-link.active svg { opacity:1; }

    .stat-card {
      background:white; border:1.5px solid #dcfce7; border-radius:20px;
      padding:22px 24px; transition:all 0.3s cubic-bezier(0.16,1,0.3,1);
      position:relative; overflow:hidden;
    }
    .stat-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(22,100,52,0.1); border-color:#bbf7d0; }

    .claim-row {
      background:white; border:1.5px solid #dcfce7; border-radius:18px;
      padding:16px 20px; display:flex; align-items:center; gap:14px;
      transition:all 0.25s ease;
    }
    .claim-row:hover { border-color:#86efac; box-shadow:0 8px 24px rgba(22,100,52,0.08); }
    .claim-row.locked { background:#fffbeb; border-color:#fde68a; }

    .filter-pill {
      font-family:'Instrument Sans',sans-serif; font-size:12px; font-weight:600;
      padding:6px 14px; border-radius:99px; cursor:pointer; border:1.5px solid transparent;
      transition:all 0.2s ease; white-space:nowrap;
    }
    .filter-pill.on  { background:#14532d; color:white; }
    .filter-pill.off { background:white; color:#166534; border-color:#dcfce7; }
    .filter-pill.off:hover { border-color:#86efac; }

    /* scrollbar */
    ::-webkit-scrollbar { width:5px; height:5px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:#bbf7d0; border-radius:99px; }
  `}</style>
);


function Countdown({ secondsLeft: init }) {
  const [secs, setSecs] = useState(init);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2,'0');
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2,'0');
  const s = String(secs % 60).padStart(2,'0');
  return <span className="f-mono text-amber-500 text-xs count-flash">{h}:{m}:{s}</span>;
}

const trunc = a => a ? `${a.slice(0,6)}…${a.slice(-4)}` : '—';
const fmt   = d => new Date(d).toLocaleDateString('en-PK',{ day:'numeric', month:'short', year:'numeric' });

const NAV = [
  { id:'overview',     icon:<LayoutDashboard size={15}/>, label:'Overview'     },
  { id:'transactions', icon:<Menu size={15}/>,            label:'Transactions' },
  { id:'claims',       icon:<BadgeCheck size={15}/>,      label:'Claims'       },
];

export default function Dashboard() {
  const [tab, setTab]           = useState('overview');
  const [showSend, setShowSend] = useState(false);
  const [showRec, setShowRec]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [txFilter, setTxFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const { address, isAuthenticated, email, balance, wallets, logout } = useUser();
  const { data: exchangeRate = 0 } = useExchangeRate('ETH');
  const pkrRate  = import.meta.env.VITE_PKR_RATE;
  const usdBalance = (balance.usdc * pkrRate).toLocaleString(2);

  const { data: userAnalytics } = useQuery({
    queryKey: ['userAnalytics', address],
    queryFn: async () => {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/analytics/${address}`);
      return res.data;
    },
    enabled: !!address,
    refetchInterval: 4000,
  });
  const analytics = userAnalytics?.data;

  const handleLogout = () => { logout(); navigate('/'); };

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [withdrawals, setWithdrawals]   = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [claiming, setClaiming]         = useState({});

  const claimableList  = withdrawals.filter(w => w.isClaimable);
  const pendingList    = withdrawals.filter(w => !w.isClaimable);
  const totalClaimable = claimableList.reduce((sum, w) => sum + w.amount, 0n);

  const loadWithdrawals = useCallback(async () => {
    if (!address || !wallets?.length) return;
    setLoadingClaims(true);
    try { setWithdrawals(await fetchAllWithdrawals(address, wallets)); }
    catch(e) { console.error(e); }
    finally { setLoadingClaims(false); }
  }, [address, wallets]);

  useEffect(() => { if (tab === 'claims') loadWithdrawals(); }, [tab, loadWithdrawals]);

  const handleClaim = async (requestId) => {
    setClaiming(c => ({ ...c, [requestId]: true }));
    try { await refundUserFunds(wallets, requestId); await loadWithdrawals(); }
    catch(e) { alert(e.message); }
    finally { setClaiming(c => ({ ...c, [requestId]: false })); }
  };
  const handleClaimAll = async () => { for (const w of claimableList) await handleClaim(w.requestId); };
  const isSomeClaiming = Object.values(claiming).some(Boolean);

  const handleTabChange = id => { setTab(id); setSidebarOpen(false); };

  const STATS = [
    { label:'Total Bridged',  val:`PKR ${analytics?.totalBridged ?? '0.00'}`,   sub:`${analytics?.usdcTotal ?? '0'} USDC`,   color:'#16a34a' },
    { label:'Volume Received',val:`${analytics?.receivedVolume ?? '0.00'} USDC`, sub:'On-chain settled',                       color:'#0d9488' },
    { label:'Pending Claims', val:`${analytics?.totalClaiming ?? '0.00'} PKR`,   sub:'Awaiting release',                      color:'#d97706' },
    { label:'Transactions',   val: analytics?.count ?? 0,                         sub:'All time',                              color:'#6366f1' },
  ];

  const avatarSeed = email || address || 'user';

  return (
    <>
      <GlobalStyles />

      <div className="flex min-h-screen bg-[#f6fcf7] f-sans relative">

        {/* ── mobile overlay ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/25 z-20 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)}/>
        )}

        {/* ════════════════════════
            SIDEBAR
        ════════════════════════ */}
        <aside className={`
          fixed top-0 left-0 h-screen z-30 w-[220px]
          flex flex-col
          transition-transform duration-300 ease-in-out
          md:sticky md:translate-x-0 md:shrink-0 md:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `} style={{ background:'white', borderRight:'1.5px solid #dcfce7' }}>

          {/* Logo */}
          <div className="flex items-center justify-between px-5 pt-6 pb-5" style={{ borderBottom:'1px solid #f0fdf4' }}>
            <Link to="/" className="f-serif italic font-semibold text-[19px] text-green-950" style={{ textDecoration:'none', letterSpacing:'-0.02em' }}>
              rupia<span className="text-green-400 not-italic">.</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-green-400 hover:text-green-700 transition-colors p-1">
              <X size={17}/>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 px-3 pt-4 flex-1">
            {NAV.map(n => (
              <button key={n.id} onClick={() => handleTabChange(n.id)}
                className={`sidebar-link ${tab === n.id ? 'active' : ''}`}>
                <span className={tab===n.id ? 'opacity-100':'opacity-50'}>{n.icon}</span>
                {n.label}
                {n.id === 'claims' && claimableList.length > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                    {claimableList.length}
                  </span>
                )}
              </button>
            ))}

            <div className="mt-4 pt-4" style={{ borderTop:'1px solid #f0fdf4' }}>
              <button onClick={() => { setShowSend(true); setSidebarOpen(false); }} className="sidebar-link">
                <ArrowUpRight size={15} className="opacity-50"/> Send
              </button>
              <button onClick={() => { setShowRec(true); setSidebarOpen(false); }} className="sidebar-link">
                <ArrowDownLeft size={15} className="opacity-50"/> Receive
              </button>
            </div>
          </nav>

          {/* User chip */}
          <div className="m-3 p-3 rounded-2xl flex items-center gap-2.5" style={{ background:'#f0fdf4', border:'1px solid #dcfce7' }}>
            <img
              src={`https://api.dicebear.com/9.x/identicon/svg?seed=${avatarSeed}`}
              className="w-8 h-8 rounded-full shrink-0"
              style={{ border:'2px solid #bbf7d0' }}
              alt="avatar"
            />
            <div className="flex-1 min-w-0">
              <p className="f-sans text-[12px] font-semibold text-green-900 truncate">{email || 'User'}</p>
              <p className="f-mono text-[10px] text-green-500 truncate">{trunc(address)}</p>
            </div>
            <button onClick={handleLogout} className="text-red-400 hover:text-red-600 transition-colors shrink-0 p-1" title="Logout">
              <LogOut size={14}/>
            </button>
          </div>
        </aside>

        {/* ════════════════════════
            MAIN
        ════════════════════════ */}
        <main className="flex-1 flex flex-col min-w-0 overflow-auto">

          {/* ── Top bar ── */}
          <div className="flex items-center justify-between px-5 sm:px-8 py-5 gap-4 flex-wrap" style={{ borderBottom:'1px solid #f0fdf4' }}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl text-green-700 transition-colors"
                style={{ background:'white', border:'1.5px solid #dcfce7' }}
              >
                <Menu size={17}/>
              </button>
              <div>
                <h1 className="f-serif font-bold text-green-950 leading-none" style={{ fontSize:'clamp(20px,3vw,26px)', letterSpacing:'-0.03em' }}>
                  {tab === 'overview'     && 'Overview'}
                  {tab === 'transactions' && 'Transactions'}
                  {tab === 'claims'       && 'Claimable Funds'}
                </h1>
                <p className="f-sans text-[11px] text-green-600/50 mt-1">
                  {new Date().toLocaleDateString('en-PK',{ weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                </p>
              </div>
            </div>

            {/* Network badge */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full"
              style={{ background:'white', border:'1.5px solid #dcfce7' }}>
              <span className="pulse-glow w-2 h-2 rounded-full bg-green-400 inline-block"/>
              <span className="f-sans text-[12px] font-semibold text-green-700">zkSync Era</span>
            </div>
          </div>

          <div className="flex-1 px-5 sm:px-8 py-6 flex flex-col gap-5">

            {/* ══════════════════════════
                OVERVIEW
            ══════════════════════════ */}
            {tab === 'overview' && (
              <div className="fade-up flex flex-col gap-5">

                {/* Hero balance card */}
                <div className="relative overflow-hidden rounded-[24px] p-6 sm:p-8"
                  style={{ background:'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)' }}>
                  {/* decorative circles */}
                  <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none" style={{ background:'rgba(255,255,255,0.04)' }}/>
                  <div className="absolute -bottom-8 left-1/4 w-32 h-32 rounded-full pointer-events-none" style={{ background:'rgba(255,255,255,0.04)' }}/>
                  <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full pointer-events-none" style={{ background:'rgba(74,222,128,0.08)' }}/>

                  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div>
                      <p className="f-sans text-[10px] font-semibold tracking-[0.12em] uppercase text-green-300/70 mb-3">zkSync Wallet</p>
                      <p className="f-mono text-sm text-green-200/80" style={{ letterSpacing:'0.02em' }}>{trunc(address)}</p>
                      <div className="flex gap-2 mt-5 flex-wrap">
                        {[
                          { label: copied ? '✓ Copied' : 'Copy Address', icon:<Copy size={12}/>,          fn: copy                        },
                          { label: 'Send',                                icon:<ArrowUpRight size={12}/>,   fn: () => setShowSend(true)    },
                          { label: 'Receive',                             icon:<ArrowDownLeft size={12}/>,  fn: () => setShowRec(true)     },
                        ].map(b => (
                          <button key={b.label} onClick={b.fn}
                            className="f-sans inline-flex items-center gap-1.5 text-[12px] font-semibold text-white px-3.5 py-2 rounded-xl transition-all active:scale-95"
                            style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)' }}
                            onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.18)'}
                            onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                          >
                            {b.icon}{b.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="f-sans text-[10px] font-semibold tracking-[0.12em] uppercase text-green-300/70 mb-2">USDC Balance</p>
                      <p className="f-mono font-semibold text-white" style={{ fontSize:'clamp(32px,5vw,48px)', letterSpacing:'-0.04em', lineHeight:1 }}>
                        {balance.usdc}
                      </p>
                      <p className="f-sans text-green-300/80 text-sm mt-2">
                        ≈ <span className="f-mono">{usdBalance}</span> <span className="text-green-200">PKR</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {STATS.map((s,i) => (
                    <div key={i} className="stat-card">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-4"
                        style={{ background:`${s.color}12` }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background:s.color }}/>
                      </div>
                      <p className="f-sans text-[10px] font-semibold tracking-[0.1em] uppercase text-green-600/55 mb-2">{s.label}</p>
                      <p className="f-mono font-semibold text-green-950 leading-none" style={{ fontSize:'clamp(16px,2.5vw,22px)', letterSpacing:'-0.03em' }}>
                        {s.val}
                      </p>
                      <p className="f-sans text-[11px] text-green-600/40 mt-2">{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Claimable banner */}
                {claimableList.length > 0 && (
                  <div className="flex items-center gap-4 p-4 rounded-[18px] flex-wrap"
                    style={{ background:'#ecfdf5', border:'1.5px solid #6ee7b7' }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background:'#d1fae5', color:'#059669' }}>
                      <Zap size={18}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="f-serif font-semibold text-[15px] text-green-900"
                        style={{ letterSpacing:'-0.01em' }}>
                        {claimableList.length} fund{claimableList.length>1?'s':''} ready to claim
                      </p>
                      <p className="f-sans text-[12px] text-green-700/60 mt-0.5">
                        {Number(formatEther(totalClaimable)).toFixed(4)} ETH — timelock expired
                      </p>
                    </div>
                    <button onClick={() => setTab('claims')}
                      className="f-sans inline-flex items-center gap-1.5 text-[13px] font-semibold text-white px-4 py-2.5 rounded-xl shrink-0 transition-all"
                      style={{ background:'#059669' }}
                      onMouseOver={e => e.currentTarget.style.background='#047857'}
                      onMouseOut={e => e.currentTarget.style.background='#059669'}>
                      Claim Now <ChevronRight size={14}/>
                    </button>
                  </div>
                )}

                {/* Recent activity */}
                <div className="rounded-[20px] overflow-hidden" style={{ background:'white', border:'1.5px solid #dcfce7' }}>
                  <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom:'1px solid #f0fdf4' }}>
                    <h3 className="f-serif font-semibold text-green-950" style={{ fontSize:16, letterSpacing:'-0.02em' }}>Recent Activity</h3>
                    <button onClick={() => setTab('transactions')}
                      className="f-sans inline-flex items-center gap-1 text-[12px] font-semibold text-green-600 hover:text-green-800 transition-colors">
                      See all <ChevronRight size={13}/>
                    </button>
                  </div>
                  <RecentActivity address={address}/>
                </div>
              </div>
            )}

            {/* ══════════════════════════
                TRANSACTIONS
            ══════════════════════════ */}
            {tab === 'transactions' && (
              <div className="fade-up rounded-[20px] overflow-hidden" style={{ background:'white', border:'1.5px solid #dcfce7' }}>
                <div className="overflow-x-auto" style={{ borderBottom:'1px solid #f0fdf4' }}>
                  <div className="flex gap-2 px-5 py-4 min-w-max">
                    {['all','send','receive','Bridge','Paid','pending','Claimed'].map(f => (
                      <button key={f} onClick={() => setTxFilter(f)}
                        className={`filter-pill ${txFilter===f?'on':'off'}`}>
                        {f.charAt(0).toUpperCase()+f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <RecentActivity address={address} txFilter={txFilter}/>
              </div>
            )}

            {/* ══════════════════════════
                CLAIMS
            ══════════════════════════ */}
            {tab === 'claims' && (
              <div className="fade-up flex flex-col gap-4">
                {loadingClaims ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <RefreshCw size={24} className="spin-slow text-green-400"/>
                    <p className="f-sans text-[13px] text-green-600/60">Loading your claims…</p>
                  </div>

                ) : withdrawals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
                    <div className="w-16 h-16 rounded-[20px] flex items-center justify-center"
                      style={{ background:'#f0fdf4', border:'1.5px solid #dcfce7' }}>
                      <Clock size={26} className="text-green-300"/>
                    </div>
                    <p className="f-serif font-semibold text-[18px] text-green-900" style={{ letterSpacing:'-0.02em' }}>No claimable funds</p>
                    <p className="f-sans text-[13px] text-green-600/55 max-w-xs">When your timelock expires, claimable funds will appear here.</p>
                  </div>

                ) : (
                  <>
                    {/* Total claimable card */}
                    {claimableList.length > 0 && (
                      <div className="relative overflow-hidden rounded-[22px] p-6 sm:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5"
                        style={{ background:'linear-gradient(135deg,#14532d,#166534)' }}>
                        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none" style={{ background:'rgba(255,255,255,0.05)' }}/>
                        <div className="relative z-10">
                          <p className="f-sans text-[10px] font-semibold tracking-[0.12em] uppercase text-green-300/70 mb-2">Total Claimable</p>
                          <p className="f-mono font-semibold text-white" style={{ fontSize:'clamp(26px,4vw,38px)', letterSpacing:'-0.04em', lineHeight:1 }}>
                            {Number(formatEther(totalClaimable)).toFixed(4)}
                          </p>
                          <p className="f-serif italic text-green-300 text-base mt-1">ETH available</p>
                        </div>
                        <button onClick={handleClaimAll} disabled={isSomeClaiming}
                          className="f-sans font-semibold text-[14px] text-white px-6 py-3.5 rounded-2xl relative z-10 transition-all disabled:opacity-50"
                          style={{ background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.2)' }}
                          onMouseOver={e => !isSomeClaiming && (e.currentTarget.style.background='rgba(255,255,255,0.25)')}
                          onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
                          {isSomeClaiming ? 'Claiming…' : 'Claim All'}
                        </button>
                      </div>
                    )}

                    {/* Pending info */}
                    {pendingList.length > 0 && (
                      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                        style={{ background:'#fffbeb', border:'1.5px solid #fde68a' }}>
                        <Clock size={15} className="text-amber-500 shrink-0"/>
                        <p className="f-sans text-[12px] font-medium text-amber-700">
                          {pendingList.length} request{pendingList.length>1?'s':''} still locked — timelock hasn't expired yet
                        </p>
                      </div>
                    )}

                    {/* Claim rows */}
                    {[...claimableList, ...pendingList].map(w => (
                      <div key={w.requestId} className={`claim-row ${w.isClaimable?'':'locked'}`}>
                        {/* Status dot */}
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                          style={{ background: w.isClaimable ? '#d1fae5' : '#fef3c7' }}>
                          {w.isClaimable
                            ? <Check size={16} style={{ color:'#059669' }}/>
                            : <Clock size={16} style={{ color:'#d97706' }}/>
                          }
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="f-mono font-semibold text-green-950" style={{ fontSize:15, letterSpacing:'-0.02em' }}>
                            {w.token === ZeroAddress
                              ? `${Number(formatEther(w.amount)).toFixed(4)} ETH`
                              : `${Number(formatUnits(w.amount,6))} USDC`
                            }
                          </p>
                          {w.raastId && (
                            <p className="f-mono text-[11px] text-green-500/70 mt-0.5 truncate">Raast: {w.raastId}</p>
                          )}
                          <p className="f-sans text-[12px] mt-1">
                            {w.isClaimable
                              ? <span className="text-emerald-600 font-semibold">✓ Ready to claim</span>
                              : <span className="text-amber-600">Unlocks in <Countdown secondsLeft={w.secondsLeft}/></span>
                            }
                          </p>
                        </div>

                        {w.isClaimable && (
                          <button onClick={() => handleClaim(w.requestId)} disabled={claiming[w.requestId]}
                            className="f-sans font-semibold text-[13px] text-white px-4 py-2.5 rounded-xl shrink-0 transition-all disabled:opacity-50 active:scale-95"
                            style={{ background:'#14532d' }}
                            onMouseOver={e => !claiming[w.requestId] && (e.currentTarget.style.background='#166534')}
                            onMouseOut={e => e.currentTarget.style.background='#14532d'}>
                            {claiming[w.requestId] ? '…' : 'Claim'}
                          </button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

          </div>{/* end content */}
        </main>
      </div>

      {showSend && <SendModal onClose={() => setShowSend(false)}/>}
      {showRec  && <ReceiveModal wallet={address} onClose={() => setShowRec(false)}/>}
    </>
  );
}