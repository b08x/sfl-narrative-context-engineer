import { GoogleGenAI } from '@google/genai';
import { SFLField, SFLTenor, SFLMode, Attachment } from '../types';
import mammoth from 'mammoth';

export class GeminiService {
  private client: GoogleGenAI;

  constructor() {
    // API key must be obtained exclusively from the environment variable process.env.API_KEY.
    this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  // Generate the initial SFL structure from a vague goal
  async generateSFLFromGoal(goal: string): Promise<{ field: SFLField, tenor: SFLTenor, mode: SFLMode, title: string } | null> {
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
        model: 'gemini-2.5-flash',
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

  // Execute the final prompt
  async executePrompt(compiledPrompt: string): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: compiledPrompt,
      });
      return response.text || "No response generated.";
    } catch (error) {
      console.error("Execution Error:", error);
      return `Error: ${(error as Error).message}`;
    }
  }
  
  // Stream execution (Mocking the stream interface for now to keep it simple in UI, or real impl)
  async *executePromptStream(compiledPrompt: string) {
      const responseStream = await this.client.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: compiledPrompt,
      });

      for await (const chunk of responseStream) {
        yield chunk.text;
      }
  }

  // File Processing
  async processFile(file: File): Promise<{ analysis: string }> {
    const base64Data = await this.fileToBase64(file);
    const mimeType = file.type;

    // Route to appropriate model based on file type
    if (mimeType.startsWith('audio/')) {
      return this.processAudio(base64Data, mimeType);
    } else if (mimeType.startsWith('video/')) {
      return this.processVideo(base64Data, mimeType);
    } else if (mimeType.startsWith('image/')) {
      return this.processImage(base64Data, mimeType);
    } else if (mimeType === 'application/pdf') {
      return this.processPDF(base64Data, mimeType);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return this.processDOCX(file); // DOCX handling via mammoth locally
    } else {
      // Default text handling
      return this.processTextFile(file);
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

  private async processDOCX(file: File) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return { analysis: result.value || "Empty document." };
    } catch (e) {
      console.error("DOCX extraction failed", e);
      return { analysis: "Failed to extract text from DOCX." };
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