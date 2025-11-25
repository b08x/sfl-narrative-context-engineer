import React from 'react';
import { Home, Feather, Settings, Boxes, Cpu } from 'lucide-react';
import { useStore } from '../store';

interface LayoutProps {
  children: React.ReactNode;
  activeView: 'library' | 'architect' | 'lab';
  setActiveView: (view: 'library' | 'architect' | 'lab') => void;
  toggleSettings: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, toggleSettings }) => {
  return (
    <div className="min-h-screen flex bg-stone-50 text-stone-800 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Dock / Navigation */}
      <nav className="fixed left-0 top-0 bottom-0 w-20 flex flex-col items-center py-8 bg-white/50 backdrop-blur-md border-r border-stone-200 z-50">
        <div className="mb-12">
          <div className="w-10 h-10 bg-stone-900 text-stone-50 rounded-full flex items-center justify-center font-serif text-xl font-bold">
            S
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-8 w-full items-center">
          <NavButton 
            active={activeView === 'library'} 
            onClick={() => setActiveView('library')}
            icon={<Home size={22} />}
            label="Library"
          />
          <NavButton 
            active={activeView === 'architect'} 
            onClick={() => setActiveView('architect')}
            icon={<Feather size={22} />}
            label="Architect"
          />
           <NavButton 
            active={activeView === 'lab'} 
            onClick={() => setActiveView('lab')}
            icon={<Boxes size={22} />}
            label="Lab"
          />
        </div>

        <div className="mt-auto">
          <button 
            onClick={toggleSettings}
            className="p-3 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-all duration-300"
          >
            <Settings size={22} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 ml-20 relative">
        {children}
      </main>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`group relative p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
  >
    {icon}
    <span className="absolute left-14 bg-stone-800 text-stone-50 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
      {label}
    </span>
    {active && (
      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-stone-800 rounded-l-full" />
    )}
  </button>
);
