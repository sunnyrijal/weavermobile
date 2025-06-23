'use server';
/**
 * @fileOverview A Genkit flow to process voice transcripts, extract key entities,
 * and summarize the content as a memory.
 *
 * - processVoiceInput - A function that takes a voice transcript and returns a summary and extracted entities.
 * - ProcessVoiceInputInput - The input type for the processVoiceInput function.
 * - ProcessVoiceInputOutput - The return type for the processVoiceInput function.
 * - ExtractedEntities - The type for entities extracted from the transcript.
 */

import { ai } from '@/ai/genkit';
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
2. Extract key entities from the transcript with as much detail as possible.

Transcript:
"{{{transcript}}}"

For entity extraction, identify with great detail:
- People: Full names of individuals including first and last names when available.
- Organizations: Names of companies, schools, universities, etc. Be specific with full names.
- Relationships: Detailed phrases describing relationships (e.g., "John's brother", "Mary, wife of Peter", "roommate in college").
- Dates: Specific or relative dates. Format specific dates as YYYY-MM-DD if possible.
- Locations: Geographical places, addresses, or significant named locations. Include cities, states, countries when mentioned.
- KeyEvents: Significant happenings, life events, or activities with as much detail as possible.

Try to extract as much information as possible about each person mentioned, including:
- Their full name
- Their age if mentioned
- Their occupation or major if mentioned
- Their relationships to other people mentioned
- Where they live or are from
- Where they work or go to school
- Any other significant details

Example:
Transcript: "My roommate in freshman year of college was Jadon Kittelson, age 22. Comp Sci major, girlfriend Nickki Plukett, mom: Debbie Kittelson (also Gustavus Alumni), dad (Dave Kittleson), brother (Jimmy kittelson) Home: faribault, Minnesota. Currently goes to Mankato University"

Expected Output (example format):
{
  "summary": "The memory describes Jadon Kittelson, the user's college roommate. Jadon is 22, studies Computer Science, has a girlfriend named Nickki Plukett, and family including mom Debbie, dad Dave, and brother Jimmy. He's from Faribault, Minnesota and attends Mankato University.",
  "extractedEntities": {
    "people": ["Jadon Kittelson", "Nickki Plukett", "Debbie Kittelson", "Dave Kittleson", "Jimmy Kittelson"],
    "organizations": ["Gustavus", "Mankato University"],
    "relationships": ["roommate in freshman year of college", "girlfriend Nickki Plukett", "mom: Debbie Kittelson", "dad: Dave Kittleson", "brother: Jimmy Kittelson"],
    "dates": [],
    "locations": ["Faribault, Minnesota"],
    "keyEvents": ["Comp Sci major", "Currently goes to Mankato University"]
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
