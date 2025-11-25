import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Play, Save, ChevronLeft, Mic, RefreshCw, Paperclip, FileText, Image as ImageIcon, Video, Music, X, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { GeminiService, compileSFLPrompt } from '../services/geminiService';
import { PromptSFL, SFLField, SFLTenor, SFLMode, Attachment, DEFAULT_FIELD, DEFAULT_TENOR, DEFAULT_MODE } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ArchitectProps {
  promptId: string | null;
  onClose: () => void;
}

type Phase = 'intent' | 'context' | 'persona' | 'structure';

export const Architect: React.FC<ArchitectProps> = ({ promptId, onClose }) => {
  const { prompts, addPrompt, updatePrompt } = useStore();
  
  // State
  const [activePhase, setActivePhase] = useState<Phase>(promptId ? 'context' : 'intent');
  const [goal, setGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // SFL State
  const [title, setTitle] = useState('Untitled Narrative');
  const [field, setField] = useState<SFLField>(DEFAULT_FIELD);
  const [tenor, setTenor] = useState<SFLTenor>(DEFAULT_TENOR);
  const [mode, setMode] = useState<SFLMode>(DEFAULT_MODE);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const [testResponse, setTestResponse] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing prompt if editing
  useEffect(() => {
    if (promptId) {
      const existing = prompts.find(p => p.id === promptId);
      if (existing) {
        setTitle(existing.title);
        setField(existing.sflField);
        setTenor(existing.sflTenor);
        setMode(existing.sflMode);
        setAttachments(existing.attachments || []);
        setActivePhase('context');
      }
    }
  }, [promptId, prompts]);

  // AI Service
  const gemini = new GeminiService();

  // Handlers
  const handleAutoGenerate = async () => {
    if (!goal.trim()) return;
    setIsGenerating(true);
    try {
      const result = await gemini.generateSFLFromGoal(goal);
      if (result) {
        setTitle(result.title);
        setField(result.field);
        setTenor(result.tenor);
        setMode(result.mode);
        setActivePhase('context');
      }
    } catch (e) {
      alert("Failed to generate structure. Check your API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const promptData: PromptSFL = {
      id: promptId || uuidv4(),
      title,
      description: goal || field.topic,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sflField: field,
      sflTenor: tenor,
      sflMode: mode,
      attachments,
      compiledPrompt: compileSFLPrompt(field, tenor, mode, attachments)
    };

    if (promptId) {
      updatePrompt(promptId, promptData);
    } else {
      addPrompt(promptData);
    }
    onClose();
  };

  const handleTest = async () => {
    setIsTesting(true);
    const compiled = compileSFLPrompt(field, tenor, mode, attachments);
    try {
      // Stream simulation for better UX
      const stream = gemini.executePromptStream(compiled);
      let fullText = '';
      setTestResponse('');
      for await (const chunk of stream) {
        fullText += chunk;
        setTestResponse(prev => prev + chunk);
      }
    } catch (e) {
      setTestResponse("Error executing prompt. Please check settings.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files: File[] = Array.from(e.target.files);
    
    for (const file of files) {
      const id = uuidv4();
      let type: Attachment['type'] = 'other';
      if (file.type.startsWith('audio/')) type = 'audio';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('image/')) type = 'image';
      else if (file.type === 'application/pdf') type = 'pdf';
      else if (file.type.includes('wordprocessingml') || file.type.includes('text/') || file.type.includes('json') || file.name.endsWith('.md')) type = 'text';

      const newAttachment: Attachment = {
        id,
        name: file.name,
        type,
        mimeType: file.type,
        content: '', // Can store base64 if needed for persistence, but focusing on analysis for now
        status: 'processing'
      };

      setAttachments(prev => [...prev, newAttachment]);

      // Process immediately
      try {
        const result = await gemini.processFile(file);
        setAttachments(prev => prev.map(a => 
          a.id === id ? { ...a, status: 'done', analysis: result.analysis } : a
        ));
      } catch (err) {
        console.error(err);
        setAttachments(prev => prev.map(a => 
          a.id === id ? { ...a, status: 'error', errorMessage: 'Analysis failed' } : a
        ));
      }
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const phases: Phase[] = ['intent', 'context', 'persona', 'structure'];
  const currentPhaseIdx = phases.indexOf(activePhase);

  const nextPhase = () => {
    if (currentPhaseIdx < phases.length - 1) setActivePhase(phases[currentPhaseIdx + 1]);
  };
  
  const prevPhase = () => {
    if (currentPhaseIdx > 0) setActivePhase(phases[currentPhaseIdx - 1]);
  };

  // Components for each phase
  const renderPhaseContent = () => {
    switch (activePhase) {
      case 'intent':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-6" />
              <h2 className="text-4xl font-serif mb-4 text-stone-800">What do you wish to create?</h2>
              <p className="text-stone-500 mb-8">Describe your goal, and I shall build the framework.</p>
              <div className="relative">
                <textarea 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., I want to write a witty newsletter about AI trends for developers..."
                  className="w-full p-6 text-xl bg-white border border-stone-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-stone-900 focus:outline-none resize-none font-serif min-h-[160px]"
                />
                <button 
                  onClick={handleAutoGenerate}
                  disabled={isGenerating || !goal}
                  className="absolute bottom-4 right-4 bg-stone-900 text-white p-3 rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
                  <span>Ignite</span>
                </button>
              </div>
              <div className="mt-8">
                 <button onClick={() => setActivePhase('context')} className="text-stone-400 hover:text-stone-600 text-sm">Skip to manual creation</button>
              </div>
            </motion.div>
          </div>
        );
      case 'context':
        return (
          <div className="max-w-2xl mx-auto pt-10">
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <SectionHeader title="Chapter I: The Context" subtitle="Define the boundaries of the subject matter." color="text-amber-600" />
              <div className="space-y-6">
                <InputGroup label="Topic" value={field.topic} onChange={v => setField({...field, topic: v})} placeholder="Central subject..." />
                
                {/* Attachments Section */}
                <div className="pt-4 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Source Material</label>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-amber-600 hover:text-amber-700 text-xs font-medium flex items-center gap-1"
                    >
                      <Paperclip size={12} />
                      Attach Files
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      multiple 
                      className="hidden" 
                      accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt,.md,.json,.jsonl"
                    />
                  </div>
                  
                  {attachments.length > 0 && (
                    <div className="grid gap-3">
                      {attachments.map(att => (
                        <div key={att.id} className="bg-white border border-stone-200 rounded-lg p-3 flex items-start gap-3 relative group">
                           <div className="p-2 bg-stone-50 rounded text-stone-500">
                              {att.type === 'audio' && <Music size={16} />}
                              {att.type === 'video' && <Video size={16} />}
                              {att.type === 'image' && <ImageIcon size={16} />}
                              {(att.type === 'pdf' || att.type === 'text') && <FileText size={16} />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-stone-800 truncate">{att.name}</span>
                                <button onClick={() => removeAttachment(att.id)} className="text-stone-300 hover:text-red-500 p-1"><X size={14}/></button>
                              </div>
                              {att.status === 'processing' && (
                                <div className="flex items-center gap-2 text-xs text-amber-600 animate-pulse">
                                  <Loader2 size={10} className="animate-spin" />
                                  <span>
                                    {att.type === 'audio' ? 'Transcribing...' : att.type === 'video' ? 'Analyzing frames...' : 'Processing...'}
                                  </span>
                                </div>
                              )}
                              {att.status === 'done' && (
                                <p className="text-xs text-stone-500 line-clamp-2">{att.analysis}</p>
                              )}
                              {att.status === 'error' && (
                                <span className="text-xs text-red-500">{att.errorMessage}</span>
                              )}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <InputGroup label="Task Type" value={field.taskType} onChange={v => setField({...field, taskType: v})} placeholder="Essay, Code, Summary..." />
                <InputGroup label="Domain Specifics" value={field.domainSpecifics} onChange={v => setField({...field, domainSpecifics: v})} placeholder="Specialized knowledge required..." />
                <InputGroup label="Keywords" value={field.keywords} onChange={v => setField({...field, keywords: v})} placeholder="Key terms to include..." />
              </div>
            </motion.div>
          </div>
        );
      case 'persona':
        return (
          <div className="max-w-2xl mx-auto pt-10">
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <SectionHeader title="Chapter II: The Voice" subtitle="Who is speaking, and to whom?" color="text-violet-600" />
              <div className="space-y-6">
                <InputGroup label="AI Persona" value={tenor.aiPersona} onChange={v => setTenor({...tenor, aiPersona: v})} placeholder="Expert, Friend, Critic..." />
                <InputGroup label="Target Audience" value={tenor.targetAudience.join(', ')} onChange={v => setTenor({...tenor, targetAudience: v.split(',').map(s=>s.trim())})} placeholder="Beginners, Experts, Kids..." />
                <InputGroup label="Desired Tone" value={tenor.desiredTone} onChange={v => setTenor({...tenor, desiredTone: v})} placeholder="Formal, Witty, Serious..." />
                <InputGroup label="Interpersonal Stance" value={tenor.interpersonalStance} onChange={v => setTenor({...tenor, interpersonalStance: v})} placeholder="Authoritative, Suggestive..." />
              </div>
            </motion.div>
          </div>
        );
      case 'structure':
        return (
          <div className="max-w-2xl mx-auto pt-10">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <SectionHeader title="Chapter III: The Form" subtitle="How shall the narrative be structured?" color="text-rose-600" />
              <div className="space-y-6">
                 <InputGroup label="Output Format" value={mode.outputFormat} onChange={v => setMode({...mode, outputFormat: v})} placeholder="JSON, Markdown, Plain Text..." />
                 <InputGroup label="Rhetorical Structure" value={mode.rhetoricalStructure} onChange={v => setMode({...mode, rhetoricalStructure: v})} placeholder="Problem-Solution, Chronological..." />
                 <InputGroup label="Length Constraint" value={mode.lengthConstraint} onChange={v => setMode({...mode, lengthConstraint: v})} placeholder="Brief, Verbose, 500 words..." />
                 <InputGroup label="Textual Directives" value={mode.textualDirectives} onChange={v => setMode({...mode, textualDirectives: v})} placeholder="No passive voice, Use bullet points..." />
              </div>
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-50 z-50 flex flex-col lg:flex-row">
      {/* LEFT: Editor Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="px-8 py-6 border-b border-stone-200 flex justify-between items-center bg-white/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
              <ChevronLeft size={20} />
            </button>
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent font-serif text-2xl text-stone-900 focus:outline-none w-full max-w-md placeholder-stone-400"
              placeholder="Untitled Narrative"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-stone-900 text-stone-50 rounded-full hover:bg-stone-800 transition-colors">
              <Save size={18} />
              <span>Save Narrative</span>
            </button>
          </div>
        </header>

        {/* Phase Navigation */}
        {activePhase !== 'intent' && (
          <div className="px-8 py-4 flex justify-center gap-2">
             <PhaseIndicator active={activePhase === 'context'} label="Context" onClick={() => setActivePhase('context')} />
             <div className="w-8 h-[1px] bg-stone-300 self-center" />
             <PhaseIndicator active={activePhase === 'persona'} label="Persona" onClick={() => setActivePhase('persona')} />
             <div className="w-8 h-[1px] bg-stone-300 self-center" />
             <PhaseIndicator active={activePhase === 'structure'} label="Structure" onClick={() => setActivePhase('structure')} />
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-20 relative">
           {renderPhaseContent()}
           
           {/* Navigation Buttons for Manual Flow */}
           {activePhase !== 'intent' && (
             <div className="max-w-2xl mx-auto mt-12 flex justify-between">
                <button 
                  onClick={prevPhase} 
                  disabled={activePhase === 'context'}
                  className="text-stone-400 hover:text-stone-800 disabled:opacity-0 transition-all font-serif italic"
                >
                  &larr; Previous Chapter
                </button>
                <button 
                  onClick={nextPhase} 
                  disabled={activePhase === 'structure'}
                  className="text-stone-400 hover:text-stone-800 disabled:opacity-0 transition-all font-serif italic"
                >
                  Next Chapter &rarr;
                </button>
             </div>
           )}
        </div>
      </div>

      {/* RIGHT: Live Preview & Testing Panel */}
      <div className="w-full lg:w-[450px] border-l border-stone-200 bg-white flex flex-col shadow-xl z-20">
        <div className="flex-1 flex flex-col h-1/2 border-b border-stone-100">
           <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
             <span className="text-xs font-bold tracking-widest text-stone-400 uppercase">Live Manuscript</span>
           </div>
           <div className="flex-1 p-6 overflow-y-auto bg-stone-50 font-mono text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">
             {compileSFLPrompt(field, tenor, mode, attachments)}
           </div>
        </div>
        
        <div className="flex-1 flex flex-col h-1/2 bg-white">
           <div className="p-4 border-b border-stone-100 flex justify-between items-center">
             <span className="text-xs font-bold tracking-widest text-stone-400 uppercase">The Oracle (Output)</span>
             <button 
              onClick={handleTest}
              disabled={isTesting}
              className="text-xs flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full hover:bg-amber-100 transition-colors"
             >
               {isTesting ? <RefreshCw size={12} className="animate-spin"/> : <Play size={12} />}
               INVOKE MUSE
             </button>
           </div>
           <div className="flex-1 p-6 overflow-y-auto prose prose-stone prose-sm">
             {testResponse ? (
               <div className="markdown-body">
                 {/* Simple rendering for now, could be ReactMarkdown */}
                 {testResponse.split('\n').map((line, i) => <p key={i} className="min-h-[1em]">{line}</p>)}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-stone-300 italic">
                 <Sparkles size={24} className="mb-2 opacity-50"/>
                 <span>Waiting for invocation...</span>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string; subtitle: string; color: string }> = ({ title, subtitle, color }) => (
  <div className="mb-8 border-l-2 border-stone-200 pl-4">
    <h2 className={`text-3xl font-serif mb-1 ${color}`}>{title}</h2>
    <p className="text-stone-400 font-serif italic">{subtitle}</p>
  </div>
);

const InputGroup: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder: string }> = ({ label, value, onChange, placeholder }) => (
  <div className="group">
    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 group-focus-within:text-stone-800 transition-colors">{label}</label>
    <input 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-stone-50 border-b-2 border-stone-200 p-3 focus:border-stone-800 focus:outline-none transition-colors text-lg font-serif placeholder-stone-300"
    />
  </div>
);

const PhaseIndicator: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${active ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}>
    {label}
  </button>
);