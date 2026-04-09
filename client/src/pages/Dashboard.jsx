import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowUpRight, Zap, Lock, Globe, TrendingUp, Github, Twitter, ChevronDown, Sparkles } from 'lucide-react';

const useInView = (threshold = 0.1) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

const Reveal = ({ children, delay = 0, y = 40, className = '', style = {} }) => {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : `translateY(${y}px)`,
      transition: `opacity 0.85s ease ${delay}s, transform 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      ...style,
    }}>{children}</div>
  );
};

const useTicker = (base = 278.45) => {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setVal(v => +(v + (Math.random() - 0.49) * 0.14).toFixed(2)), 2200);
    return () => clearInterval(id);
  }, []);
  return val;
};

export default function Landing() {
  const [amount, setAmount] = useState('500');
  const [token, setToken] = useState('USDC');
  const rate = useTicker(282);
  const pkrRate=import.meta.env.VITE_PKR_RATE;
  const pkrOut = amount ? Math.round(parseFloat(amount || 0) * pkrRate).toLocaleString() : '0';

  const marquee = ['USDC → PKR', 'Under 10 Seconds', 'zkSync L2', 'Raast Settlement', 'No KYC Required', 'Non-Custodial', 'Live Rates', 'Google Login'];
  const conversionDetails = [
  { 
    id: 1, 
    label: 'Rate', 
    value: `1 ${token} = ${pkrRate}` 
  },
  { 
    id: 2, 
    label: 'Network', 
    value: 'zkSync Sepolia' 
  },
  { 
    id: 3, 
    label: 'Est. time', 
    value: '< 10 seconds' 
  },
  { 
    id: 4, 
    label: 'Fee', 
    value: '~$0.001' 
  }
];
  const features = [
    { icon: <Zap size={19}/>, tag: 'Speed', title: 'Settles in 10 seconds', body: 'zkSync L2 processes your conversion instantly. Funds reach Raast before you finish reading this sentence.' },
    { icon: <Lock size={19}/>, tag: 'Security', title: 'Zero-knowledge proofs', body: 'Non-custodial smart contracts built on battle-tested cryptography. Your keys, your crypto — always.' },
    { icon: <Globe size={19}/>, tag: '24 / 7', title: 'Never goes offline', body: 'On-chain automation means the bridge never sleeps, never delays. Bridge at 3 AM on a public holiday.' },
  ];

  const steps = [
    { n: '01', t: 'Connect your wallet', d: 'MetaMask, WalletConnect, or sign in with Google — Privy handles the onboarding instantly.' },
    { n: '02', t: 'Enter your amount', d: 'Pick USDC or USDT and type how much you want converted to Pakistani Rupees.' },
    { n: '03', t: 'Receive in Raast', d: 'Funds land in your Raast account in under 10 seconds. No paperwork, no waiting.' },
  ];

  return (
    <div style={{ fontFamily: "'Instrument Sans', sans-serif", background: '#fafdf7', color: '#1a2e1c', overflowX: 'hidden', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,600;1,9..144,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink:    #1a2e1c;
          --ink2:   #2d4a30;
          --ink3:   #4a7a50;
          --moss:   #166534;
          --leaf:   #16a34a;
          --mint:   #4ade80;
          --sage:   #86efac;
          --mist:   #bbf7d0;
          --foam:   #dcfce7;
          --snow:   #f0fdf4;
          --white:  #ffffff;
          --border: rgba(22,163,74,0.14);
          --border2: rgba(22,163,74,0.08);
        }

        .serif { font-family: 'Fraunces', Georgia, serif; }
        .sans  { font-family: 'Instrument Sans', sans-serif; }

        /* ── HERO ── */
        .hero-section {
          max-width: 1300px; margin: 0 auto;
          padding: clamp(60px,10vw,120px) clamp(20px,5vw,72px) clamp(40px,6vw,80px);
          display: grid;
          grid-template-columns: 1fr 440px;
          gap: clamp(40px,5vw,80px);
          align-items: center;
        }
        @media (max-width: 900px) {
          .hero-section { grid-template-columns: 1fr; }
          .hero-conv { display: none; }
        }

        .hero-tag {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: 'Instrument Sans', sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.13em; text-transform: uppercase; color: var(--leaf);
          padding: 5px 14px; border-radius: 99px;
          border: 1px solid rgba(22,163,74,0.2); background: rgba(22,163,74,0.05);
          margin-bottom: 28px;
        }
        .live-dot {
          width: 7px; height: 7px; border-radius: 50%; background: var(--mint);
          animation: livePulse 2.2s ease-in-out infinite;
        }
        @keyframes livePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.55); }
          55%      { box-shadow: 0 0 0 7px rgba(74,222,128,0); }
        }

        .hero-h1 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(52px, 7vw, 96px);
          font-weight: 700; line-height: 0.92;
          letter-spacing: -0.03em; color: var(--ink);
          margin-bottom: 6px;
        }
        .hero-h1 .italic { font-style: italic; color: var(--moss); }
        .hero-h1 .light  { font-weight: 300; color: var(--ink3); }

        .hero-sub {
          font-family: 'Instrument Sans', sans-serif; font-weight: 400;
          font-size: clamp(15px,1.5vw,17px); line-height: 1.75;
          color: var(--ink3); max-width: 430px; margin: 22px 0 36px;
        }

        .hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 44px; }

        .btn-primary {
          font-family: 'Instrument Sans', sans-serif; font-weight: 600; font-size: 14px;
          padding: 13px 28px; border-radius: 99px; border: none;
          background: var(--ink); color: white; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        .btn-primary:hover { background: var(--moss); transform: translateY(-2px); box-shadow: 0 14px 32px -6px rgba(22,100,52,0.35); }

        .btn-outline {
          font-family: 'Instrument Sans', sans-serif; font-weight: 500; font-size: 14px;
          padding: 12px 24px; border-radius: 99px;
          border: 1.5px solid rgba(26,46,28,0.15); color: var(--ink2);
          background: transparent; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.25s ease;
        }
        .btn-outline:hover { border-color: var(--moss); color: var(--moss); }

        .rate-strip {
          display: inline-flex; align-items: center; gap: 14px;
          background: white; border: 1.5px solid var(--foam);
          border-radius: 16px; padding: 12px 20px;
          box-shadow: 0 2px 12px rgba(22,100,52,0.06);
        }
        .rate-lbl { font-family: 'Instrument Sans',sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--leaf); opacity: 0.7; }
        .rate-num { font-family: 'Fraunces',serif; font-weight: 600; font-size: 18px; color: var(--ink); letter-spacing: -0.02em; margin-top: 2px; }
        .rate-change { display: flex; align-items: center; gap: 4px; font-family: 'Instrument Sans',sans-serif; font-size: 12px; font-weight: 600; color: var(--leaf); }

        /* ── CONVERTER ── */
        .conv-card {
          background: white;
          border: 1.5px solid var(--foam);
          border-radius: 28px;
          padding: clamp(22px,3vw,32px);
          box-shadow: 0 24px 64px -12px rgba(22,100,52,0.12), 0 0 0 1px rgba(22,163,74,0.04);
        }
        .conv-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .conv-title { font-family: 'Fraunces',serif; font-weight: 600; font-size: 15px; color: var(--ink); letter-spacing: -0.01em; }
        .conv-live { display: flex; align-items: center; gap: 5px; font-family: 'Instrument Sans',sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--leaf); }

        .conv-field {
          border-radius: 18px; padding: 16px 18px; margin-bottom: 8px;
          border: 1.5px solid transparent;
        }
        .cf-pay { background: var(--snow); border-color: var(--foam); }
        .cf-recv { background: var(--ink); }

        .cf-label { font-family: 'Instrument Sans',sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px; }
        .cf-label-pay  { color: var(--ink3); opacity: 0.6; }
        .cf-label-recv { color: var(--mint); opacity: 0.7; }

        .cf-row { display: flex; align-items: center; gap: 10px; }
        .cf-input {
          flex: 1; border: none; outline: none; background: transparent;
          font-family: 'Fraunces', serif; font-weight: 700;
          font-size: clamp(28px,4vw,44px); color: var(--ink); letter-spacing: -0.03em;
        }
        .cf-input::placeholder { color: var(--mist); }

        .tok-group { display: flex; gap: 5px; flex-shrink: 0; }
        .tok {
          font-family: 'Instrument Sans',sans-serif; font-weight: 600; font-size: 11px;
          padding: 5px 12px; border-radius: 99px; cursor: pointer; border: 1.5px solid transparent;
          transition: all 0.18s ease;
        }
        .tok-on  { background: var(--ink); color: white; border-color: var(--ink); }
        .tok-off { background: white; color: var(--ink2); border-color: var(--border); }
        .tok-off:hover { border-color: var(--moss); }

        .cf-hint { font-family: 'Instrument Sans',sans-serif; font-size: 11px; color: var(--ink3); opacity: 0.5; margin-top: 6px; }
        .cf-hint-recv { color: var(--sage); opacity: 0.7; }

        .cf-pkr-row { display: flex; align-items: baseline; gap: 8px; }
        .cf-pkr-amt { font-family: 'Fraunces',serif; font-weight: 700; font-size: clamp(30px,4vw,46px); color: white; letter-spacing: -0.03em; line-height: 1; }
        .cf-pkr-cur { font-family: 'Fraunces',serif; font-weight: 400; font-style: italic; font-size: 18px; color: var(--mint); }

        .swap-icon {
          display: flex; justify-content: center; margin: 2px 0;
        }
        .swap-circle {
          width: 36px; height: 36px; border-radius: 50%;
          background: white; border: 1.5px solid var(--foam);
          display: flex; align-items: center; justify-content: center;
          color: var(--ink3); cursor: pointer;
          box-shadow: 0 2px 8px rgba(22,100,52,0.08);
          transition: transform 0.35s ease, border-color 0.2s;
        }
        .swap-circle:hover { transform: rotate(180deg); border-color: var(--mint); }

        .conv-meta { display: flex; flex-direction: column; gap: 7px; margin: 14px 0; padding: 14px 16px; background: var(--snow); border-radius: 14px; }
        .meta-row  { display: flex; justify-content: space-between; align-items: center; }
        .meta-k { font-family: 'Instrument Sans',sans-serif; font-size: 12px; color: var(--ink3); opacity: 0.55; }
        .meta-v { font-family: 'Instrument Sans',sans-serif; font-size: 12px; font-weight: 600; color: var(--ink2); }

        .conv-cta {
          width: 100%; padding: 14px; border-radius: 14px; border: none;
          font-family: 'Fraunces',serif; font-weight: 600; font-size: 16px; letter-spacing: -0.01em; font-style: italic;
          background: var(--ink); color: white; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: all 0.28s ease;
        }
        .conv-cta:hover { background: var(--moss); transform: translateY(-2px); box-shadow: 0 14px 32px -6px rgba(22,100,52,0.35); }
        .conv-note { text-align: center; font-family: 'Instrument Sans',sans-serif; font-size: 11px; color: var(--ink3); opacity: 0.38; margin-top: 10px; }

        /* ── MARQUEE ── */
        @keyframes mq { to { transform: translateX(-50%); } }
        .mq-track { animation: mq 28s linear infinite; display: inline-flex; white-space: nowrap; }
        .mq-track:hover { animation-play-state: paused; }

        /* ── SHARED ── */
        .wrap { max-width: 1300px; margin: 0 auto; padding: 0 clamp(20px,5vw,72px); }

        .section-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'Instrument Sans',sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--leaf);
          padding: 5px 13px; border-radius: 99px;
          border: 1px solid rgba(22,163,74,0.18); background: rgba(22,163,74,0.04);
        }

        .section-h2 {
          font-family: 'Fraunces', serif; font-weight: 700;
          font-size: clamp(36px,5vw,62px); letter-spacing: -0.035em;
          color: var(--ink); line-height: 0.95; margin: 18px 0 0;
        }
        .section-h2 em { font-style: italic; color: var(--ink3); font-weight: 400; }

        .rule { width: 40px; height: 2px; background: var(--mint); border-radius: 2px; margin: 16px 0 22px; }

        /* ── STATS ── */
        .stats-grid {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-top: 52px;
        }
        @media (max-width:640px) { .stats-grid { grid-template-columns: 1fr; } }

        .stat-card {
          background: white; border: 1.5px solid var(--foam); border-radius: 22px; padding: 30px 26px;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .stat-card:hover { transform: translateY(-5px); border-color: var(--mist); box-shadow: 0 20px 48px -10px rgba(22,100,52,0.1); }
        .stat-val { font-family: 'Fraunces',serif; font-weight: 700; font-size: clamp(42px,5vw,60px); color: var(--ink); letter-spacing: -0.04em; line-height: 1; }
        .stat-val span { color: var(--leaf); }
        .stat-lbl { font-family: 'Instrument Sans',sans-serif; font-size: 13px; font-weight: 500; color: var(--ink3); opacity: 0.6; margin-top: 10px; }

        /* ── FEATURES ── */
        .feat-grid {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-top: 48px;
        }
        @media (max-width:840px) { .feat-grid { grid-template-columns: 1fr; } }

        .feat-card {
          background: white; border: 1.5px solid var(--foam); border-radius: 24px;
          padding: clamp(24px,3vw,36px); cursor: default;
          transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
          position: relative; overflow: hidden;
        }
        .feat-card:nth-child(2) { background: var(--ink); border-color: var(--ink); }
        .feat-card:nth-child(2) .feat-tag  { color: var(--mint); border-color: rgba(74,222,128,0.25); background: rgba(74,222,128,0.07); }
        .feat-card:nth-child(2) .feat-title{ color: white; }
        .feat-card:nth-child(2) .feat-body { color: rgba(232,245,224,0.45); }
        .feat-card:nth-child(2) .feat-icon { background: rgba(74,222,128,0.1); border-color: rgba(74,222,128,0.2); color: var(--mint); }
        .feat-card:hover { transform: translateY(-6px); box-shadow: 0 28px 56px -12px rgba(22,100,52,0.13); }
        .feat-card:nth-child(2):hover { box-shadow: 0 28px 56px -12px rgba(0,0,0,0.35); }

        .feat-icon {
          width: 46px; height: 46px; border-radius: 13px;
          background: var(--snow); border: 1.5px solid var(--foam);
          display: flex; align-items: center; justify-content: center;
          color: var(--ink2); margin-bottom: 20px;
        }
        .feat-tag {
          display: inline-block; font-family: 'Instrument Sans',sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--leaf);
          padding: 3px 10px; border-radius: 99px; border: 1px solid rgba(22,163,74,0.18);
          background: rgba(22,163,74,0.05); margin-bottom: 10px;
        }
        .feat-title { font-family: 'Fraunces',serif; font-weight: 600; font-size: 19px; color: var(--ink); letter-spacing: -0.02em; margin-bottom: 10px; line-height: 1.15; }
        .feat-body  { font-family: 'Instrument Sans',sans-serif; font-weight: 400; font-size: 14px; color: var(--ink3); line-height: 1.75; opacity: 0.75; }

        /* ── HOW IT WORKS ── */
        .hiw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(40px,7vw,100px); align-items: start; }
        @media (max-width:840px) { .hiw-grid { grid-template-columns: 1fr; } }

        .hiw-sticky { position: sticky; top: 80px; }

        .rate-box {
          background: var(--ink); border-radius: 20px; padding: 22px 24px; margin-top: 26px;
          display: inline-block; width: 100%;
        }
        .rate-box-lbl { font-family: 'Instrument Sans',sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mint); opacity: 0.6; margin-bottom: 6px; }
        .rate-box-val { font-family: 'Fraunces',serif; font-weight: 600; font-size: 22px; color: white; letter-spacing: -0.02em; }
        .rate-box-sub { font-family: 'Instrument Sans',sans-serif; font-size: 11px; color: var(--sage); opacity: 0.45; margin-top: 5px; }

        .step-row {
          display: flex; gap: 20px; padding: 22px 16px; border-radius: 16px;
          border-bottom: 1px solid var(--foam);
          transition: background 0.22s ease; cursor: default;
        }
        .step-row:last-child { border-bottom: none; }
        .step-row:hover { background: white; }
        .step-n { font-family: 'Fraunces',serif; font-size: 11px; font-weight: 400; font-style: italic; color: var(--mist); min-width: 26px; padding-top: 5px; }
        .step-title { font-family: 'Fraunces',serif; font-weight: 600; font-size: 19px; color: var(--ink); letter-spacing: -0.02em; margin-bottom: 7px; }
        .step-body  { font-family: 'Instrument Sans',sans-serif; font-size: 14px; color: var(--ink3); opacity: 0.65; line-height: 1.7; }

        /* ── CTA ── */
        .cta-wrap {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1.5px solid var(--mist); border-radius: 28px;
          padding: clamp(40px,6vw,80px) clamp(28px,5vw,72px);
          display: grid; grid-template-columns: 1fr auto; gap: 40px; align-items: center;
          position: relative; overflow: hidden;
        }
        @media (max-width:640px) { .cta-wrap { grid-template-columns: 1fr; } }
        .cta-wrap::after {
          content: ''; position: absolute; right: -60px; top: -60px;
          width: 260px; height: 260px; border-radius: 50%;
          background: radial-gradient(circle, rgba(74,222,128,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-h2 { font-family: 'Fraunces',serif; font-weight: 700; font-size: clamp(28px,4.5vw,54px); color: var(--ink); letter-spacing: -0.04em; line-height: 1; margin: 14px 0 12px; }
        .cta-h2 em { font-style: italic; color: var(--moss); }
        .cta-sub { font-family: 'Instrument Sans',sans-serif; font-size: 15px; color: var(--ink3); opacity: 0.65; }
        .cta-btns { display: flex; flex-direction: column; gap: 10px; min-width: 175px; position: relative; z-index: 1; }

        /* ── FOOTER ── */
        .footer-wrap { border-top: 1px solid var(--foam); padding: clamp(28px,4vw,44px) clamp(20px,5vw,72px); background: white; }
        .footer-inner { max-width: 1300px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .footer-logo { font-family: 'Fraunces',serif; font-weight: 700; font-size: 19px; color: var(--ink); letter-spacing: -0.03em; font-style: italic; }
        .footer-logo span { color: var(--leaf); }
        .footer-links { display: flex; gap: 16px; }
        .footer-link { color: var(--ink3); opacity: 0.3; transition: opacity 0.2s; cursor: pointer; }
        .footer-link:hover { opacity: 0.8; }
        .footer-copy { max-width: 1300px; margin: 20px auto 0; padding-top: 18px; border-top: 1px solid var(--foam); text-align: center; font-family: 'Instrument Sans',sans-serif; font-size: 11px; color: var(--ink3); opacity: 0.3; }

        hr.div { border: none; border-top: 1px solid var(--foam); margin: 0; }
      `}</style>

      {/* ── BG TEXTURE ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 50% at 5% 10%, rgba(187,247,208,0.35) 0%, transparent 55%), radial-gradient(ellipse 60% 55% at 95% 85%, rgba(220,252,231,0.3) 0%, transparent 55%)'
      }}/>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1 }}>
        <div className="hero-section">
          {/* Left */}
          <div>
            <Reveal delay={0.05}>
              <div className="hero-tag"><div className="live-dot"/>Live on zkSync Sepolia</div>
            </Reveal>
            <Reveal delay={0.12}>
              <h1 className="hero-h1">
                Bridge<br/>
                <span className="italic">stablecoins</span><br/>
                <span className="light">to PKR.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="hero-sub">Convert USDC or USDT directly to Pakistani Rupees in under 10 seconds — powered by zkSync, settled via Raast. No KYC, no delays.</p>
            </Reveal>
            <Reveal delay={0.27}>
              <div className="hero-ctas">
                <button className="btn-primary">Start Bridging <ArrowRight size={15}/></button>
                <button className="btn-outline">How it works <ChevronDown size={15}/></button>
              </div>
            </Reveal>
            <Reveal delay={0.33}>
              <div className="rate-strip">
                <div>
                  <div className="rate-lbl">Live Rate</div>
                  <div className="rate-num">1 {token} = {rate} PKR</div>
                </div>
                <div style={{ width: 1, height: 34, background: 'rgba(22,163,74,0.1)' }}/>
                <div className="rate-change"><TrendingUp size={13}/>+0.3%</div>
              </div>
            </Reveal>
          </div>

          {/* Right: converter */}
          <Reveal delay={0.17} className="hero-conv">
            <div className="conv-card">
              <div className="conv-hd">
                <span className="conv-title">Convert stablecoins</span>
                <div className="conv-live"><div className="live-dot"/>Live</div>
              </div>

              {/* Pay */}
              <div className="conv-field cf-pay">
                <div className="cf-label cf-label-pay">You pay</div>
                <div className="cf-row">
                  <input className="cf-input" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g,''))} placeholder="0"/>
                  <div className="tok-group">
                    {['USDC','USDT'].map(t => (
                      <button key={t} onClick={()=>setToken(t)} className={`tok ${token===t?'tok-on':'tok-off'}`}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="cf-hint">≈ ${amount||'1'} </div>
              </div>

              <div className="swap-icon">
                <div className="swap-circle"><ArrowRight size={15} style={{ transform:'rotate(90deg)'}}/></div>
              </div>

              {/* Receive */}
              <div className="conv-field cf-recv">
                <div className="cf-label cf-label-recv">You receive</div>
                <div className="cf-pkr-row">
                  <div className="cf-pkr-amt">{pkrOut}</div>
                  <span className="cf-pkr-cur">PKR</span>
                </div>
                <div className="cf-hint cf-hint-recv">via Raast · ~8 seconds · zero fees</div>
              </div>

              {/* Meta */}
              <div className="conv-meta">
                {[['Rate',`1 ${token} = ${pkrRate}`],['Network','zkSync Sepolia'],['Est. time','< 10 seconds'],['Fee','~$0.001']].map(([k,v])=>(
                  <div key={k} className="meta-row">
                    <span className="meta-k">{k}</span> 
                    <span className="meta-v">{v}</span>
                  </div>
                ))}
              </div>

              <button className="conv-cta">Bridge Now <ArrowRight size={15}/></button>
              <div className="conv-note">Non-custodial · No KYC · Powered by zkSync</div>
            </div>
          </Reveal>
        </div>
      </section>

  
      <div style={{ overflow:'hidden', borderTop:'1px solid var(--foam)', borderBottom:'1px solid var(--foam)', background: 'white', padding:'13px 0', position:'relative', zIndex:1 }}>
        <div className="mq-track">
          {[...marquee,...marquee,...marquee].map((t,i)=>(
            <span key={i} style={{ fontFamily:'Instrument Sans', fontSize:10, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--leaf)', opacity:0.55, padding:'0 28px' }}>
              {t}<span style={{ opacity:0.25, marginLeft:26 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      <section style={{ padding:'clamp(60px,8vw,96px) 0', position:'relative', zIndex:1 }}>
        <div className="wrap">
          <Reveal>
            <span className="section-tag">By the numbers</span>
            <h2 className="section-h2">Trusted by<br/><em>thousands.</em></h2>
            <div className="rule"/>
          </Reveal>
          <div className="stats-grid">
            {[
              { v:'$2.5M', s:'+', l:'Total Volume Bridged' },
              { v:'5,000', s:'+', l:'Successful Transactions' },
              { v:'< 10s', s:'',  l:'Average Settlement Time' },
            ].map((s,i)=>(
              <Reveal key={i} delay={i*0.1}>
                <div className="stat-card">
                  <div className="stat-val">{s.v}<span>{s.s}</span></div>
                  <div className="stat-lbl">{s.l}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <hr className="div"/>

      <section style={{ padding:'clamp(60px,8vw,96px) 0', position:'relative', zIndex:1 }}>
        <div className="wrap">
          <Reveal>
            <span className="section-tag">Why Rupia</span>
            <h2 className="section-h2">Built for<br/><em>professionals.</em></h2>
            <div className="rule"/>
          </Reveal>
          <div className="feat-grid">
            {features.map((f,i)=>(
              <Reveal key={i} delay={i*0.1}>
                <div className="feat-card">
                  <div className="feat-icon">{f.icon}</div>
                  <div className="feat-tag">{f.tag}</div>
                  <div className="feat-title">{f.title}</div>
                  <div className="feat-body">{f.body}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <hr className="div"/>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding:'clamp(60px,8vw,96px) 0', position:'relative', zIndex:1 }}>
        <div className="wrap">
          <div className="hiw-grid">
            <Reveal>
              <div className="hiw-sticky">
                <span className="section-tag">Process</span>
                <h2 className="section-h2">Three steps.<br/><em>Ten seconds.</em></h2>
                <div className="rule"/>
                <p style={{ fontFamily:'Instrument Sans', fontWeight:400, fontSize:15, color:'var(--ink3)', opacity:0.65, lineHeight:1.75, maxWidth:310 }}>
                  No paperwork, no bank approvals. Connect your wallet and your PKR is on its way.
                </p>
                <div className="rate-box">
                  <div className="rate-box-lbl">Current Rate</div>
                  <div className="rate-box-val">1 {token} = {rate} PKR</div>
                  <div className="rate-box-sub">Live · Updates every 2s</div>
                </div>
              </div>
            </Reveal>

            <div>
              {steps.map((s,i)=>(
                <Reveal key={i} delay={i*0.12}>
                  <div className="step-row">
                    <span className="step-n">{s.n}</span>
                    <div>
                      <div className="step-title">{s.t}</div>
                      <div className="step-body">{s.d}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
              <Reveal delay={0.38}>
                <div style={{ padding:'28px 16px 0' }}>
                  <button className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'14px', fontSize:15, borderRadius:14 }}>
                    Start Your First Bridge <ArrowRight size={16}/>
                  </button>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'clamp(40px,6vw,80px) 0 clamp(60px,8vw,100px)', position:'relative', zIndex:1 }}>
        <div className="wrap">
          <Reveal>
            <div className="cta-wrap">
              <div>
                <span className="section-tag">Get started</span>
                <h2 className="cta-h2">Ready to bridge<br/><em>your first crypto?</em></h2>
                <p className="cta-sub">No account needed. Just connect and bridge.</p>
              </div>
              <div className="cta-btns">
                <button className="btn-primary" style={{ justifyContent:'center' }}>Launch App <ArrowUpRight size={15}/></button>
                <button className="btn-outline" style={{ justifyContent:'center', background:'white' }}>Read Docs</button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer-wrap" style={{ position:'relative', zIndex:1 }}>
        <div className="footer-inner">
          <div className="footer-logo">rupia<span>.</span></div>
          <span style={{ fontFamily:'Instrument Sans', fontSize:12, color:'var(--ink3)', opacity:0.35 }}>Powered by zkSync · Secure · Fast · Reliable</span>
          <div className="footer-links">
            <a className="footer-link"><Github size={17}/></a>
            <a className="footer-link"><Twitter size={17}/></a>
          </div>
        </div>
        <div className="footer-copy">© 2025 PKR Bridge. All rights reserved.</div>
      </footer>
    </div>
  );
}