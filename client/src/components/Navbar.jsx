import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, LogOut, User as UserIcon, BringToFront, X ,Copy , } from "lucide-react"
import MobileOptions from './MobileOptions.jsx'
import { useUser } from "../context/userContext"

const Navbar = () => {
  const [isopen, setIsOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [copied, setCopied] = useState(false);
  const { isAuthenticated, logout, address, wallet } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDisconnect = () => {
    logout();
    navigate("/");
  };

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrolled = scrollY > 40;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');
        .nav-root {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          font-family: 'Syne', sans-serif;
          transition: all 0.4s ease;
        }
        .nav-root.scrolled {
          background: rgba(240,253,244,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #dcfce7;
          box-shadow: 0 2px 20px rgba(20,83,45,0.06);
        }
        .nav-root.top {
          background: transparent;
        }
        .nav-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 48px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none;
        }
        .nav-logo-icon {
          width: 34px; height: 34px;
          background: #14532d;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .nav-logo-text {
          font-size: 17px; font-weight: 800;
          color: #14532d; letter-spacing: -0.02em;
        }
        .nav-links {
          display: flex; align-items: center; gap: 36px;
        }
        .nav-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500;
          color: #166534; opacity: 0.7;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .nav-link:hover { opacity: 1; }
        .nav-actions {
          display: flex; align-items: center; gap: 10px;
        }
        .btn-launch {
          background: #14532d; color: white;
          border: none; padding: 10px 22px;
          border-radius: 100px;
          font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 700;
          cursor: pointer; text-decoration: none;
          display: inline-flex; align-items: center; gap: 6px;
          transition: all 0.3s ease;
          letter-spacing: -0.01em;
        }
        .btn-launch:hover {
          background: #166534;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(20,83,45,0.25);
        }
        .btn-outline {
          background: white; color: #14532d;
          border: 1.5px solid #bbf7d0;
          padding: 9px 18px; border-radius: 100px;
          font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 700;
          cursor: pointer; text-decoration: none;
          display: inline-flex; align-items: center; gap: 6px;
          transition: all 0.3s ease;
        }
        .btn-outline:hover {
          border-color: #14532d;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(20,83,45,0.1);
        }
        .btn-danger {
          background: transparent; color: #dc2626;
          border: 1.5px solid #fecaca;
          padding: 9px 16px; border-radius: 100px;
          font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 700;
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px;
          transition: all 0.3s ease;
        }
        .btn-danger:hover {
          background: #fef2f2;
          border-color: #dc2626;
          transform: translateY(-1px);
        }
        .addr-pill {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500;
          color: #16a34a; background: #f0fdf4;
          border: 1px solid #dcfce7;
          padding: 6px 12px; border-radius: 100px;
          letter-spacing: 0.02em;
        }
        /* Mobile */
        .mob-menu-btn {
          background: none; border: none; cursor: pointer;
          color: #14532d; padding: 4px;
          display: none;
        }
        .mob-launch {
          display: none;
        }
        @media (max-width: 768px) {
          .nav-inner { padding: 0 20px; }
          .nav-links { display: none; }
          .nav-actions { display: none; }
          .mob-menu-btn { display: flex; }
          .mob-launch { display: inline-flex; }
        }
      `}</style>
      <nav className={`nav-root ${scrolled ? 'scrolled' : 'top'}`}>
        <div className="nav-inner">


          <button className="mob-menu-btn" onClick={() => setIsOpen(!isopen)}>
            {isopen ? <X size={22} /> : <Menu size={22} />}
          </button>


          <Link to="/" className="nav-logo">
            <img src="l2.png" className='w-30' alt="" />
          </Link>


          <div className="nav-links">
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/about" className="nav-link">About</Link>
            {address && (
              <button onClick={copy} className={`addr-pill ${copied ? 'bg-green-100 border-green-500' : ''}`}>
                {copied ? (
                  <span className="text-green-700 font-bold">Copied</span>
                ) : (
                  <div className="flex flex-row items-center">

                    {address.slice(0, 6)}…{address.slice(-4)}
                    <span className="ml-2 text-xs opacity-50"><Copy size={15} /></span>
                  </div>
                 
                )}
              </button>
            )}


          </div>


          <div className="nav-actions">
            {isAuthenticated ? (
              <>
                <Link to="/launch" className="btn-outline">
                  <BringToFront size={14} />
                  Bridge
                </Link>
                <Link to="/profile" className="btn-outline">
                  <UserIcon size={14} />
                  Dashboard
                </Link>
                <button onClick={handleDisconnect} className="btn-danger">
                  <LogOut size={14} />
                  Disconnect
                </button>
              </>
            ) : (
              <Link to="/launch" className="btn-launch">
                Launch App
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
              </Link>
            )}
          </div>

          {!isAuthenticated && (
            <Link to="/launch" className="btn-launch mob-launch" style={{ fontSize: 12, padding: '8px 16px' }}>
              Launch
            </Link>
          )}
        </div>
      </nav>
      <div style={{ height: 72 }} />
      <MobileOptions onClose={() => setIsOpen(false)} open={isopen} />
    </>
  );
};

export default Navbar;