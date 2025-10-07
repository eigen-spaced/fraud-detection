'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  return (
    <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">🛡️</span>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Fraud Detection
              </span>
            </h1>
            <p className="text-slate-300 mt-1 ml-14">
              AI-Powered Credit Card Transaction Analysis
            </p>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-4">
              <Link 
                href="/" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/' 
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-600/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                📝 JSON View
              </Link>
              <Link 
                href="/cards" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  pathname === '/cards' 
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-600/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                💳 Card View
                <span className="text-xs bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded">NEW</span>
              </Link>
            </nav>
            <div className="text-slate-400 text-sm">
              <span className="text-green-400 font-semibold">●</span> API Connected
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
