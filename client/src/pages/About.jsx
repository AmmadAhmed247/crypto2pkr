import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Database, Zap, Wallet, CheckCircle , Currency } from 'lucide-react';

const About = () => {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => (s >= 4 ? 1 : s + 1));
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const flow = [
    {
      id: 1,
      title: "Payment Locked",
      desc: "User locks crypto into smart contract",
      icon: <Lock className="w-5 h-5" />,
      detail: "Funds are securely locked on zkSync smart contract"
    },
    {
      id: 2,
      title: "Backend Detection",
      desc: "Relayer detects blockchain event",
      icon: <Database className="w-5 h-5" />,
      detail: "Watcher service confirms transaction finality"
    },
    {
      id: 3,
      title: "PKR Issued",
      desc: "System calculates and issues PKR",
      icon: <Zap className="w-5 h-5" />,
      detail: "Equivalent PKR is generated via Raast API"
    },
    {
      id: 4,
      title: "Treasury Settlement",
      desc: "Funds moved to treasury wallet",
      icon: <Wallet className="w-5 h-5" />,
      detail: "Final settlement recorded in treasury account"
    }
  ];

  return (
    <div className="min-h-screen bg-green-50 text-zinc-900">

      {/* HERO */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl font-mono tracking-tight">
            How Money Flows
          </h1>
         
        </div>
      </div>

      {/* FLOW */}
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="relative border-l-2 border-green-200 pl-6 space-y-10">

          {flow.map((f, i) => (
            <motion.div
              key={f.id}
              animate={{ opacity: step >= f.id ? 1 : 0.3, x: step === f.id ? 6 : 0 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >

              {/* dot */}
              <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${step >= f.id ? 'bg-green-600 border-green-600' : 'bg-white border-zinc-300'}`} />

              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="text-green-700">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                </div>

                <p className="text-sm text-zinc-500 mt-1">{f.desc}</p>

                <AnimatePresence>
                  {step === f.id && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-zinc-400 mt-3"
                    >
                      {f.detail}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          ))}

        </div>

        {/* LIVE STATUS */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-green-700 bg-green-100 px-4 py-2 rounded-full border border-green-200">
            <CheckCircle className="w-4 h-4" />
            Live Simulation Running
          </div>
        </div>

      </div>

    </div>
  );
};

export default About;
