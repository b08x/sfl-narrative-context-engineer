import { GoogleGenAI } from '@google/genai';
import { SFLField, SFLTenor, SFLMode, Attachment } from '../types';
import mammoth from 'mammoth';

export class GeminiService {
  private client: GoogleGenAI;

  constructor() {
    // API key must be obtained exclusively from the environment variable process.env.API_KEY.
    this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.models.list();
      const modelNames: string[] = [];
      // The response is a Pager<Model>, which is async iterable
      for await (const model of response) {
        if (model.name) {
          modelNames.push(model.name);
        }
      }
      
      // Filter for gemini models to keep the list clean
      return modelNames.filter(name => name && name.includes('gemini'));
    } catch (error) {
      console.warn("Failed to list models, falling back to defaults.", error);
      return [
        'gemini-3-pro-preview',
        'gemini-2.5-flash',
        'gemini-2.5-flash-thinking-preview-09-2025'
      ];
    }
  }

  // Generate the initial SFL structure from a vague goal
  async generateSFLFromGoal(goal: string, model: string = 'gemini-3-pro-preview'): Promise<{ field: SFLField, tenor: SFLTenor, mode: SFLMode, title: string } | null> {
    const prompt = `
      You are an expert in Systemic Functional Linguistics (SFL) applied to Prompt Engineering.
      Analyze the user's goal: "${goal}".
      
      Construct a robust SFL framework for this request.
      Return strictly a JSON object with this structure:
      {
        "title": "A short poetic title for this prompt",
        "field": { "topic": "", "taskType": "", "domainSpecifics": "", "keywords": "" },
        "tenor": { "aiPersona": "", "targetAudience": ["string"], "desiredTone": "", "interpersonalStance": "" },
        "mode": { "outputFormat": "", "rhetoricalStructure": "", "lengthConstraint": "", "textualDirectives": "" }
      }
    `;

    try {
      const response = await this.client.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      
      const text = response.text;
      if (!text) return null;
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini SFL Generation Error:", error);
      throw error;
    }
  }

  // Analyze files to construct a Persona (Tenor)
  async analyzeFilesForTenor(files: File[], model: string = 'gemini-3-pro-preview'): Promise<SFLTenor | null> {
    const parts: any[] = [];

    for (const file of files) {
      const mimeType = file.type;
      
      if (mimeType.startsWith('image/') || mimeType.startsWith('audio/') || mimeType === 'application/pdf') {
        const base64 = await this.fileToBase64(file);
        parts.push({ inlineData: { mimeType, data: base64 }});
      } else {
        // Text/Doc extraction
        const textContent = await this.extractTextFromFile(file);
        if (textContent) {
           parts.push({ text: `Content from ${file.name}:\n${textContent}` });
        }
      }
    }

    if (parts.length === 0) return null;

    const prompt = `
      Analyze the provided content (images, audio, or documents) to determine the author's or speaker's persona.
      Identify the distinct voice, tone, and relationship with the audience found in these materials.
      
      Construct a Systemic Functional Linguistics (SFL) Tenor framework that accurately mimics this persona.
      Return strictly a JSON object with this structure:
      {
        "aiPersona": "A short, descriptive title for this persona (e.g. 'Witty Analyst', 'Empathetic Coach')",
        "targetAudience": ["Inferred Primary Audience", "Inferred Secondary Audience"],
        "desiredTone": "Adjectives describing the tone (e.g. 'Sarcastic', 'Professional', 'Warm')",
        "interpersonalStance": "The relationship to the audience (e.g. 'Peer-to-peer', 'Authoritative', 'Servant-Leader')"
      }
    `;
    
    parts.push({ text: prompt });

    try {
      const response = await this.client.models.generateContent({
        model: model,
        contents: { parts },
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (!text) return null;
      return JSON.parse(text);
    } catch (error: any) {
      console.error("Persona Analysis Error:", error);
      if (error.message && error.message.includes('token count exceeds')) {
         throw new Error(`The uploaded files exceed the token limit for ${model}. Please try fewer files or use gemini-3-pro-preview.`);
      }
      throw error;
    }
  }

  // Execute the final prompt
  async executePrompt(compiledPrompt: string, model: string = 'gemini-3-pro-preview'): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: model,
        contents: compiledPrompt,
      });
      return response.text || "No response generated.";
    } catch (error) {
      console.error("Execution Error:", error);
      return `Error: ${(error as Error).message}`;
    }
  }
  
  // Stream execution
  async *executePromptStream(compiledPrompt: string, model: string = 'gemini-3-pro-preview') {
      const responseStream = await this.client.models.generateContentStream({
        model: model,
        contents: compiledPrompt,
      });

      for await (const chunk of responseStream) {
        yield chunk.text;
      }
  }

  // File Processing
  async processFile(file: File): Promise<{ analysis: string }> {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type;

    // JSON Handling
    if (fileName.endsWith('.json')) {
      return this.processJSON(file);
    }
    
    // JSONL Handling
    if (fileName.endsWith('.jsonl')) {
      return this.processJSONL(file);
    }

    // DOCX Handling
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const text = await this.extractTextFromDOCX(file);
      return { analysis: text || "Empty document." };
    }

    // Route to appropriate model based on file type for Media and PDF
    if (mimeType.startsWith('audio/') || 
        mimeType.startsWith('video/') || 
        mimeType.startsWith('image/') || 
        mimeType === 'application/pdf') {
      
      const base64Data = await this.fileToBase64(file);

      if (mimeType.startsWith('audio/')) {
        return this.processAudio(base64Data, mimeType);
      } else if (mimeType.startsWith('video/')) {
        return this.processVideo(base64Data, mimeType);
      } else if (mimeType.startsWith('image/')) {
        return this.processImage(base64Data, mimeType);
      } else if (mimeType === 'application/pdf') {
        return this.processPDF(base64Data, mimeType);
      }
    }

    // Default text handling for other types
    return this.processTextFile(file);
  }

  // Helper to extract text from generic files for Persona analysis
  private async extractTextFromFile(file: File): Promise<string> {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.docx')) {
      return await this.extractTextFromDOCX(file);
    }
    // Try reading as text
    try {
       return await file.text();
    } catch (e) {
       console.warn(`Could not read file ${file.name} as text.`);
       return "";
    }
  }

  private async processJSON(file: File) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      return { analysis: JSON.stringify(json, null, 2) };
    } catch (e) {
      return { analysis: `Error parsing JSON: ${(e as Error).message}` };
    }
  }

  private async processJSONL(file: File) {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      const analyzedLines = lines.map((line, idx) => {
        try {
          const json = JSON.parse(line);
          return JSON.stringify(json);
        } catch (e) {
          return `[Line ${idx + 1}] Invalid JSON: ${line}`;
        }
      });
      return { analysis: analyzedLines.join('\n') };
    } catch (e) {
      return { analysis: `Error processing JSONL: ${(e as Error).message}` };
    }
  }

  private async processAudio(base64Data: string, mimeType: string) {
    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Transcribe this audio verbatim." }
        ]
      }
    });
    return { analysis: response.text || "No transcription generated." };
  }

  private async processVideo(base64Data: string, mimeType: string) {
    const response = await this.client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Analyze this video and provide a comprehensive description of the visual and audio content, including any captions or spoken words." }
        ]
      }
    });
    return { analysis: response.text || "No analysis generated." };
  }

  private async processImage(base64Data: string, mimeType: string) {
    const response = await this.client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Analyze this image in detail. Describe the scene, objects, text, and mood." }
        ]
      }
    });
    return { analysis: response.text || "No analysis generated." };
  }

  private async processPDF(base64Data: string, mimeType: string) {
    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Analyze this document. Summarize the key points and extract the main content." }
        ]
      }
    });
    return { analysis: response.text || "No analysis generated." };
  }

  private async extractTextFromDOCX(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value || "";
    } catch (e) {
      console.error("DOCX extraction failed", e);
      return "";
    }
  }

  private async processTextFile(file: File) {
    const text = await file.text();
    return { analysis: text };
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const compileSFLPrompt = (field: SFLField, tenor: SFLTenor, mode: SFLMode, attachments: Attachment[] = []): string => {
  const attachmentContext = attachments
    .filter(a => a.status === 'done' && a.analysis)
    .map(a => `\n### Attachment: ${a.name} (${a.type})\n${a.analysis}`)
    .join('\n');

  return `
# CONTEXT (Field)
**Topic:** ${field.topic}
**Task:** ${field.taskType}
**Domain:** ${field.domainSpecifics}
**Keywords:** ${field.keywords}

${attachmentContext ? `\n# REFERENCE MATERIAL\n${attachmentContext}\n` : ''}

# PERSONA & AUDIENCE (Tenor)
**Role:** ${tenor.aiPersona}
**Audience:** ${tenor.targetAudience.join(', ')}
**Tone:** ${tenor.desiredTone}
**Stance:** ${tenor.interpersonalStance}

# FORMAT & STRUCTURE (Mode)
**Format:** ${mode.outputFormat}
**Structure:** ${mode.rhetoricalStructure}
**Length:** ${mode.lengthConstraint}
**Directives:** ${mode.textualDirectives}

---
**INSTRUCTION:**
Based on the framework and reference material above, please execute the task.
`.trim();
};