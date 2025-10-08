'use client';

export default function Header() {
  
  return (
    <header className="bg-white backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Fraud Detection
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-gray-600 text-sm">
              <span className="text-green-600 font-semibold">●</span> API Connected
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
