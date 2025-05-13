'use server';
/**
 * @fileOverview A Genkit flow to process voice transcripts, extract key entities,
 * and summarize the content as a memory.
 *
 * - processVoiceInput - A function that takes a voice transcript and returns a summary and extracted entities.
 * - ProcessVoiceInputInput - The input type for the processVoiceInput function.
 * - ProcessVoiceInputOutput - The return type for the processVoiceInput function.
 * - ExtractedEntitiesSchema - The schema for entities extracted from the transcript.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const ExtractedEntitiesSchema = z.object({
  people: z.array(z.string()).optional().describe("List of names of individuals mentioned. Include full names if available. Example: ['John Doe', 'Mary Smith']"),
  organizations: z.array(z.string()).optional().describe("List of names of companies, schools, or other organizations mentioned. Example: ['Acme Corp', 'State University']"),
  relationships: z.array(z.string()).optional().describe("List of phrases describing relationships. Example: ['John's brother', 'Mary, wife of Peter', 'grandmother on his dad's side']"),
  dates: z.array(z.string()).optional().describe("List of specific or relative dates mentioned. If a specific date, try to format as YYYY-MM-DD. Example: ['yesterday', '2023-04-15', 'last week']"),
  locations: z.array(z.string()).optional().describe("List of geographical places, addresses, or significant locations. Example: ['Paris', 'the park', 'Pittman Hall 216']"),
  keyEvents: z.array(z.string()).optional().describe("List of significant happenings, life events, or activities. Example: ['had a daughter', 'went to the game', 'transferred to Mankato', 'met at BNKS']")
}).describe("Key entities extracted from the memory transcript.");

export const ProcessVoiceInputOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the memory provided in the transcript."),
  extractedEntities: ExtractedEntitiesSchema,
});
export type ProcessVoiceInputOutput = z.infer<typeof ProcessVoiceInputOutputSchema>;

export const ProcessVoiceInputInputSchema = z.object({
  transcript: z.string().describe("The voice transcript containing the memory."),
});
export type ProcessVoiceInputInput = z.infer<typeof ProcessVoiceInputInputSchema>;

export async function processVoiceInput(input: ProcessVoiceInputInput): Promise<ProcessVoiceInputOutput> {
  return processVoiceInputFlow(input);
}

const processVoiceInputPrompt = ai.definePrompt({
  name: 'processVoiceInputPrompt',
  input: { schema: ProcessVoiceInputInputSchema },
  output: { schema: ProcessVoiceInputOutputSchema },
  prompt: `You are an intelligent assistant for NetworkNest, a personal relationship management app.
Your task is to analyze the following memory transcript.
1. Provide a concise summary of the memory.
2. Extract key entities from the transcript.

Transcript:
"{{{transcript}}}"

For entity extraction, identify:
- People: Names of individuals.
- Organizations: Names of companies, schools, etc.
- Relationships: Phrases describing relationships (e.g., "John's brother", "Mary, wife of Peter").
- Dates: Specific or relative dates. Format specific dates as YYYY-MM-DD if possible.
- Locations: Geographical places, addresses, or significant named locations (e.g., building names, room numbers).
- KeyEvents: Significant happenings, life events, or activities (e.g., "had a daughter", "went to the game", "transferred to Mankato").

Example:
Transcript: "I met Jadon's brother Jimmy yesterday. Jimmy's wife Katie just had a daughter. We all went to the game at the stadium last week. Jadon transferred to Mankato State after living in Pittman 216 during his freshman year at Main University. We first met at BNKS."

Expected Output (example format):
{
  "summary": "User recounts meeting Jadon's brother Jimmy, whose wife Katie had a daughter. They attended a game. Mentions Jadon's transfer to Mankato State, prior residence at Pittman 216 at Main University, and meeting at BNKS.",
  "extractedEntities": {
    "people": ["Jadon", "Jimmy", "Katie"],
    "organizations": ["Mankato State", "Main University", "BNKS"],
    "relationships": ["Jadon's brother Jimmy", "Jimmy's wife Katie"],
    "dates": ["yesterday", "last week"],
    "locations": ["stadium", "Pittman 216"],
    "keyEvents": ["Katie just had a daughter", "went to the game", "Jadon transferred to Mankato State", "living in Pittman 216", "met at BNKS"]
  }
}

Provide the output as a JSON object matching the defined output schema.
`,
});

const processVoiceInputFlow = ai.defineFlow(
  {
    name: 'processVoiceInputFlow',
    inputSchema: ProcessVoiceInputInputSchema,
    outputSchema: ProcessVoiceInputOutputSchema,
  },
  async (input) => {
    const { output } = await processVoiceInputPrompt(input);
    if (!output) {
      throw new Error("AI failed to process voice input.");
    }
    return output;
  }
);
