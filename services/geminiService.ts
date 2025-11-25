import { GoogleGenAI } from '@google/genai';
import { SFLField, SFLTenor, SFLMode } from '../types';

export class GeminiService {
  private client: GoogleGenAI | null = null;

  constructor(apiKey?: string) {
    // If apiKey is passed, use it. Otherwise try process.env.
    // In a real app user provides key via settings which we inject here.
    const key = apiKey || process.env.API_KEY;
    if (key) {
      this.client = new GoogleGenAI({ apiKey: key });
    }
  }

  // Generate the initial SFL structure from a vague goal
  async generateSFLFromGoal(goal: string): Promise<{ field: SFLField, tenor: SFLTenor, mode: SFLMode, title: string } | null> {
    if (!this.client) throw new Error("API Key missing");

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
    if (!this.client) throw new Error("API Key missing");

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
      if (!this.client) throw new Error("API Key missing");
      
      const responseStream = await this.client.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: compiledPrompt,
      });

      for await (const chunk of responseStream) {
        yield chunk.text;
      }
  }
}

export const compileSFLPrompt = (field: SFLField, tenor: SFLTenor, mode: SFLMode): string => {
  return `
# CONTEXT (Field)
**Topic:** ${field.topic}
**Task:** ${field.taskType}
**Domain:** ${field.domainSpecifics}
**Keywords:** ${field.keywords}

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
Based on the framework above, please execute the task.
`.trim();
};
