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
1. **MANDATORY**: Provide a concise summary of the memory.
2. Extract key entities from the transcript with as much detail as possible.

Transcript:
"{{{transcript}}}"

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

Example:
Transcript: "I met Jake, my freshman year of college. Same dorm building (pittman), he is from Kansas, but now lives in Minneapolis. He took accounting and is CPA now. His full name Jacob Lucas. His girlfriend Sydney. brother Marty Lucas. Plays tennis. birthday feb 25. he is 23 yrs old."

Expected Output (example format):
{
  "summary": "The memory describes meeting Jacob Lucas (nickname Jake) in freshman year of college. He's from Kansas but now lives in Minneapolis, works as a CPA after studying accounting. He has a girlfriend named Sydney and a brother named Marty Lucas. He plays tennis and his birthday is February 25th, age 23.",
  "extractedEntities": {
    "people": ["Jacob Lucas", "Sydney", "Marty Lucas"],
    "organizations": ["college"],
    "relationships": ["roommate in freshman year of college", "girlfriend Sydney", "brother Marty Lucas"],
    "dates": ["2001-02-25"],
    "locations": ["Kansas", "Minneapolis"],
    "keyEvents": ["took accounting", "is CPA now", "plays tennis"]
  }
}

**MANDATORY OUTPUT FORMAT:**
- You MUST include a "summary" field
- You MUST remove all duplicates from all arrays
- You MUST return valid JSON matching the schema exactly

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

    // Post-process to ensure clean data
    const cleanedOutput = {
      summary: output.summary || `Memory about: ${input.transcript.slice(0, 100)}...`,
      extractedEntities: {
        people: [...new Set(output.extractedEntities?.people || [])],
        organizations: [...new Set(output.extractedEntities?.organizations || [])],
        relationships: [...new Set(output.extractedEntities?.relationships || [])],
        dates: [...new Set(output.extractedEntities?.dates || [])],
        locations: [...new Set(output.extractedEntities?.locations || [])],
        keyEvents: [...new Set(output.extractedEntities?.keyEvents || [])]
      }
    };

    return cleanedOutput;
  }
);
