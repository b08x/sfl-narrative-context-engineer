import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Library } from './pages/Library';
import { Architect } from './pages/Architect';
import { Lab } from './pages/Lab';
import { useStore } from './store';
import { X, Key, Moon, Sun, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const { theme, setTheme } = useStore();
  const [activeView, setActiveView] = useState<'library' | 'architect' | 'lab'>('library');
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Apply theme class to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleEdit = (id: string) => {
    setEditingPromptId(id);
    setActiveView('architect');
  };

  const handleCreate = () => {
    setEditingPromptId(null);
    setActiveView('architect');
  };

  const handleCloseArchitect = () => {
    setActiveView('library');
    setEditingPromptId(null);
  };

  return (
    <>
      <Layout 
        activeView={activeView === 'architect' ? 'library' : activeView} 
        setActiveView={(view) => {
            if(view === 'architect') handleCreate();
            else setActiveView(view);
        }}
        toggleSettings={() => setShowSettings(true)}
      >
        <AnimatePresence mode="wait">
          {activeView === 'library' && (
            <motion.div 
              key="library"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full"
            >
              <Library onEdit={handleEdit} onCreate={handleCreate} />
            </motion.div>
          )}
          {activeView === 'lab' && (
             <motion.div 
             key="lab"
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="h-full"
           >
             <Lab />
           </motion.div>
          )}
        </AnimatePresence>
        
        {/* Architect Overlay */}
        <AnimatePresence>
          {activeView === 'architect' && (
            <motion.div 
              key="architect"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-40"
            >
              <Architect promptId={editingPromptId} onClose={handleCloseArchitect} />
            </motion.div>
          )}
        </AnimatePresence>
      </Layout>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-stone-900 dark:text-stone-100 rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-stone-100 dark:border-stone-800"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 mb-6 text-stone-800 dark:text-stone-100">
                <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg"><Monitor size={20}/></div>
                <h2 className="text-2xl font-serif">Preferences</h2>
              </div>

              <div className="space-y-8">
                {/* Theme Switcher */}
                <div>
                   <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-3">Appearance</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setTheme('light')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${theme === 'light' ? 'bg-stone-100 border-stone-300 text-stone-900' : 'border-stone-200 dark:border-stone-700 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                      >
                        <Sun size={18} />
                        <span>Light</span>
                      </button>
                      <button 
                        onClick={() => setTheme('dark')}
                         className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${theme === 'dark' ? 'bg-stone-800 border-stone-600 text-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                      >
                        <Moon size={18} />
                        <span>Dark</span>
                      </button>
                   </div>
                </div>

                {/* API Config */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                     <Key size={16} className="text-stone-400"/>
                     <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase">API Configuration</label>
                  </div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">
                    Google API Key is configured via environment variables.
                  </div>
                </div>
                 
                 <div>
                  <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-2">Mistral / Ollama</label>
                  <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-lg text-sm text-stone-400 italic">
                    Support coming soon in version 1.1
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 px-6 py-2 rounded-full font-medium hover:bg-stone-800 dark:hover:bg-white transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;