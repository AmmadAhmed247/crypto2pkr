import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, Zap, Clock, CheckCircle, Github, Twitter } from 'lucide-react';

export default function CryptoBridgeLanding() {
  const [isVisible, setIsVisible] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Conversion",
      description: "Convert your crypto to PKR in seconds with our optimized zkSync smart contracts"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Trustless",
      description: "Built on zkSync for maximum security with zero-knowledge proofs"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "24/7 Availability",
      description: "Bridge your assets anytime, anywhere with automated processing"
    }
  ];

  const steps = [
    { num: "01", text: "Connect your wallet" },
    { num: "02", text: "Select crypto amount" },
    { num: "03", text: "Receive PKR instantly" }
  ];

  return (
    <div className="min-h-screen bg-green-50 text-black">
      <div className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <h1 className="text-7xl font-bold mb-6 leading-tight tracking-tight">
              Bridge Crypto to PKR Instantly
            </h1>
            <p className="text-xl text-green-900 mb-8 leading-relaxed">
              The fastest and most secure way to convert your cryptocurrency to Pakistani Rupees. 
              Powered by zkSync for ultra-low fees and lightning-fast transactions.
            </p>
            <div className="flex gap-4">
              <button className="bg-green-900 hover:bg-green-800 text-white px-8 py-4 rounded-md font-medium flex items-center gap-2 transition-all">
                Start Bridging
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border border-zinc-300 hover:border-zinc-900 hover:bg-zinc-50 px-8 py-4 rounded-md font-medium transition-all">
                Learn More
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-zinc-200">
              <div>
                <div className="text-4xl font-bold text-zinc-900">$2.5M+</div>
                <div className="text-zinc-500 text-sm mt-1">Total Volume</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-zinc-900">5,000+</div>
                <div className="text-zinc-500 text-sm mt-1">Transactions</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-zinc-900">0.1%</div>
                <div className="text-zinc-500 text-sm mt-1">Fee</div>
              </div>
            </div>
          </div>

          {/* Animated Ethereum Coin */}
          <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="relative w-full h-96 flex items-center justify-center">
              {/* Glow effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-80 bg-green-100 rounded-full blur-3xl"></div>
              </div>
              
              {/* Orbiting rings */}
              <div 
                className="absolute w-96 h-96 border border-zinc-200 rounded-full"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <div className="absolute top-0 left-1/2 w-3 h-3 bg-green-900 rounded-full -ml-1.5 -mt-1.5"></div>
              </div>
              <div 
                className="absolute w-80 h-80 border border-green-100 rounded-full"
                style={{ transform: `rotate(${-rotation * 0.7}deg)` }}
              >
                <div className="absolute bottom-0 right-1/2 w-2 h-2 bg-green-600 rounded-full -mr-1 -mb-1"></div>
              </div>
              
              {/* Ethereum Logo */}
              <div 
                className="relative z-10 transition-transform duration-300 hover:scale-110"
                style={{ transform: `rotateY(${rotation * 2}deg)` }}
              >
                <svg className="w-64 h-64" viewBox="0 0 256 417" xmlns="http://www.w3.org/2000/svg">
                  <polygon fill="#18181B" points="127.9611,0 125.1661,9.5 125.1661,285.168 127.9611,287.958 255.9231,212.32" />
                  <polygon fill="#3F3F46" points="127.962,0 0,212.32 127.962,287.959 127.962,154.158" />
                  <polygon fill="#27272A" points="127.9611,312.1866 126.3861,314.1066 126.3861,412.3056 127.9611,416.9066 255.9991,236.5866" />
                  <polygon fill="#52525B" points="127.962,416.9052 127.962,312.1852 0,236.5852" />
                  <polygon fill="#3F3F46" points="127.9611,287.9577 255.9211,212.3207 127.9611,154.1587" />
                  <polygon fill="#71717A" points="0.0009,212.3208 127.9609,287.9578 127.9609,154.1588" />
                </svg>
              </div>
              
              {/* Floating particles */}
              <div className="absolute top-10 left-10 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              <div className="absolute bottom-20 right-10 w-2 h-2 bg-green-300 rounded-full animate-ping delay-75"></div>
              <div className="absolute top-1/2 right-5 w-1.5 h-1.5 bg-green-900 rounded-full animate-ping delay-150"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-6 py-24 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-5xl text-zinc-900 font-bold mb-4">Why Choose PKR Bridge?</h2>
          <p className="text-zinc-800 text-lg">Built for speed, security, and simplicity</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="bg-white border border-zinc-200 rounded-lg p-8 hover:border-green-800 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-green-900 rounded-lg flex items-center justify-center mb-4 text-white">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-zinc-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="how" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-zinc-600 text-lg">Three simple steps to bridge your crypto</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-8 mb-6 items-start">
              <div className="text-7xl font-bold text-green-900">{step.num}</div>
              <div className="flex-1 bg-white border border-zinc-200 rounded-lg p-8 flex items-center justify-between hover:border-zinc-900 hover:shadow-md transition-all">
                <span className="text-xl text-green-800 font-medium">{step.text}</span>
                <CheckCircle className="w-6 h-6 text-green-900" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-24">
        <div className="bg-green-900 rounded-xl p-16 text-center">
          <h2 className="text-5xl font-bold mb-4 text-white">Ready to Bridge?</h2>
          <p className="text-xl mb-8 text-white">Start converting your crypto to PKR today</p>
          <button className="bg-white text-zinc-900 hover:bg-zinc-100 px-10 py-4 rounded-md font-semibold transition-all">
            Launch Application
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between  items-center gap-6">
            <div className="flex w-full items-center justify-center gap-6">
              <a href="#" className="text-zinc-600 flex hover:text-zinc-900 transition-colors">
                <Github className="w-6 h-6" />
              </a>
              <a href="#" className="text-zinc-600 flex hover:text-zinc-900 transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>
          <div className="text-center mt-8 text-zinc-500 text-sm">
            <p>Powered by zkSync • Secure • Fast • Reliable</p>
            <p className="mt-2">© 2025 PKR Bridge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}