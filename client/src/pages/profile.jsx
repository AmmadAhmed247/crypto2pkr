import { useState } from "react";
import SendModal from "../components/SendModal";
import ReceiveModal from "../components/ReceiveModal";
import { Menu ,LayoutDashboard ,BadgeCheck ,Sticker } from "lucide-react";
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

const MOCK_USER = {
  email:   "ali.hassan@gmail.com",
  picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=pakflow",
  wallet:  "0x4a3B8C2e1D9F3A7b6E5C4D2F1A0B9E8C7D6F5a4B",
};

const TXS = [
  { id:"TXN-001", type:"send",    token:"USDT", amount:250,  pkr:69750,  raast:"0311-1234567", status:"confirmed", date:"2025-03-01", hash:"0xabc...123" },
  { id:"TXN-002", type:"receive", token:"USDT", amount:180,  pkr:50220,  raast:"—",            status:"confirmed", date:"2025-02-27", hash:"0xdef...456" },
  { id:"TXN-003", type:"send",    token:"USDT", amount:500,  pkr:139500, raast:"0321-9876543", status:"pending",   date:"2025-02-25", hash:"0xghi...789" },
  { id:"TXN-004", type:"claim",   token:"USDT", amount:75,   pkr:20925,  raast:"—",            status:"claimable", date:"2025-02-20", hash:"0xjkl...012" },
  { id:"TXN-005", type:"send",    token:"USDT", amount:1200, pkr:334800, raast:"0333-5554443", status:"confirmed", date:"2025-02-18", hash:"0xmno...345" },
  { id:"TXN-006", type:"claim",   token:"USDT", amount:320,  pkr:89280,  raast:"—",            status:"claimable", date:"2025-02-15", hash:"0xpqr...678" },
];

const STATS = [
  { label:"Total Sent",     value:"$1,950", pkr:"PKR 5,44,050", accent:"border-l-green-500"  },
  { label:"Total Received", value:"$180",   pkr:"PKR 50,220",   accent:"border-l-emerald-400"},
  { label:"Claimable",      value:"$395",   pkr:"PKR 1,10,205", accent:"border-l-teal-400"   },
  { label:"Fees Saved",     value:"$87",    pkr:"vs Pioneer",   accent:"border-l-cyan-400"   },
];

const NAV = [
  { id:"overview",     icon:<LayoutDashboard size={17}/>, label:"Overview"     },
  { id:"transactions", icon:<Menu size={17}/>, label:"Transactions" },
  { id:"claims",       icon:<BadgeCheck size={17}/>, label:"Claims"       },
];

const fmt   = (d) => new Date(d).toLocaleDateString("en-PK",{day:"numeric",month:"short",year:"numeric"});
const trunc = (a) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : "—";
const PKR   = 279.3;

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
    confirmed: { wrap:"bg-green-50 text-green-700 border-green-200",  dot:"bg-green-500"  },
    pending:   { wrap:"bg-yellow-50 text-yellow-700 border-yellow-200",dot:"bg-yellow-400" },
    claimable: { wrap:"bg-teal-50 text-teal-700 border-teal-200",     dot:"bg-teal-500"   },
    failed:    { wrap:"bg-red-50 text-red-700 border-red-200",        dot:"bg-red-500"    },
  };
  const s = cfg[status] || cfg.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.wrap}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>
      {status.charAt(0).toUpperCase()+status.slice(1)}
    </span>
  );
}

function TxTable({ rows, onClaim, claimingId, showHash }) {
  if (!rows.length) return (
    <div className="py-16 text-center text-green-300 text-sm">No transactions found.</div>
  );
  const heads = ["ID","Type","Amount","PKR Value","Raast ID","Status","Date", showHash && "Hash",""].filter(Boolean);
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
          {rows.map((tx, i) => (
            <tr key={tx.id} className={`border-b border-green-50 hover:bg-green-50/60 transition-colors ${i%2===0 ? "bg-white" : "bg-green-50/20"}`}>
              <td className="px-4 py-3.5 mono text-xs text-gray-400">{tx.id}</td>
              <td className="px-4 py-3.5"><TypeBadge type={tx.type}/></td>
              <td className="px-4 py-3.5 font-bold text-green-900">${tx.amount} <span className="text-green-400 font-normal text-xs">{tx.token}</span></td>
              <td className="px-4 py-3.5 text-emerald-600 text-xs font-medium">PKR {tx.pkr.toLocaleString()}</td>
              <td className="px-4 py-3.5 mono text-xs text-gray-500">{tx.raast}</td>
              <td className="px-4 py-3.5"><StatusBadge status={tx.status}/></td>
              <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{fmt(tx.date)}</td>
              {showHash && <td className="px-4 py-3.5 mono text-xs text-gray-300">{tx.hash}</td>}
              <td className="px-4 py-3.5">
                {tx.status === "claimable"
                  ? <button onClick={() => onClaim(tx.id)} className="bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                      {claimingId === tx.id ? <span className="shimmer-bar inline-block w-10 h-3 rounded"/> : "Claim"}
                    </button>
                  : <span className="text-gray-300">—</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}





export default function Dashboard() {
  const [tab,        setTab]        = useState("overview");
  const [showSend,   setShowSend]   = useState(false);
  const [showRec,    setShowRec]    = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [txFilter,   setTxFilter]   = useState("all");
  const [claimingId, setClaimingId] = useState(null);

  const user      = MOCK_USER;
  const claimable = TXS.filter(t => t.status === "claimable");
  const filtered  = txFilter === "all" ? TXS : TXS.filter(t => t.type === txFilter || t.status === txFilter);

  const copy  = () => { navigator.clipboard.writeText(user.wallet); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const claim = (id) => { setClaimingId(id); setTimeout(() => setClaimingId(null), 2000); };

  return (
    <>
      <Animations/>
      <div className="flex min-h-screen bg-green-50/40">

        <aside className="w-60 shrink-0 bg-white rounded-md border-r border-green-100 flex flex-col p-5 gap-2 sticky top-0 h-screen overflow-y-auto">
         

          <nav className="flex flex-col gap-1 flex-1">
            {NAV.map(n => (
              <button key={n.id} onClick={() => setTab(n.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative text-left ${tab===n.id ? "bg-green-600 text-white shadow-md shadow-green-200" : "text-gray-600 hover:bg-green-50 hover:text-green-700"}`}>
                <span className="text-base w-5 text-center">{n.icon}</span>
                {n.label}
                {n.id==="claims" && claimable.length>0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{claimable.length}</span>
                )}
              </button>
            ))}

            <div className="mt-4 pt-4 border-t border-green-100 flex flex-col gap-1">
              <button onClick={() => setShowSend(true)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all text-left">
                <span className="w-5 text-center">↑</span> Send
              </button>
              <button onClick={() => setShowRec(true)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all text-left">
                <span className="w-5 text-center">↓</span> Receive
              </button>
            </div>
          </nav>

          <div className="bg-green-50 rounded-2xl p-3 flex items-center gap-2.5">
            <img src={user.picture} className="w-9 h-9 rounded-full border-2 border-green-200" alt="avatar"/>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{user.email}</p>
              <p className="mono text-xs text-green-400 truncate">{trunc(user.wallet)}</p>
            </div>
            <button onClick={() => alert("Logged out")} className="text-red-400 hover:text-red-600 transition-colors" title="Logout">⏻</button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-auto">

          <div className="flex justify-between items-center px-8 py-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-green-900 tracking-tight">
                {tab==="overview"&&"Dashboard"}
                {tab==="transactions"&&"Transactions"}
                {tab==="claims"&&"Claimable Funds"}
              </h1>
              <p className="text-xs text-green-400 mt-0.5">
                {new Date().toLocaleDateString("en-PK",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <span className="flex items-center gap-1.5 bg-white border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                <span className="pulse-dot w-2 h-2 rounded-full bg-green-500 inline-block"/>zkSync Era
              </span>
            </div>
          </div>

          <div className="px-8 pb-8 flex flex-col gap-5">

            {tab==="overview" && (
              <>
                <div className="bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 rounded-3xl p-7 text-white relative overflow-hidden shadow-xl shadow-green-200/60">
                  <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full pointer-events-none"/>
                  <div className="absolute bottom-0 left-1/3 w-36 h-36 bg-white/5 rounded-full translate-y-1/2 pointer-events-none"/>
                  <div className="relative z-10 flex flex-wrap justify-between items-start gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-green-300 mb-2">zkSync Wallet</p>
                      <p className="mono text-base font-medium tracking-wide">{trunc(user.wallet)}</p>
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
                      <p className="text-4xl font-extrabold">$2,325</p>
                      <p className="text-xs text-green-300 mt-1">≈ PKR 6,48,675</p>
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

                {claimable.length > 0 && (
                  <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 flex items-center gap-4 flex-wrap">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 text-xl shrink-0">◈</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-teal-800">{claimable.length} claimable request{claimable.length>1?"s":""} ready</p>
                      <p className="text-xs text-teal-600 mt-0.5">Total: ${claimable.reduce((a,c)=>a+c.amount,0)} USDT — timelock expired</p>
                    </div>
                    <button onClick={() => setTab("claims")} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 shrink-0">
                      Claim Now →
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
                  <div className="flex justify-between items-center px-5 py-4 border-b border-green-50">
                    <p className="text-sm font-bold text-green-900">Recent Activity</p>
                    <button onClick={() => setTab("transactions")} className="text-xs text-green-500 hover:text-green-700 font-semibold transition-colors">See all →</button>
                  </div>
                  <TxTable rows={TXS.slice(0,4)} onClaim={claim} claimingId={claimingId}/>
                </div>
              </>
            )}

            {tab==="transactions" && (
              <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
                <div className="flex gap-2 px-5 py-4 border-b border-green-50 flex-wrap">
                  {["all","send","receive","claim","confirmed","pending","claimable"].map(f => (
                    <button key={f} onClick={() => setTxFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${txFilter===f ? "bg-green-600 text-white shadow-md shadow-green-200" : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"}`}>
                      {f.charAt(0).toUpperCase()+f.slice(1)}
                    </button>
                  ))}
                </div>
                <TxTable rows={filtered} onClaim={claim} claimingId={claimingId} showHash/>
              </div>
            )}

            {tab==="claims" && (
              <>
                {claimable.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                    <span className="text-5xl">◈</span>
                    <p className="text-lg font-bold text-green-900">No claimable funds</p>
                    <p className="text-sm text-green-400">When your timelock expires, funds will appear here.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-gradient-to-br from-green-800 to-emerald-600 rounded-3xl p-6 text-white flex flex-wrap justify-between items-center gap-4 shadow-xl shadow-green-200/50">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-green-300 mb-1">Total Claimable</p>
                        <p className="text-3xl font-extrabold">${claimable.reduce((a,c)=>a+c.amount,0)} <span className="text-lg font-normal text-green-300">USDT</span></p>
                        <p className="text-xs text-green-300 mt-1">≈ PKR {claimable.reduce((a,c)=>a+c.pkr,0).toLocaleString()}</p>
                      </div>
                      <button onClick={() => claimable.forEach(c => claim(c.id))}
                        className="bg-white/20 hover:bg-white/30 border border-white/25 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95">
                        Claim All
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {claimable.map(tx => (
                        <div key={tx.id} className="bg-white rounded-2xl border border-green-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center text-xl shrink-0">◈</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center flex-wrap gap-1">
                              <span className="mono text-xs text-gray-400">{tx.id}</span>
                              <span className="text-xs text-gray-400">{fmt(tx.date)}</span>
                            </div>
                            <p className="text-base font-extrabold text-green-900 mt-0.5">
                              ${tx.amount} <span className="text-green-400 font-normal text-sm">USDT</span>
                              <span className="text-emerald-500 font-medium text-sm ml-2">≈ PKR {tx.pkr.toLocaleString()}</span>
                            </p>
                            <p className="mono text-xs text-gray-300 mt-0.5">{tx.hash}</p>
                          </div>
                          <button onClick={() => claim(tx.id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all active:scale-95 shrink-0">
                            {claimingId===tx.id ? <span className="shimmer-bar inline-block w-12 h-3.5 rounded"/> : "Claim"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {showSend && <SendModal onClose={() => setShowSend(false)}/>}
      {showRec  && <ReceiveModal wallet={user.wallet} onClose={() => setShowRec(false)}/>}
    </>
  );
}