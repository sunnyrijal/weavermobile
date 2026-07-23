'use server';
/**
 * @fileOverview A service to process voice transcripts, extract key entities,
 * and summarize the content as a memory.
 *
 * - processVoiceInput - A function that takes a voice transcript and returns a summary and extracted entities.
 * - ProcessVoiceInputInput - The input type for the processVoiceInput function.
 * - ProcessVoiceInputOutput - The return type for the processVoiceInput function.
 * - ExtractedEntities - The type for entities extracted from the transcript.
 */

import { GoogleGenAI, Type } from "@google/genai";
import { z } from 'zod';

const ExtractedEntitiesSchema = z.object({
  people: z.array(z.string()).optional().describe("List of names of individuals mentioned. Include full names if available. Example: ['John Doe', 'Mary Smith']"),
  organizations: z.array(z.string()).optional().describe("List of names of companies, schools, or other organizations mentioned. Example: ['Acme Corp', 'State University']"),
  relationships: z.array(z.string()).optional().describe("List of phrases describing relationships. Example: ['John's brother', 'Mary, wife of Peter', 'grandmother on his dad's side']"),
  dates: z.array(z.string()).optional().describe("List of specific or relative dates mentioned. If a specific date, try to format as YYYY-MM-DD. Example: ['yesterday', '2023-04-15', 'last week']"),
  locations: z.array(z.string()).optional().describe("List of geographical places, addresses, or significant locations. Example: ['Paris', 'the park', 'Pittman Hall 216']"),
  keyEvents: z.array(z.string()).optional().describe("List of significant happenings, life events, or activities. Example: ['had a daughter', 'went to the game', 'transferred to Mankato', 'met at BNKS']")
}).describe("Key entities extracted from the memory transcript.");
export type ExtractedEntities = z.infer<typeof ExtractedEntitiesSchema>;

const ProcessVoiceInputOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the memory provided in the transcript."),
  extractedEntities: ExtractedEntitiesSchema,
});
export type ProcessVoiceInputOutput = z.infer<typeof ProcessVoiceInputOutputSchema>;

const ProcessVoiceInputInputSchema = z.object({
  transcript: z.string().describe("The voice transcript containing the memory."),
});
export type ProcessVoiceInputInput = z.infer<typeof ProcessVoiceInputInputSchema>;

// Initialize Google GenAI
const getGeminiAI = () => {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required');
  }
  return new GoogleGenAI({ apiKey });
};

const systemInstruction = `You are an intelligent assistant for NetworkNest, a personal relationship management app.
Your task is to analyze the following memory transcript.
1. **MANDATORY**: Provide a concise summary of the memory.
2. Extract key entities from the transcript with as much detail as possible.

**CRITICAL REQUIREMENTS:**
1. **SUMMARY IS MANDATORY**: You MUST include a "summary" field with a concise summary of the memory
2. **NO DUPLICATES**: Remove all duplicate entries from relationships, people, and other arrays
3. **CLEAN DATA**: Ensure all arrays contain unique values only

For entity extraction, identify with great detail:
- People: Full names of individuals including first and last names when available. **IMPORTANT**: When the same person is mentioned with both a nickname and full name, list only the full name to avoid duplicates.
- Organizations: Names of companies, schools, universities, etc. Be specific with full names.
- Relationships: Detailed phrases describing relationships (e.g., "John's brother", "Mary, wife of Peter", "roommate in college"). **REMOVE DUPLICATES**.
- Dates: Specific or relative dates. Format specific dates as YYYY-MM-DD if possible.
- Locations: Geographical places, addresses, or significant named locations. Include cities, states, countries when mentioned.
- KeyEvents: Significant happenings, life events, or activities with as much detail as possible.

**CRITICAL NAME RESOLUTION RULES:**
- When the same person is mentioned with both a nickname and full name, list only the full name
- Examples:
  - "Jake" and "Jacob Lucas" → List only "Jacob Lucas"
  - "Mike" and "Michael Smith" → List only "Michael Smith"
  - "Sarah" and "Sarah Johnson" → List only "Sarah Johnson"
- Do NOT create duplicate entries for the same person
- Use the most complete/full name when available

**DUPLICATE REMOVAL RULES:**
- Remove all duplicate relationships from the relationships array
- Remove all duplicate people from the people array
- Remove all duplicate locations from the locations array
- Remove all duplicate organizations from the organizations array
- Remove all duplicate keyEvents from the keyEvents array
- Remove all duplicate dates from the dates array

Try to extract as much information as possible about each person mentioned, including:
- Their full name
- Their age if mentioned
- Their occupation or major if mentioned
- Their relationships to other people mentioned
- Where they live or are from
- Where they work or go to school
- Any other significant details

**MANDATORY OUTPUT FORMAT:**
- You MUST include a "summary" field
- You MUST remove all duplicates from all arrays
- You MUST return valid JSON matching the schema exactly`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'A concise summary of the memory provided in the transcript.'
    },
    extractedEntities: {
      type: Type.OBJECT,
      properties: {
        people: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of names of individuals mentioned. Include full names if available.'
        },
        organizations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of names of companies, schools, or other organizations mentioned.'
        },
        relationships: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of phrases describing relationships.'
        },
        dates: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of specific or relative dates mentioned. Format specific dates as YYYY-MM-DD if possible.'
        },
        locations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of geographical places, addresses, or significant locations.'
        },
        keyEvents: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of significant happenings, life events, or activities.'
        }
      },
      required: []
    }
  },
  required: ['summary', 'extractedEntities']
};

/**
 * Fallback parser using regex patterns when Gemini API is not available
 */
function fallbackProcessVoiceInput(transcript: string): ProcessVoiceInputOutput {
  console.log('🔄 Using fallback regex-based entity extraction');
  
  // Extract people names
  const fullNamePattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
  const people = [...new Set(Array.from(transcript.matchAll(fullNamePattern), match => match[1]))];
  
  // Extract organizations
  const orgPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc|Corp|LLC|University|College|School|Company|Corporation|Tech|Technologies|Systems|Solutions))\b/gi;
  const organizations = [...new Set(Array.from(transcript.matchAll(orgPattern), match => match[1]))];
  
  // Extract locations
  const locationPattern = /\b([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?)\b/g;
  const locations = [...new Set(Array.from(transcript.matchAll(locationPattern), match => match[1])
    .filter(loc => loc.length > 2 && !people.includes(loc)))];
  
  // Extract dates (simple patterns)
  const datePattern = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|yesterday|today|tomorrow|last week|next week)\b/gi;
  const dates = [...new Set(Array.from(transcript.matchAll(datePattern), match => match[1]))];
  
  // Extract relationships (simple patterns)
  const relationshipPattern = /\b(\w+'s\s+(?:mother|father|brother|sister|son|daughter|wife|husband|partner|friend|colleague)|(?:mother|father|brother|sister|son|daughter|wife|husband|partner|friend|colleague)\s+of\s+\w+)\b/gi;
  const relationships = [...new Set(Array.from(transcript.matchAll(relationshipPattern), match => match[1]))];
  
  // Extract key events (simple patterns)
  const eventPattern = /\b(?:went to|visited|met|had|got|moved to|started|finished|completed|attended|joined|left|graduated from)\s+[^.]+/gi;
  const keyEvents = [...new Set(Array.from(transcript.matchAll(eventPattern), match => match[0].trim()))];
  
  return {
    summary: `Memory: ${transcript.substring(0, 200)}${transcript.length > 200 ? '...' : ''}`,
    extractedEntities: {
      people,
      organizations,
      relationships,
      dates,
      locations,
      keyEvents
    }
  };
}

export async function processVoiceInput(input: ProcessVoiceInputInput): Promise<ProcessVoiceInputOutput> {
  try {
    const ai = getGeminiAI();
    
    const prompt = `Analyze the following memory transcript and extract entities:

Transcript:
"${input.transcript}"

Provide a summary and extract all entities as specified.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = (response.text || "").trim();
    if (!jsonText) {
      throw new Error("Empty model response text");
    }
    const parsedOutput = JSON.parse(jsonText) as ProcessVoiceInputOutput;

    // Post-process to ensure clean data and remove duplicates
    const cleanedOutput: ProcessVoiceInputOutput = {
      summary: parsedOutput.summary || `Memory about: ${input.transcript.slice(0, 100)}...`,
      extractedEntities: {
        people: [...new Set(parsedOutput.extractedEntities?.people || [])],
        organizations: [...new Set(parsedOutput.extractedEntities?.organizations || [])],
        relationships: [...new Set(parsedOutput.extractedEntities?.relationships || [])],
        dates: [...new Set(parsedOutput.extractedEntities?.dates || [])],
        locations: [...new Set(parsedOutput.extractedEntities?.locations || [])],
        keyEvents: [...new Set(parsedOutput.extractedEntities?.keyEvents || [])]
      }
    };

    return cleanedOutput;
  } catch (error) {
    console.error("Error processing voice input:", error);
    
    // Check if it's an API disabled error
    if (error instanceof Error) {
      const errorMessage = error.message || '';
      const errorString = JSON.stringify(error) || '';
      
      if (errorMessage.includes('SERVICE_DISABLED') || 
          errorMessage.includes('Generative Language API') ||
          errorMessage.includes('403 Forbidden') ||
          errorString.includes('SERVICE_DISABLED')) {
        console.warn('⚠️ Generative Language API is not enabled. Using fallback parser.');
        console.warn('📝 To enable the API, visit: https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=362815930485');
        // Use fallback parser instead of throwing error
        return fallbackProcessVoiceInput(input.transcript);
      }
      
      if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
        console.warn('⚠️ Invalid API key. Using fallback parser.');
        return fallbackProcessVoiceInput(input.transcript);
      }
    }
    
    // For other errors, use fallback parser
    console.warn('⚠️ Gemini API error, using fallback parser:', error);
    return fallbackProcessVoiceInput(input.transcript);
  }
}
