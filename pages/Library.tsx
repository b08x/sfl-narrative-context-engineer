import React from 'react';
import { useStore } from '../store';
import { PromptSFL } from '../types';
import { Plus, BookOpen, Clock, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

interface LibraryProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export const Library: React.FC<LibraryProps> = ({ onEdit, onCreate }) => {
  const { prompts, deletePrompt } = useStore();

  return (
    <div className="p-12 max-w-7xl mx-auto">
      <header className="mb-16 flex justify-between items-end">
        <div>
          <h2 className="text-stone-500 text-sm uppercase tracking-widest mb-2 font-medium">Your Collection</h2>
          <h1 className="text-5xl font-serif text-stone-900">The Library</h1>
        </div>
        <button 
          onClick={onCreate}
          className="flex items-center gap-2 bg-stone-900 text-stone-50 px-6 py-3 rounded-full hover:bg-stone-800 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-300"
        >
          <Plus size={18} />
          <span className="font-medium">New Narrative</span>
        </button>
      </header>

      {prompts.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-stone-100 shadow-sm">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-400">
            <BookOpen size={24} />
          </div>
          <h3 className="text-xl font-serif mb-2 text-stone-800">The pages are empty</h3>
          <p className="text-stone-500 mb-8 max-w-md mx-auto">Begin your journey by creating a new prompt structure using the SFL framework.</p>
          <button onClick={onCreate} className="text-amber-600 hover:text-amber-700 font-medium hover:underline">Start writing &rarr;</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {prompts.map((prompt, idx) => (
            <PromptCard 
              key={prompt.id} 
              prompt={prompt} 
              onClick={() => onEdit(prompt.id)} 
              onDelete={(e) => { e.stopPropagation(); deletePrompt(prompt.id); }}
              index={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PromptCard: React.FC<{ prompt: PromptSFL; onClick: () => void; onDelete: (e: React.MouseEvent) => void; index: number }> = ({ prompt, onClick, onDelete, index }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="group bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-violet-200 to-rose-200 opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between items-start mb-6">
        <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-stone-50 transition-colors">
          <BookOpen size={16} />
        </div>
        <div className="flex gap-2">
            <span className="text-xs font-medium px-2 py-1 bg-stone-50 rounded-full text-stone-500 uppercase tracking-wide">
                {prompt.sflMode.outputFormat}
            </span>
        </div>
      </div>

      <h3 className="text-2xl font-serif text-stone-800 mb-3 group-hover:text-stone-600 transition-colors line-clamp-1">
        {prompt.title}
      </h3>
      <p className="text-stone-500 text-sm line-clamp-2 mb-6 h-10">
        {prompt.description || `A ${prompt.sflField.taskType} about ${prompt.sflField.topic}...`}
      </p>

      <div className="flex items-center justify-between pt-6 border-t border-stone-50 text-xs text-stone-400">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{new Date(prompt.updatedAt).toLocaleDateString()}</span>
        </div>
        
        <button 
          onClick={onDelete}
          className="hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
        >
          Delete
        </button>
      </div>
    </motion.div>
  );
};
