import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowUpRight, Shield, Zap, Clock, CheckCircle, Github, Twitter, ChevronRight } from 'lucide-react';

/* ── Scroll-triggered slide-in ── */
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

const SlideIn = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const [ref, inView] = useInView();
  const hidden = { up: 'translateY(56px)', left: 'translateX(-56px)', right: 'translateX(56px)' }[direction];
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translate(0,0)' : hidden,
        transition: `opacity 0.75s ease ${delay}s, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

export default function CryptoBridgeLanding() {
  const [activeStep, setActiveStep] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    const iv = setInterval(() => setRotation(p => (p + 0.5) % 360), 30);
    return () => { window.removeEventListener('scroll', onScroll); clearInterval(iv); };
  }, []);

  const features = [
    { icon: <Zap className="w-5 h-5" />, tag: 'Speed',    title: 'Instant Conversion', desc: 'Convert crypto to PKR in seconds via zkSync smart contracts.' },
    { icon: <Shield className="w-5 h-5" />, tag: 'Security', title: 'Trustless & Secure',  desc: 'Zero-knowledge proofs ensure your assets stay protected.' },
    { icon: <Clock className="w-5 h-5" />, tag: 'Uptime',   title: 'Always On',            desc: 'Automated processing runs 24/7 with 99.9% uptime.' },
  ];

  const steps = [
    { num: '01', title: 'Connect Wallet', desc: 'Link MetaMask, WalletConnect, or any Web3 wallet instantly.' },
    { num: '02', title: 'Select Amount',  desc: 'Choose your crypto and the PKR amount you want to receive.' },
    { num: '03', title: 'Receive PKR',    desc: 'Funds arrive in your account within seconds, not days.' },
  ];

  const stats = [
    { value: '$2.5M+', label: 'Total Volume Bridged',  sub: 'Across all transactions' },
    { value: '5,000+', label: 'Successful Bridges',    sub: '0 failed transactions'   },
    { value: '< 3s',   label: 'Average Settlement',    sub: 'Fastest in the market'   },
  ];

  const marqueeItems = ['zkSync Powered','Instant Settlement','PKR Ready','Zero Trust','On-Chain Verified','Ultra Low Fees'];

  return (
    <div className="min-h-screen overflow-x-hidden bg-green-50" style={{ fontFamily: "'Syne', sans-serif" }}>

      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 22s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        @keyframes ping-slow { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
        .ping-slow { animation: ping-slow 2s ease-in-out infinite; }
        .ping-slow-2 { animation: ping-slow 2.4s ease-in-out infinite 0.3s; }
        .ping-slow-3 { animation: ping-slow 2s ease-in-out infinite 0.7s; }
        .hero-outline { -webkit-text-stroke: 2px #14532d; color: transparent; }
      `}</style>

     

      {/* ══ HERO ══ */}
      <section className="max-w-7xl mx-auto px-12 pt-36 pb-20 grid md:grid-cols-2 gap-16 items-center min-h-screen">

        {/* Left */}
        <div>
          <SlideIn delay={0}>
            <span className="inline-flex items-center gap-2 bg-green-100 text-green-900 text-[11px] font-dm font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Live on zkSync Mainnet
            </span>
          </SlideIn>

          <SlideIn delay={0.1}>
            <div className="mt-8 leading-none tracking-tighter">
              <div className="font-syne font-extrabold text-green-900" style={{ fontSize: 'clamp(68px, 11vw, 148px)', lineHeight: 0.9 }}>Bridge</div>
              <div className="font-syne font-extrabold hero-outline" style={{ fontSize: 'clamp(68px, 11vw, 148px)', lineHeight: 0.9 }}>Crypto</div>
              <div className="font-syne font-extrabold text-green-900" style={{ fontSize: 'clamp(68px, 11vw, 148px)', lineHeight: 0.9 }}>to PKR.</div>
            </div>
          </SlideIn>

          <SlideIn delay={0.22}>
            <p className="font-dm font-light text-green-800/80 text-lg leading-relaxed mt-8 max-w-md">
              The fastest and most secure way to convert cryptocurrency to Pakistani Rupees — powered by zkSync for ultra-low fees and lightning-fast transactions.
            </p>
          </SlideIn>

          <SlideIn delay={0.32}>
            <div className="flex flex-wrap gap-4 mt-10">
              <button className="inline-flex items-center gap-2 bg-green-900 hover:bg-green-800 text-white font-syne font-bold text-sm px-8 py-4 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-900/25">
                Start Bridging <ArrowRight className="w-4 h-4" />
              </button>
              <button className="inline-flex items-center gap-2 border border-green-200 hover:border-green-900 hover:bg-white text-green-900 font-syne font-bold text-sm px-7 py-4 rounded-full transition-all hover:-translate-y-0.5">
                View Docs <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </SlideIn>
        </div>

        {/* Right — animated coin */}
        <SlideIn delay={0.18} direction="right">
          <div className="relative h-[500px] flex items-center justify-center">
            {/* Glow */}
            <div className="absolute w-80 h-80 bg-green-200/60 rounded-full blur-3xl" />

            {/* Rings */}
            <div className="absolute w-96 h-96 border border-dashed border-green-200 rounded-full"
              style={{ transform: `rotate(${rotation}deg)` }}>
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-green-900 rounded-full" />
            </div>
            <div className="absolute w-72 h-72 border border-green-100 rounded-full"
              style={{ transform: `rotate(${-rotation * 0.6}deg)` }}>
              <div className="absolute -bottom-1 right-1/4 w-2.5 h-2.5 bg-green-500 rounded-full" />
            </div>

            {/* ETH */}
            <div className="relative z-10 drop-shadow-2xl">
              <svg width="150" height="150" viewBox="0 0 256 417" xmlns="http://www.w3.org/2000/svg">
                <polygon fill="#14532d" points="127.9611,0 125.1661,9.5 125.1661,285.168 127.9611,287.958 255.9231,212.32" />
                <polygon fill="#16a34a" points="127.962,0 0,212.32 127.962,287.959 127.962,154.158" />
                <polygon fill="#166534" points="127.9611,312.1866 126.3861,314.1066 126.3861,412.3056 127.9611,416.9066 255.9991,236.5866" />
                <polygon fill="#22c55e" points="127.962,416.9052 127.962,312.1852 0,236.5852" />
                <polygon fill="#15803d" points="127.9611,287.9577 255.9211,212.3207 127.9611,154.1587" />
                <polygon fill="#4ade80" points="0.0009,212.3208 127.9609,287.9578 127.9609,154.1588" />
              </svg>
            </div>

            {/* Floating cards */}
            <div className="absolute top-14 left-0 bg-white border border-green-100 rounded-2xl px-5 py-4 shadow-xl shadow-green-900/10 min-w-[130px]">
              <div className="font-dm text-[10px] font-semibold uppercase tracking-widest text-green-600 mb-1">Total Volume</div>
              <div className="font-syne font-extrabold text-xl text-green-900">$2.5M+</div>
            </div>
            <div className="absolute bottom-20 right-0 bg-white border border-green-100 rounded-2xl px-5 py-4 shadow-xl shadow-green-900/10 min-w-[120px]">
              <div className="font-dm text-[10px] font-semibold uppercase tracking-widest text-green-600 mb-1">Bridge Fee</div>
              <div className="font-syne font-extrabold text-xl text-green-900">0.1%</div>
            </div>
            <div className="absolute bottom-48 left-2 bg-green-900 rounded-2xl px-5 py-4 shadow-xl shadow-green-900/30 min-w-[120px]">
              <div className="font-dm text-[10px] font-semibold uppercase tracking-widest text-green-300 mb-1">Transactions</div>
              <div className="font-syne font-extrabold text-xl text-white">5,000+</div>
            </div>

            {/* Particles */}
            <div className="absolute top-10 left-10 w-2 h-2 bg-green-400 rounded-full ping-slow" />
            <div className="absolute bottom-16 right-10 w-2 h-2 bg-green-300 rounded-full ping-slow-2" />
            <div className="absolute top-1/2 right-6 w-1.5 h-1.5 bg-green-700 rounded-full ping-slow-3" />
          </div>
        </SlideIn>
      </section>

      {/* ══ MARQUEE ══ */}
      <div className="overflow-hidden whitespace-nowrap border-y border-green-100 bg-white py-4">
        <div className="inline-flex animate-marquee">
          {[...marqueeItems, ...marqueeItems].map((t, i) => (
            <span key={i} className="font-dm text-[12px] font-semibold uppercase tracking-widest text-green-700 px-8">
              {t} <span className="opacity-30 mx-2">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ STATS ══ */}
      <section className="max-w-7xl mx-auto px-12 py-20 grid md:grid-cols-3 gap-5">
        {stats.map((s, i) => (
          <SlideIn key={i} delay={i * 0.1}>
            <div className="bg-white border border-green-100 rounded-2xl p-8 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-900/8 transition-all duration-300">
              <div className="font-syne font-extrabold text-5xl text-green-900 tracking-tight leading-none">{s.value}</div>
              <div className="font-syne font-semibold text-base text-green-800 mt-4">{s.label}</div>
              <div className="font-dm text-sm text-green-600 mt-1 opacity-70">{s.sub}</div>
            </div>
          </SlideIn>
        ))}
      </section>

      {/* ══ FEATURES ══ */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-12">
          <SlideIn>
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-14">
              <div>
                <p className="font-dm text-[11px] font-semibold uppercase tracking-[0.12em] text-green-600">Why PKR Bridge</p>
                <div className="w-10 h-0.5 bg-green-500 my-4" />
                <h2 className="font-syne font-extrabold text-green-900 tracking-tight leading-[1.02] m-0" style={{ fontSize: 'clamp(32px,4.5vw,56px)' }}>
                  Built for<br />professionals.
                </h2>
              </div>
              <p className="font-dm font-light text-green-800/75 text-[15px] leading-relaxed max-w-xs md:text-right">
                Every feature designed to give you the fastest, most reliable crypto-to-PKR experience on the market.
              </p>
            </div>
          </SlideIn>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <SlideIn key={i} delay={i * 0.12}>
                <div className="border border-green-50 rounded-3xl p-9 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-green-900/10 hover:border-green-200 transition-all duration-400 cursor-default group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-11 h-11 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center text-green-900 group-hover:bg-green-900 group-hover:text-white transition-colors duration-300">
                      {f.icon}
                    </div>
                    <span className="font-dm text-[10px] font-semibold uppercase tracking-widest bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="font-syne font-bold text-[19px] text-green-900 tracking-tight mb-3">{f.title}</h3>
                  <p className="font-dm text-sm text-green-800/75 leading-relaxed">{f.desc}</p>
                  <div className="inline-flex items-center gap-1.5 text-green-600 font-syne font-semibold text-[13px] mt-6 group/link cursor-pointer">
                    Learn more <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                  </div>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="max-w-7xl mx-auto px-12 py-24">
        <div className="grid md:grid-cols-2 gap-24 items-start">

          {/* Sticky left */}
          <SlideIn direction="left">
            <div className="md:sticky md:top-28">
              <p className="font-dm text-[11px] font-semibold uppercase tracking-[0.12em] text-green-600">Process</p>
              <div className="w-10 h-0.5 bg-green-500 my-4" />
              <h2 className="font-syne font-extrabold text-green-900 tracking-tight leading-none m-0" style={{ fontSize: 'clamp(38px,5vw,60px)' }}>
                Three steps.<br />That's all.
              </h2>
              <p className="font-dm font-light text-green-800/75 text-[15px] leading-relaxed mt-5 max-w-xs">
                No KYC delays, no manual approvals — just instant crypto-to-PKR conversion.
              </p>

              {/* Rate card */}
              <div className="mt-12 bg-green-900 rounded-2xl p-7">
                <p className="font-dm text-[10px] font-semibold uppercase tracking-widest text-green-400 mb-2">Current Rate</p>
                <p className="font-syne font-extrabold text-white text-3xl tracking-tight">1 ETH = 863,420</p>
                <p className="font-dm text-xs text-green-400 mt-2">Updated 2 seconds ago • Live feed</p>
              </div>
            </div>
          </SlideIn>

          {/* Steps */}
          <div>
            {steps.map((step, i) => (
              <SlideIn key={i} delay={i * 0.14}>
                <div
                  className={`flex gap-6 py-7 border-b border-green-100 last:border-0 cursor-pointer group transition-all`}
                  onMouseEnter={() => setActiveStep(i)}
                >
                  <span className={`font-dm text-[13px] font-bold tracking-wide pt-1 min-w-[34px] transition-colors duration-300 ${activeStep === i ? 'text-green-900' : 'text-green-200'}`}>
                    {step.num}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2.5">
                      <h3 className={`font-syne font-bold text-[21px] tracking-tight m-0 transition-colors duration-300 ${activeStep === i ? 'text-green-900' : 'text-green-700'}`}>
                        {step.title}
                      </h3>
                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 ${activeStep === i ? 'bg-green-900 border-green-900' : 'bg-green-50 border-green-100'}`}>
                        <CheckCircle className={`w-4 h-4 ${activeStep === i ? 'text-white' : 'text-green-500'}`} />
                      </div>
                    </div>
                    <p className="font-dm text-sm text-green-800/70 leading-relaxed m-0">{step.desc}</p>
                  </div>
                </div>
              </SlideIn>
            ))}

            <SlideIn delay={0.45}>
              <button className="w-full mt-10 flex items-center justify-center gap-2 bg-green-900 hover:bg-green-800 text-white font-syne font-bold text-sm py-4 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-900/25">
                Start Your First Bridge <ArrowRight className="w-4 h-4" />
              </button>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="max-w-7xl mx-auto px-12 pb-24">
        <SlideIn>
          <div className="bg-green-900 rounded-[28px] px-16 py-20 relative overflow-hidden">
            {/* Decorative rings */}
            <div className="absolute -top-20 -right-20 w-72 h-72 border border-white/5 rounded-full pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-48 h-48 border border-white/8 rounded-full pointer-events-none" />
            <div className="absolute -bottom-16 left-1/3 w-48 h-48 bg-green-400/8 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid md:grid-cols-[1fr_auto] gap-12 items-center">
              <div>
                <p className="font-dm text-[11px] font-semibold uppercase tracking-[0.12em] text-green-400 mb-5">Get Started Today</p>
                <h2 className="font-syne font-extrabold text-white tracking-tight leading-[1.02] m-0" style={{ fontSize: 'clamp(32px,4vw,52px)' }}>
                  Ready to bridge<br />your first crypto?
                </h2>
                <p className="font-dm font-light text-green-300/80 text-base leading-relaxed mt-4">
                  No account needed. Just connect and bridge.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-w-[190px]">
                <button className="flex items-center justify-center gap-2 bg-white hover:bg-green-50 text-green-900 font-syne font-bold text-sm py-4 px-8 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-xl">
                  Launch App <ArrowUpRight className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-center gap-2 border border-white/15 hover:border-white/30 text-green-300 font-syne font-semibold text-sm py-4 px-8 rounded-full transition-all">
                  Read Docs
                </button>
              </div>
            </div>
          </div>
        </SlideIn>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-white border-t border-green-100 py-12 px-12">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-900 rounded-lg flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 0L14 8L8 16L2 8Z" fill="white"/></svg>
            </div>
            <span className="font-syne font-extrabold text-[15px] text-green-900 tracking-tight">PKR Bridge</span>
          </div>
          <p className="font-dm text-sm text-green-700 opacity-50">Powered by zkSync • Secure • Fast • Reliable</p>
          <div className="flex gap-5">
            <a href="#" className="text-green-700 opacity-40 hover:opacity-80 transition-opacity"><Github className="w-5 h-5" /></a>
            <a href="#" className="text-green-700 opacity-40 hover:opacity-80 transition-opacity"><Twitter className="w-5 h-5" /></a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-green-50 text-center">
          <p className="font-dm text-xs text-green-700 opacity-40">© 2025 PKR Bridge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}