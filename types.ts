export interface SFLField {
  topic: string;
  taskType: string;
  domainSpecifics: string;
  keywords: string;
}

export interface SFLTenor {
  aiPersona: string;
  targetAudience: string[];
  desiredTone: string;
  interpersonalStance: string;
}

export interface SFLMode {
  outputFormat: string;
  rhetoricalStructure: string;
  lengthConstraint: string;
  textualDirectives: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'audio' | 'video' | 'image' | 'text' | 'pdf' | 'document' | 'other';
  mimeType: string;
  content: string; // Base64 or Text content
  analysis?: string; // Transcribed text, image description, or summary
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

export interface PromptSFL {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  sflField: SFLField;
  sflTenor: SFLTenor;
  sflMode: SFLMode;
  attachments?: Attachment[];
  compiledPrompt?: string;
  versions?: PromptSFL[];
}

export type Theme = 'light' | 'dark';

export interface AppState {
  prompts: PromptSFL[];
  activePromptId: string | null;
  theme: Theme;
  primaryModel: string;
  personaModel: string;
  availableModels: string[];
  addPrompt: (prompt: PromptSFL) => void;
  updatePrompt: (id: string, updates: Partial<PromptSFL>) => void;
  setActivePrompt: (id: string | null) => void;
  deletePrompt: (id: string) => void;
  setTheme: (theme: Theme) => void;
  setPrimaryModel: (model: string) => void;
  setPersonaModel: (model: string) => void;
  setAvailableModels: (models: string[]) => void;
}

export const DEFAULT_FIELD: SFLField = {
  topic: '',
  taskType: '',
  domainSpecifics: '',
  keywords: ''
};

export const DEFAULT_TENOR: SFLTenor = {
  aiPersona: 'Helpful Assistant',
  targetAudience: [],
  desiredTone: 'Neutral',
  interpersonalStance: 'Supportive'
};

export const DEFAULT_MODE: SFLMode = {
  outputFormat: 'Markdown',
  rhetoricalStructure: 'Standard',
  lengthConstraint: 'Moderate',
  textualDirectives: ''
};