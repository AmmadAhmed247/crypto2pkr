import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowUpRight, Zap, Lock, Globe, TrendingUp, Github, Twitter, ChevronDown } from 'lucide-react';
import {Link} from "react-router-dom"
const useLenis = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lenis@1.1.14/dist/lenis.min.js';
    script.async = true;
    script.onload = () => {
      const lenis = new window.Lenis({
        duration: 2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2,
      });
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      window.__lenis = lenis;
    };
    document.head.appendChild(script);
    return () => { window.__lenis?.destroy(); window.__lenis = null; script.remove(); };
  }, []);
};



const useParallax = (speed = 0.01) => {
  const ref = useRef(null);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (ref.current) {
            const y = window.scrollY * speed;
            ref.current.style.transform = `translateY(${y}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);
  return ref;
};

const useReveal = (threshold = 0.08) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

const Reveal = ({ children, delay = 0, y = 60, blur = true, className = '' }) => {
  const [ref, inView] = useReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0px)' : `translateY(${y}px)`,
      filter: blur ? (inView ? 'blur(0px)' : 'blur(4px)') : 'none',
      transition: `opacity 1s ease ${delay}s, transform 1s cubic-bezier(0.16,1,0.3,1) ${delay}s, filter 0.8s ease ${delay}s`,
    }}>{children}</div>
  );
};


const StaggerReveal = ({ children, baseDelay = 0, stagger = 0.12, className = '' }) => {
  const [ref, inView] = useReveal();
  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, i) => (
        <div style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0px)' : 'translateY(48px)',
          filter: inView ? 'blur(0px)' : 'blur(3px)',
          transition: `opacity 0.9s ease ${baseDelay + i * stagger}s, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${baseDelay + i * stagger}s, filter 0.7s ease ${baseDelay + i * stagger}s`,
        }}>{child}</div>
      ))}
    </div>
  );
};



export default function Landing() {
  const [amount, setAmount] = useState('500');
  const [token, setToken] = useState('USDC');
  const pkrRate = import.meta.env.VITE_PKR_RATE;
  const pkrOut = amount ? Math.round(parseFloat(amount || 0) * pkrRate).toLocaleString() : '0';

  useLenis();
  const orb1 = useParallax(0.08);
  const orb2 = useParallax(0.14);
  const orb3 = useParallax(0.06);
  const gridRef = useParallax(0.04);

  const marquee = ['USDC → PKR','Under 10 Seconds','zkSync L2','Raast Settlement','No KYC Required','Non-Custodial','Live Rates','Google Login'];

  const features = [
    { icon: <Zap size={18}/>, tag:'Speed',    title:'Settles in 10 seconds',  body:'zkSync L2 processes your conversion instantly. Funds reach Raast before you finish reading this.' },
    { icon: <Lock size={18}/>, tag:'Security', title:'Zero-knowledge proofs',  body:'Non-custodial smart contracts. Your keys, your crypto — always. No counterparty risk, ever.' },
    { icon: <Globe size={18}/>, tag:'24/7',    title:'Never goes offline',     body:'On-chain automation means the bridge never sleeps. Bridge at 3 AM on a public holiday.' },
  ];

  const steps = [
    { n:'01', t:'Connect your wallet',  d:'MetaMask, WalletConnect, or sign in with Google — Privy handles onboarding instantly.' },
    { n:'02', t:'Enter your amount',    d:'Choose USDC or USDT and type how much you want converted to Pakistani Rupees.' },
    { n:'03', t:'Receive in Raast',     d:'Funds land in your Raast account in under 10 seconds. No paperwork, no waiting.' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6fcf7]" style={{ fontFamily:"'Instrument Sans', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,600;1,9..144,700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        html { scroll-behavior: auto !important; }
        html.lenis, html.lenis body { height: auto; }
        .lenis.lenis-smooth { scroll-behavior: auto !important; }
        .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
        .f-serif { font-family:'Fraunces',Georgia,serif; }
        .f-sans  { font-family:'Instrument Sans',sans-serif; }
        .f-mono  { font-family:'JetBrains Mono',monospace; }

        /* Live dot */
        @keyframes livePulse { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.65)} 55%{box-shadow:0 0 0 8px rgba(74,222,128,0)} }
        .live-dot { animation: livePulse 2.4s ease-in-out infinite; }

        /* Marquee */
        @keyframes mqAnim { to { transform: translateX(-50%); } }
        .mq-run { animation: mqAnim 30s linear infinite; }
        .mq-run:hover { animation-play-state: paused; }

        /* Ticker */
        @keyframes tickFlash { 0%,100%{opacity:1} 45%{opacity:0.45} }
        .tick-blink { animation: tickFlash 2.2s ease-in-out infinite; }

        /* Subtle grid bg */
        .grid-bg {
          background-image:
            linear-gradient(rgba(22,163,74,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(22,163,74,0.04) 1px, transparent 1px);
          background-size: 52px 52px;
        }

        /* Floating orbs */
        .orb { border-radius: 50%; filter: blur(72px); pointer-events: none; position: absolute; will-change: transform; }

        /* Hero headline gradient */
        .hero-gradient-text {
          background: linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        /* Glass card */
        .glass {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.9);
        }

        /* Hover lift */
        .lift { transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease; }
        .lift:hover { transform: translateY(-8px); }

        /* Shimmer on stat cards */
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-line {
          background: linear-gradient(90deg, #bbf7d0 0%, #4ade80 40%, #bbf7d0 100%);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          height: 2px; border-radius: 2px; width: 40px;
        }

        /* Converter swap rotate */
        .swap-btn { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), background 0.2s; }
        .swap-btn:hover { transform: rotate(180deg) scale(1.15); }

        /* Feature card border glow on hover */
        .feat-card { transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, border-color 0.3s; }
        .feat-card:hover { transform: translateY(-10px) scale(1.01); }
        .feat-card-light:hover { box-shadow: 0 32px 64px -16px rgba(22,101,52,0.15), 0 0 0 1.5px rgba(74,222,128,0.3); }
        .feat-card-dark:hover  { box-shadow: 0 32px 64px -16px rgba(0,0,0,0.4); }

        /* Step row */
        .step-row { transition: background 0.25s ease, padding-left 0.3s ease; border-radius: 18px; }
        .step-row:hover { background: rgba(255,255,255,0.85); padding-left: 28px; }

        /* CTA block glow */
        .cta-block { position: relative; }
        .cta-block::before {
          content:''; position:absolute; inset:0; border-radius:inherit;
          background: radial-gradient(ellipse 60% 70% at 80% 30%, rgba(187,247,208,0.5), transparent 60%);
          pointer-events:none;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f0fdf4; }
        ::-webkit-scrollbar-thumb { background: #86efac; border-radius: 3px; }
      `}</style>

      {/*  FIXED BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div ref={gridRef} className="grid-bg absolute inset-0 opacity-100"/>
        <div ref={orb1} className="orb w-[600px] h-[600px] bg-green-200/40 -top-40 -left-32"/>
        <div ref={orb2} className="orb w-[500px] h-[500px] bg-emerald-200/35 top-1/3 -right-40"/>
        <div ref={orb3} className="orb w-[400px] h-[400px] bg-green-100/50 bottom-0 left-1/4"/>
      </div>

      {/*
          HERO
      */}
      <section className="relative z-10 max-w-[1300px] mx-auto px-5 sm:px-8 lg:px-[72px] pt-[80px] sm:pt-[110px] pb-20 grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-12 lg:gap-16 items-center min-h-screen">

        {/* LEFT */}
        <div>
          <Reveal delay={0.04} y={40}>
            <div className="inline-flex items-center gap-2 f-sans text-[11px] font-semibold tracking-[0.13em] uppercase text-green-700 px-4 py-2 rounded-full border border-green-200/80 bg-white/70 shadow-sm mb-8">
              <span className="live-dot w-[7px] h-[7px] rounded-full bg-green-400 inline-block flex-shrink-0"/>
              Live on zkSync Sepolia
            </div>
          </Reveal>

          <Reveal delay={0.1} y={50}>
            <h1 className="f-serif leading-[0.9] tracking-[-0.04em] mb-7" style={{ fontSize:'clamp(54px,8vw,108px)' }}>
              <span className="hero-gradient-text font-bold">Bridge</span><br/>
              <span className="italic text-green-800/90 font-semibold" style={{ fontSize:'0.92em' }}>stablecoins</span><br/>
              <span className="font-light text-green-900/35" style={{ fontSize:'0.78em', letterSpacing:'-0.02em' }}>to PKR.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.18} y={40}>
            <p className="f-sans text-green-800/55 leading-[1.8] mb-10 max-w-[400px]" style={{ fontSize:'clamp(15px,1.4vw,17px)', fontWeight:400 }}>
              Convert USDC or USDT directly to Pakistani Rupees in under&nbsp;10 seconds settled via Raast.
            </p>
          </Reveal>

          <Reveal delay={0.24} y={30}>
            <div className="flex flex-wrap gap-3 mb-11">
              <Link to={"/launch"} className="f-sans inline-flex items-center gap-2.5 bg-green-950 hover:bg-green-800 text-white font-semibold text-[14px] px-7 py-4 rounded-full shadow-lg shadow-green-950/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-950/30">
                Start Bridging <ArrowRight size={15}/>
              </Link>
              <button className="f-sans inline-flex items-center gap-2 border border-green-200 hover:border-green-600 text-green-800 hover:text-green-950 font-medium text-[14px] px-6 py-4 rounded-full transition-all duration-300 hover:-translate-y-0.5 glass">
                How it works <ChevronDown size={15}/>
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.3} y={25}>
            <div className="inline-flex items-center gap-4 glass border-green-100 rounded-2xl px-5 py-4 shadow-md shadow-green-100/60">
              <div>
                <div className="f-sans text-[10px] font-semibold tracking-[0.1em] uppercase text-green-600/70 mb-1.5">Live Rate</div>
                <div className="f-serif font-semibold text-green-950" style={{ fontSize:19, letterSpacing:'-0.025em' }}>
                  1 {token} = <span className="tick-blink text-green-700">{pkrRate}</span> PKR
                </div>
              </div>
              
              
            </div>
          </Reveal>
        </div>

        {/* RIGHT: CONVERTER */}
        <Reveal delay={0.14} y={60} className="hidden lg:block">
          <div className="glass rounded-[32px] border-green-100/80 p-8 shadow-[0_32px_80px_-16px_rgba(22,101,52,0.16),0_0_0_1px_rgba(255,255,255,0.9),inset_0_1px_0_rgba(255,255,255,1)]">

            <div className="flex justify-between items-center mb-6">
              <span className="f-serif font-semibold text-[15px] text-green-950" style={{ letterSpacing:'-0.01em' }}>Convert stablecoins</span>
              <div className="flex items-center gap-1.5 f-sans text-[10px] font-semibold tracking-[0.1em] uppercase text-green-500">
                <span className="live-dot w-[6px] h-[6px] rounded-full bg-green-400 inline-block"/>
                Live
              </div>
            </div>

            {/* PAY */}
            <div className="bg-green-50/80 rounded-[20px] px-5 py-4 mb-2 border border-green-100/80">
              <div className="f-sans text-[10px] font-semibold tracking-[0.1em] uppercase text-green-500/70 mb-2.5">You pay</div>
              <div className="flex items-center gap-3">
                <input
                  className="f-mono flex-1 min-w-0 bg-transparent border-none outline-none text-green-950 font-semibold placeholder-green-200"
                  style={{ fontSize:'clamp(30px,3.5vw,44px)', letterSpacing:'-0.035em' }}
                  value={amount}
                  onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g,''))}
                  placeholder="0"
                />
                <div className="flex gap-1.5 flex-shrink-0">
                  {['USDC','USDT'].map(t => (
                    <button key={t} onClick={() => setToken(t)}
                      className={`f-sans text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all duration-250 ${
                        token===t ? 'bg-green-950 text-white border-green-950 shadow-md shadow-green-950/20' : 'bg-white text-green-700 border-green-200 hover:border-green-500'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="f-mono text-[11px] text-green-600/35 mt-1.5">≈ ${amount||'0'} USD </div>
            </div>

            {/* SWAP */}
            <div className="flex justify-center my-1.5">
              <button className="swap-btn w-9 h-9 rounded-full bg-white border border-green-100 shadow-md shadow-green-100/80 flex items-center justify-center text-green-500">
                <ArrowRight size={15} className="rotate-90"/>
              </button>
            </div>

            {/* RECEIVE — dark */}
            <div className="bg-green-950 rounded-[20px] px-5 py-5 mb-4 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-green-400/[0.07] pointer-events-none"/>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/20 to-transparent"/>
              <div className="f-sans text-[10px] font-semibold tracking-[0.1em] uppercase text-green-400/55 mb-3">You receive</div>
              <div className="flex items-baseline gap-2.5">
                <span className="f-mono text-white font-semibold leading-none" style={{ fontSize:'clamp(32px,4vw,48px)', letterSpacing:'-0.04em' }}>
                  {pkrOut}
                </span>
                <span className="f-serif italic text-green-400 text-[22px] font-normal">PKR</span>
              </div>
              <div className="f-mono text-[11px] text-green-400/35 mt-2.5">via Raast · ~8s · zero fees</div>
            </div>

            {/* META */}
            <div className="flex flex-col gap-2 bg-green-50/60 rounded-[18px] px-4 py-4 mb-4 border border-green-100/60">
              {[['Rate',`1 ${token} = ${pkrRate}`],['Network','zkSync Sepolia'],['Est. time','< 10 seconds'],['Fee','~$0.001']].map(([k,v]) => (
                <div key={k} className="flex justify-between items-center">
                  <span className="f-sans text-[12px] text-green-700/45">{k}</span>
                  <span className="f-mono text-[12px] font-medium text-green-900/75">{v}</span>
                </div>
              ))}
            </div>

            <Link to={"/launch"} className="f-serif italic w-full py-[15px] rounded-[16px] bg-green-950 hover:bg-green-800 text-white font-semibold text-[16px] flex items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-950/30">
              Bridge Now <ArrowRight size={15}/>
            </Link>
            
          </div>
        </Reveal>
      </section>

      {/* 
          MARQUEE
     */}
      <div className="relative z-10 overflow-hidden border-y border-green-100/80 bg-white/60 backdrop-blur-sm py-3.5">
        <div className="mq-run inline-flex whitespace-nowrap">
          {[...marquee,...marquee,...marquee].map((t,i) => (
            <span key={i} className="f-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-green-600/45 px-8">
              {t}<span className="opacity-20 ml-8">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* 
          STATS
  */}
      <section className="relative z-10 max-w-[1300px] mx-auto px-5 sm:px-8 lg:px-[72px] py-20 sm:py-28">
        <Reveal y={50}>
          <div className="inline-flex items-center gap-2 f-sans text-[11px] font-semibold tracking-[0.12em] uppercase text-green-600 px-3 py-1.5 rounded-full border border-green-200/70 bg-white/60 mb-5">
            By the numbers
          </div>
          <h2 className="f-serif font-bold text-green-950 leading-[0.93] tracking-[-0.04em] mb-1" style={{ fontSize:'clamp(36px,5vw,62px)' }}>
            Trusted by<br/><span className="italic font-light text-green-800/35">thousands.</span>
          </h2>
          <div className="shimmer-line mt-5 mb-12"/>
        </Reveal>

        <StaggerReveal baseDelay={0.05} stagger={0.12} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { v:'$2.5M', s:'+', l:'Total Volume Bridged' },
            { v:'5,000', s:'+', l:'Successful Transactions' },
            { v:'< 10s', s:'',  l:'Average Settlement' },
          ].map((s,i) => (
            <div key={i} className="glass lift border-green-100/80 rounded-[24px] p-8 shadow-md shadow-green-100/50 hover:shadow-xl hover:shadow-green-200/40">
              <div className="f-mono font-semibold text-green-950 leading-none mb-3" style={{ fontSize:'clamp(42px,5vw,58px)', letterSpacing:'-0.045em' }}>
                {s.v}<span className="text-green-500">{s.s}</span>
              </div>
              <div className="f-sans text-[13px] font-medium text-green-700/50 mt-1">{s.l}</div>
            </div>
          ))}
        </StaggerReveal>
      </section>

      <div className="relative z-10 mx-5 sm:mx-8 lg:mx-[72px] h-px bg-gradient-to-r from-transparent via-green-200 to-transparent"/>

      {/*
          FEATURES
*/}
      <section className="relative z-10 max-w-[1300px] mx-auto px-5 sm:px-8 lg:px-[72px] py-20 sm:py-28">
        <Reveal y={50}>
          <div className="inline-flex items-center gap-2 f-sans text-[11px] font-semibold tracking-[0.12em] uppercase text-green-600 px-3 py-1.5 rounded-full border border-green-200/70 bg-white/60 mb-5">
            Why Rupia
          </div>
          <h2 className="f-serif font-bold text-green-950 leading-[0.93] tracking-[-0.04em]" style={{ fontSize:'clamp(36px,5vw,62px)' }}>
            Built for<br/><span className="italic font-light text-green-800/35">professionals.</span>
          </h2>
          <div className="shimmer-line mt-5 mb-12"/>
        </Reveal>

        <StaggerReveal baseDelay={0.05} stagger={0.13} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map((f,i) => (
            <div key={i} className={`feat-card rounded-[26px] p-8 border ${
              i===1
                ? 'feat-card-dark bg-green-950 border-green-900'
                : 'feat-card-light glass border-green-100/80 shadow-md shadow-green-100/40'
            }`}>
              <div className={`w-11 h-11 rounded-[13px] flex items-center justify-center mb-5 border ${
                i===1 ? 'bg-green-400/10 border-green-400/20 text-green-400' : 'bg-green-50 border-green-100 text-green-800'
              }`}>{f.icon}</div>
              <div className={`f-sans text-[10px] font-semibold tracking-[0.12em] uppercase mb-2 ${i===1?'text-green-400/55':'text-green-600/55'}`}>{f.tag}</div>
              <h3 className={`f-serif font-semibold text-[19px] leading-[1.2] tracking-tight mb-3 ${i===1?'text-white':'text-green-950'}`}>{f.title}</h3>
              <p className={`f-sans text-[14px] leading-[1.78] ${i===1?'text-green-200/35':'text-green-800/50'}`}>{f.body}</p>
            </div>
          ))}
        </StaggerReveal>
      </section>

      <div className="relative z-10 mx-5 sm:mx-8 lg:mx-[72px] h-px bg-gradient-to-r from-transparent via-green-200 to-transparent"/>

      {/* 
          HOW IT WORKS
    */}
      <section className="relative z-10 max-w-[1300px] mx-auto px-5 sm:px-8 lg:px-[72px] py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-start">

          <Reveal y={50}>
            <div className="lg:sticky lg:top-24">
              <div className="inline-flex items-center gap-2 f-sans text-[11px] font-semibold tracking-[0.12em] uppercase text-green-600 px-3 py-1.5 rounded-full border border-green-200/70 bg-white/60 mb-5">
                Process
              </div>
              <h2 className="f-serif font-bold text-green-950 leading-[0.93] tracking-[-0.04em]" style={{ fontSize:'clamp(36px,5vw,62px)' }}>
                Three steps.<br/><span className="italic font-light text-green-800/35">Ten seconds.</span>
              </h2>
              <div className="shimmer-line mt-5 mb-6"/>
              <p className="f-sans text-[15px] text-green-800/50 leading-[1.8] max-w-[300px]">
                No paperwork, no approvals. Connect your wallet and your PKR is on its way before you blink.
              </p>
              <div className="bg-green-950 rounded-[22px] px-6 py-6 mt-8 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-green-400/[0.07]"/>
                <div className="f-sans text-[10px] font-semibold tracking-[0.1em] uppercase text-green-400/55 mb-2">Current Rate</div>
                <div className="f-mono font-semibold text-white tick-blink" style={{ fontSize:22, letterSpacing:'-0.03em' }}>
                  1 {token} = {pkrRate} PKR
                </div>
                <div className="f-sans text-[11px] text-green-400/30 mt-2">Live · Updates every 2 seconds</div>
              </div>
            </div>
          </Reveal>

          <div>
            {steps.map((s,i) => (
              <Reveal key={i} delay={i*0.14} y={40}>
                <div className="step-row flex gap-5 px-4 py-6 border-b border-green-100/70 last:border-0">
                  <span className="f-serif italic text-[12px] text-green-200 min-w-[26px] pt-1.5">{s.n}</span>
                  <div>
                    <div className="f-serif font-semibold text-[20px] text-green-950 tracking-tight mb-2">{s.t}</div>
                    <div className="f-sans text-[14px] text-green-800/50 leading-[1.72]">{s.d}</div>
                  </div>
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.45} y={30}>
              <div className="px-4 pt-8">
                <Link to={"/launch"} className="f-serif italic w-full py-4 rounded-[16px] bg-green-950 hover:bg-green-800 text-white font-semibold text-[16px] flex items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-950/25">
                  Start Your First Bridge <ArrowRight size={15}/>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 
          CTA
    */}
      <section className="relative z-10 max-w-[1300px] mx-auto px-5 sm:px-8 lg:px-[72px] pb-24 sm:pb-32">
        <Reveal y={60}>
          <div className="cta-block glass border border-green-200/60 rounded-[32px] px-8 sm:px-16 py-14 sm:py-20 overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 items-center shadow-xl shadow-green-200/30">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 f-sans text-[11px] font-semibold tracking-[0.12em] uppercase text-green-600 px-3 py-1.5 rounded-full border border-green-300/70 bg-white/60 mb-5">
                Get started today
              </div>
              <h2 className="f-serif font-bold text-green-950 leading-[0.93] tracking-[-0.04em] mb-4" style={{ fontSize:'clamp(28px,4.5vw,56px)' }}>
                Ready to bridge<br/><span className="italic font-normal text-green-700/70">your first crypto?</span>
              </h2>
              <p className="f-sans text-[15px] text-green-800/50">No account needed. Just connect and bridge.</p>
            </div>
            <div className="flex flex-col gap-3 min-w-[178px] relative z-10">
              <Link to={"/launch"} className="f-sans inline-flex items-center justify-center gap-2 bg-green-950 hover:bg-green-800 text-white font-semibold text-[14px] py-4 px-7 rounded-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-950/30">
                Launch App <ArrowUpRight size={14}/>
              </Link>
              <button className="f-sans inline-flex items-center justify-center gap-2 border border-green-200 hover:border-green-500 text-green-800 hover:text-green-950 font-medium text-[14px] py-4 px-7 rounded-full transition-all duration-250 bg-white/70">
                Read Docs
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 
          FOOTER
       */}
      <footer className="relative z-10 bg-white/70 backdrop-blur-sm border-t border-green-100/80 px-5 sm:px-8 lg:px-[72px] py-10">
        <div className="max-w-[1300px] mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="f-serif italic font-semibold text-[19px] text-green-950 tracking-tight">
            <img className='w-20' src="l2.png" alt="" />
          </div>
          <span className="f-sans text-[12px] text-green-700/30">Powered by zkSync · Secure · Fast · Reliable</span>
          <div className="flex gap-4">
            {[Github, Twitter].map((Icon,i) => (
              <a key={i} className="text-green-700/25 hover:text-green-600 transition-colors duration-200 cursor-pointer">
                <Icon size={17}/>
              </a>
            ))}
          </div>
        </div>
        <div className="max-w-[1300px] mx-auto mt-6 pt-5 border-t border-green-50 text-center">
          <span className="f-sans text-[11px] text-green-700/25">© 2025 PKR Bridge. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}