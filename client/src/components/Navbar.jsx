import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, LogOut, User as UserIcon, BringToFront, X, Copy } from "lucide-react"
import MobileOptions from './MobileOptions.jsx'
import { useUser } from "../context/userContext"
import axios from "axios"
import toast from "react-hot-toast"

export default function Navbar() {
  const [isOpen, setIsOpen]   = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [copied, setCopied]   = useState(false);
  const { isAuthenticated, logout, address } = useUser();
  const[funding , setFunding]=useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);



  const fundUser=async (address) => {
    try {
      setFunding(true)
      const res=await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/sendfund`,{
      address:address
    });
    toast.success('Funds sent successfully')
    return res.data.hash;
    } catch (error) {
      console.error(error.message);
      toast.error(error?.response?.data?.message || 'Someting went wrong ... ')

    }finally{
      setFunding(false);
    }
  }

  const handleDisconnect = () => { logout(); navigate('/'); };

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');

        .nb-root {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: background 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease;
        }
        .nb-root.at-top {
          background: transparent;
          border-bottom: 1px solid transparent;
        }
        .nb-root.scrolled {
          background: rgba(248,253,249,0.88);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border-bottom: 1px solid rgba(187,247,208,0.6);
          box-shadow: 0 2px 24px rgba(20,83,45,0.06);
        }

        .nb-inner {
          max-width: 1300px; margin: 0 auto;
          padding: 0 clamp(20px,5vw,72px);
          height: 68px;
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
        }

        /* LOGO */
        .nb-logo {
          display: flex; align-items: center; gap: 9px;
          text-decoration: none; flex-shrink: 0;
          font-family: 'Fraunces', Georgia, serif;
          font-style: italic; font-weight: 600;
          font-size: 20px; color: #14532d; letter-spacing: -0.03em;
        }
        .nb-logo span { color: #4ade80; font-style: normal; }

        /* CENTER LINKS */
        .nb-links {
          display: flex; align-items: center; gap: 8px;
          flex: 1; justify-content: center;
        }
        .nb-link {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          color: #166534; opacity: 0.6;
          text-decoration: none; padding: 6px 14px; border-radius: 99px;
          transition: all 0.2s ease;
        }
        .nb-link:hover { opacity: 1; background: rgba(22,163,74,0.06); }

        /* ADDRESS PILL */
        .nb-addr {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; font-weight: 500;
          color: #16a34a; background: #f0fdf4;
          border: 1.5px solid #dcfce7;
          padding: 6px 13px; border-radius: 99px;
          display: inline-flex; align-items: center; gap: 6px;
          cursor: pointer; transition: all 0.2s ease;
          letter-spacing: 0.01em;
        }
        .nb-addr:hover { border-color: #86efac; background: #dcfce7; }
        .nb-addr.copied { border-color: #4ade80; background: #dcfce7; color: #14532d; }

        /* ACTIONS */
        .nb-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        .nb-btn {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 13px; font-weight: 600;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px; border-radius: 99px;
          text-decoration: none; cursor: pointer;
          transition: all 0.28s cubic-bezier(0.16,1,0.3,1);
          white-space: nowrap;
        }
        .nb-btn-solid {
          background: #14532d; color: white; border: none;
        }
        .nb-btn-solid:hover {
          background: #166534;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(20,83,45,0.28);
        }
        .nb-btn-ghost {
          background: white; color: #14532d;
          border: 1.5px solid #bbf7d0;
        }
        .nb-btn-ghost:hover {
          border-color: #14532d;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(20,83,45,0.1);
        }
        .nb-btn-danger {
          background: transparent; color: #dc2626;
          border: 1.5px solid #fecaca;
        }
        .nb-btn-danger:hover {
          background: #fef2f2; border-color: #dc2626;
          transform: translateY(-2px);
        }

        /* HAMBURGER */
        .nb-hamburger {
          display: none; background: none; border: none;
          color: #14532d; cursor: pointer; padding: 6px;
          border-radius: 8px; transition: background 0.2s;
        }
        .nb-hamburger:hover { background: rgba(22,163,74,0.08); }

        /* MOB LAUNCH (shown only on mobile when not authed) */
        .nb-mob-launch { display: none; }

        @media (max-width: 768px) {
          .nb-links   { display: none; }
          .nb-actions { display: none; }
          .nb-hamburger { display: flex; }
          .nb-mob-launch { display: inline-flex; }
        }
      `}</style>

      <nav className={`nb-root ${scrolled ? 'scrolled' : 'at-top'}`}>
        <div className="nb-inner">

          {/* Hamburger — mobile left */}
          <button className="nb-hamburger" onClick={() => setIsOpen(o => !o)} aria-label="Menu">
            {isOpen ? <X size={21}/> : <Menu size={21}/>}
          </button>

          {/* Logo — center on mobile, left on desktop */}
          <Link to="/" className="nb-logo">
            <img className='w-20' src="mainlogotransparent.png" alt="" />
          </Link>

          {/* Center nav links */}
          <div className="nb-links">
            <Link to="/contact" className="nb-link">Contact</Link>
            <Link to="/howitworks"   className="nb-link">How it works</Link>

            {/* Address pill — sits in center on desktop */}
            {address && (
              <button onClick={copy} className={`nb-addr ${copied ? 'copied' : ''}`}>
                {copied ? (
                  <span style={{ fontFamily:'Instrument Sans', fontWeight:600, fontSize:11 }}>✓ Copied</span>
                ) : (
                  <>
                    {address.slice(0,6)}…{address.slice(-4)}
                    <Copy size={12} style={{ opacity:0.45 }}/>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right actions */}
          <div className="nb-actions">
            {isAuthenticated ? (
              <>
                <Link to="/launch"  className="nb-btn nb-btn-ghost">
                  <BringToFront size={13}/> Bridge
                </Link>
                <Link to="/profile" className="nb-btn nb-btn-ghost">
                  <UserIcon size={13}/> Dashboard
                </Link>
                <button onClick={handleDisconnect} className="nb-btn nb-btn-danger">
                  <LogOut size={13}/> Disconnect
                </button>
               <div className="relative group inline-block">

  <button
    disabled={funding}
    onClick={() => fundUser(address)}
    className={`
      px-3 py-2 text-sm rounded-2xl border
      transition
      ${
        funding
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "text-green-400 border-green-200 hover:bg-green-50"
      }
    `}
  >
    {funding ? "Sending..." : "Claim Funds"}
  </button>

  {/* Tooltip */}
  <div
    className="
      absolute
      opacity-0 invisible
      group-hover:opacity-100
      group-hover:visible
      transition-all duration-200
      bottom-[-55px]
      left-1/2
      -translate-x-1/2
      bg-black text-white
      text-xs
      px-3 py-2
      rounded-xl
      whitespace-nowrap
      shadow-lg
      z-50
    "
  >
    Receive test ETH for trying the platform
  </div>

</div>
              </>
            ) : (
              <Link to="/launch" className="nb-btn nb-btn-solid">
                Launch App
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17L17 7M17 7H7M17 7v10"/>
                </svg>
              </Link>
            )}
          </div>

          {/* Mobile: show launch button only when not authed */}
          {!isAuthenticated && (
            <Link to="/launch" className="nb-btn nb-btn-solid nb-mob-launch" style={{ fontSize:12, padding:'8px 16px' }}>
              Launch
            </Link>
          )}

        </div>
      </nav>

   
      <div style={{ height: 68 }}/>

      <MobileOptions onClose={() => setIsOpen(false)} open={isOpen}/>
    </>
  );
}