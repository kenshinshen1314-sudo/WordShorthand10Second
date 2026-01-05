
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-800">Flash<span className="text-indigo-600">10</span></h1>
      </div>
      <div className="hidden sm:block text-sm font-medium text-gray-500">
        High-Speed Memorization
      </div>
    </header>
  );
};

export default Header;
