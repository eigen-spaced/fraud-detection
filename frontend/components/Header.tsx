'use client';

export default function Header() {
  
  return (
    <header className="bg-white backdrop-blur-sm border-b border-navy-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-700">
              🔒 Fraud Detection
            </h1>
            <p className="text-sm text-navy-500 mt-0.5">AI-Powered Transaction Analysis</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-navy-600 text-sm">
                <span className="text-emerald-600 font-semibold">●</span> API Connected
              </div>
              <div className="text-navy-600 text-sm">
                <span className="text-ocean-600 font-semibold">🧠</span> LLM Ready
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
