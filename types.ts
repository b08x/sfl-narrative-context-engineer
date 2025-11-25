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

export interface PromptSFL {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  sflField: SFLField;
  sflTenor: SFLTenor;
  sflMode: SFLMode;
  compiledPrompt?: string;
  versions?: PromptSFL[];
}

export interface AppState {
  prompts: PromptSFL[];
  activePromptId: string | null;
  apiKeys: {
    google?: string;
    openai?: string;
    mistral?: string;
  };
  addPrompt: (prompt: PromptSFL) => void;
  updatePrompt: (id: string, updates: Partial<PromptSFL>) => void;
  setActivePrompt: (id: string | null) => void;
  deletePrompt: (id: string) => void;
  setApiKey: (provider: 'google' | 'openai' | 'mistral', key: string) => void;
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
