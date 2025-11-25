import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Library } from './pages/Library';
import { Architect } from './pages/Architect';
import { Lab } from './pages/Lab';
import { useStore } from './store';
import { X, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeView, setActiveView] = useState<'library' | 'architect' | 'lab'>('library');
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

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
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-800 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 mb-6 text-stone-800">
                <div className="p-2 bg-stone-100 rounded-lg"><Key size={20}/></div>
                <h2 className="text-2xl font-serif">API Configuration</h2>
              </div>

              <div className="space-y-6">
                <div>
                  {/* Google API Key input removed in compliance with guidelines */}
                  <div className="text-sm text-stone-500">
                    Google API Key is configured via environment variables.
                  </div>
                </div>
                 <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Mistral / Ollama</label>
                  <div className="p-4 bg-stone-50 rounded-lg text-sm text-stone-400 italic">
                    Support coming soon in version 1.1
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-stone-100 flex justify-end">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="bg-stone-900 text-stone-50 px-6 py-2 rounded-full font-medium hover:bg-stone-800 transition-colors"
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