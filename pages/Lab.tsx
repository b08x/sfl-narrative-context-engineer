import React from 'react';
import { Boxes } from 'lucide-react';

export const Lab: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
      <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-8 text-stone-300">
        <Boxes size={40} />
      </div>
      <h2 className="text-4xl font-serif text-stone-800 mb-4">The Laboratory</h2>
      <p className="text-stone-500 max-w-lg mx-auto leading-relaxed">
        The Constellation (Node Workflow) feature is currently under construction. 
        This space will allow you to chain narratives together in an organic, non-linear fashion.
      </p>
    </div>
  );
};
