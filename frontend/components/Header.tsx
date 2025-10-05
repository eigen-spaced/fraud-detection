export default function Header() {
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
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="text-slate-400">
              <span className="text-green-400 font-semibold">●</span> API Connected
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}