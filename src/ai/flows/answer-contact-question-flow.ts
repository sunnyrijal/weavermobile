'use server';
/**
 * @fileOverview A Genkit flow to answer questions about contacts based on provided contact data.
 *
 * - answerContactQuestion - A function that takes a question and a list of contacts and returns an answer.
 * - AnswerContactQuestionInput - The input type for the answerContactQuestion function (now equivalent to PromptInput).
 * - AnswerContactQuestionOutput - The return type for the answerContactQuestion function.
 * - PromptContact - The type for enriched contact data expected by the prompt.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
// mockContacts is no longer used directly in this flow for data sourcing.
// The caller (e.g., dashboard) will provide the contacts.

// Define a Zod schema for the enriched contact structure used in the prompt
const PromptContactSchema = z.object({
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  occupation: z.string().optional(),
  company: z.string().optional(),
  college: z.string().optional(),
  category: z.string().optional(),
  hometown: z.string().optional(),
  currentLocation: z.string().optional(),
  birthday: z.string().optional(), // Assuming birthday is pre-formatted
  ownerRelationshipLabel: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  relationships: z.array(z.object({
    relatedContactName: z.string(),
    type: z.string(),
    customLabel: z.string().optional(),
  })).optional(),
});
export type PromptContact = z.infer<typeof PromptContactSchema>;


// The input to the flow now includes the question and the (already enriched) contacts.
const AnswerContactQuestionInputSchema = z.object({
  question: z.string().describe('The user_s question about their contacts.'),
  contacts: z.array(PromptContactSchema).describe('A list of contacts with their details, already enriched.')
});
export type AnswerContactQuestionInput = z.infer<typeof AnswerContactQuestionInputSchema>;


const AnswerContactQuestionOutputSchema = z.object({
  answer: z.string().describe('The AI_s answer to the question based on the provided contacts.'),
});
export type AnswerContactQuestionOutput = z.infer<typeof AnswerContactQuestionOutputSchema>;


export async function answerContactQuestion(input: AnswerContactQuestionInput): Promise<AnswerContactQuestionOutput> {
  // Contacts are now passed directly in `input.contacts`. No internal enrichment needed here.
  const {output} = await answerContactQuestionPrompt({
      question: input.question,
      contacts: input.contacts, // Use contacts from input
  });
  if (!output) {
    throw new Error("AI failed to generate an answer.");
  }
  return output;
}

const answerContactQuestionPrompt = ai.definePrompt({
  name: 'answerContactQuestionPrompt',
  input: { schema: AnswerContactQuestionInputSchema }, // Uses the schema that includes contacts
  output: { schema: AnswerContactQuestionOutputSchema },
  prompt: `You are a helpful AI assistant for NetworkNest. You have access to a list of the user's contacts.
Answer the user's question based *only* on the information provided in the contacts list.
If the information is not in the contacts list, say "I don't have that information in the contacts provided."
Do not make up information or use external knowledge.

If the question is about a person's pet (e.g., "Sam's dog name?"), look for relationships of type "Pet" associated with that person. The pet's name will be the name of the related contact. Also consider contacts with category "Pet".
If the question is about a person's partner (e.g., "Who is Chandra's partner?"), look for relationships of type "Partner".

RESPONSE FORMATTING RULES:

1. For general questions about a person (e.g., "Tell me about Alice" or "What do you know about John?"), use the full format:
Name of the person
Birthday: [date if available]
📱 [phone if available]
💼 [job/occupation if available]
🎓 [college if available]
🏠 [hometown if available]
📍 [current location if available]
Relationship: [relationship label if available]
Notes: [notes if available]
Notable events: [list any notable events, birthdays, anniversaries, etc. if available]
Other Contact: [list related contacts with their relationship type, e.g., "Netra P rijal (husband), Prasanna Rijal (Son)"]

2. For specific questions, give only the relevant answer:
- "Alice birthday" → "Alice's birthday: [date]"
- "Alice home" → "Alice's hometown: [hometown] | Current location: [current location]"
- "Alice phone" → "Alice's phone: [phone number]"
- "Alice job" → "Alice's occupation: [job/occupation]"
- "Alice college" → "Alice's college: [college]"

3. For relationship questions, be bidirectional:
- "Alice dad" → "Alice's dad: [dad's name]"
- "Bruce Lipton" (when Bruce is Alice's dad) → "Bruce Lipton: Alice's dad"
- "Alice partner" → "Alice's partner: [partner's name]"
- "John Smith" (when John is Alice's partner) → "John Smith: Alice's partner"

4. If the user query is just a name (e.g., "arsene", "Alice", "John"):
   a) If the person is related to a main contact (has relationships pointing TO them), start with the relationship context:
      [Main Contact's Name]'s [Relationship Type]: [Person's Name]
      Then provide full profile information using the format from rule #1
   
   b) If the person is a main contact (no relationships pointing TO them), provide full profile information using the format from rule #1

5. For questions about multiple people or comparisons, provide concise answers focusing on the specific information requested.

If any field is not available in the contact data, omit that line entirely or say "Not available" for specific questions.

User's Question: "{{{question}}}"

Here are the contacts you have access to:
{{#if contacts}}
  {{#each contacts}}
    Name: {{{this.name}}}
    {{#if this.email}}Email: {{{this.email}}}{{/if}}
    {{#if this.phone}}Phone: {{{this.phone}}}{{/if}}
    {{#if this.occupation}}Occupation: {{{this.occupation}}}{{/if}}
    {{#if this.company}}Company: {{{this.company}}}{{/if}}
    {{#if this.college}}College: {{{this.college}}}{{/if}}
    {{#if this.category}}Category: {{{this.category}}}{{/if}}
    {{#if this.hometown}}Hometown: {{{this.hometown}}}{{/if}}
    {{#if this.currentLocation}}Current Location: {{{this.currentLocation}}}{{/if}}
    {{#if this.birthday}}Birthday: {{{this.birthday}}}{{/if}}
    {{#if this.ownerRelationshipLabel}}User's Relationship: {{{this.ownerRelationshipLabel}}}{{/if}}
    {{#if this.notes}}Notes: {{{this.notes}}}{{/if}}
    {{#if this.tags.length}}
        Tags: {{#each this.tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
    {{/if}}
    {{#if this.relationships.length}}
        Relationships:
        {{#each this.relationships}}
            - Related to: {{this.relatedContactName}} (Type: {{this.type}}{{#if this.customLabel}}, Label: {{this.customLabel}}{{/if}})
        {{/each}}
    {{/if}}
    ---
  {{/each}}
{{else}}
  You have no contacts in your list.
{{/if}}

Answer:
`,
});

// The flow definition can now use AnswerContactQuestionInputSchema directly
const answerContactQuestionFlowInternal = ai.defineFlow(
  {
    name: 'answerContactQuestionFlowInternal',
    inputSchema: AnswerContactQuestionInputSchema, // Use the schema that expects question and contacts
    outputSchema: AnswerContactQuestionOutputSchema,
  },
  async (input) => {
    const { output } = await answerContactQuestionPrompt(input); // Pass input directly
    if (!output) {
        throw new Error("AI failed to generate an answer.");
    }
    return output;
  }
);

// The exported function can call the flow if preferred for Genkit tooling, or call prompt directly.
// For consistency with other flows, let's make the exported function call the defined flow.
// export async function answerContactQuestion(input: AnswerContactQuestionInput): Promise<AnswerContactQuestionOutput> {
//   return answerContactQuestionFlowInternal(input);
// }
// Keeping direct prompt call for now as per original structure, but the input schema is key.
// The internal flow definition is not strictly necessary if the exported function calls the prompt directly.
// The important part is that `answerContactQuestionPrompt` is called with `input.contacts`.
