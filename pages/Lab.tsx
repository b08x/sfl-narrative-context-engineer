import React from 'react';
import { Boxes } from 'lucide-react';

export const Lab: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
      <div className="w-24 h-24 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-8 text-stone-300 dark:text-stone-600 transition-colors">
        <Boxes size={40} />
      </div>
      <h2 className="text-4xl font-serif text-stone-800 dark:text-stone-100 mb-4 transition-colors">The Laboratory</h2>
      <p className="text-stone-500 dark:text-stone-400 max-w-lg mx-auto leading-relaxed transition-colors">
        The Constellation (Node Workflow) feature is currently under construction. 
        This space will allow you to chain narratives together in an organic, non-linear fashion.
      </p>
    </div>
  );
};