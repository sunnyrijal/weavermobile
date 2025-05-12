'use server';
/**
 * @fileOverview A Genkit flow to answer questions about contacts based on provided contact data.
 *
 * - answerContactQuestion - A function that takes a question and a list of contacts and returns an answer.
 * - AnswerContactQuestionInput - The input type for the answerContactQuestion function.
 * - AnswerContactQuestionOutput - The return type for the answerContactQuestion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Contact } from '@/lib/types'; // Assuming Contact type is available
import { mockContacts } from '@/lib/mockData'; // Using mockContacts for data source

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

const AnswerContactQuestionInputSchema = z.object({
  question: z.string().describe('The user_s question about their contacts.'),
  // contacts will be passed internally after enrichment, not directly by the client component calling the flow.
});
export type AnswerContactQuestionInput = z.infer<typeof AnswerContactQuestionInputSchema>;


// The actual input to the prompt includes enriched contacts
const PromptInputSchema = AnswerContactQuestionInputSchema.extend({
    contacts: z.array(PromptContactSchema).describe('A list of contacts with their details.')
})

const AnswerContactQuestionOutputSchema = z.object({
  answer: z.string().describe('The AI_s answer to the question based on the provided contacts.'),
});
export type AnswerContactQuestionOutput = z.infer<typeof AnswerContactQuestionOutputSchema>;


export async function answerContactQuestion(input: AnswerContactQuestionInput): Promise<AnswerContactQuestionOutput> {
  // Enrich contacts with relatedContactName for the prompt
  const enrichedContacts = mockContacts.map(contact => {
    const contactRelationships = contact.relationships?.map(rel => {
      const relatedContact = mockContacts.find(c => c.id === rel.relatedContactId);
      return {
        ...rel,
        relatedContactName: relatedContact ? relatedContact.name : 'Unknown Contact',
      };
    }) || [];
    return {
      name: contact.name,
      email: contact.email || undefined,
      phone: contact.phone || undefined,
      occupation: contact.occupation || undefined,
      company: contact.company || undefined,
      college: contact.college || undefined,
      category: contact.category || undefined,
      hometown: contact.hometown || undefined,
      currentLocation: contact.currentLocation || undefined,
      birthday: contact.birthday || undefined,
      ownerRelationshipLabel: contact.ownerRelationshipLabel || undefined,
      notes: contact.notes || undefined,
      tags: contact.tags || [],
      relationships: contactRelationships,
    };
  });

  const {output} = await answerContactQuestionPrompt({
      question: input.question,
      contacts: enrichedContacts,
  });
  if (!output) {
    throw new Error("AI failed to generate an answer.");
  }
  return output;
}

const answerContactQuestionPrompt = ai.definePrompt({
  name: 'answerContactQuestionPrompt',
  input: { schema: PromptInputSchema }, // Use the schema that includes contacts
  output: { schema: AnswerContactQuestionOutputSchema },
  prompt: `You are a helpful AI assistant for NetworkNest. You have access to a list of the user's contacts.
Answer the user's question based *only* on the information provided in the contacts list.
If the information is not in the contacts list, say "I don't have that information in the contacts provided."
Do not make up information or use external knowledge.

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

// Example of defining a flow (optional for direct calls, but good for Genkit tooling)
/*
const answerContactQuestionFlowInternal = ai.defineFlow(
  {
    name: 'answerContactQuestionFlowInternal',
    inputSchema: AnswerContactQuestionInputSchema,
    outputSchema: AnswerContactQuestionOutputSchema,
  },
  async (input) => {
    // Enrichment logic from the answerContactQuestion function
    const enrichedContacts = mockContacts.map(contact => {
        const contactRelationships = contact.relationships?.map(rel => {
            const relatedContact = mockContacts.find(c => c.id === rel.relatedContactId);
            return {
                ...rel,
                relatedContactName: relatedContact ? relatedContact.name : 'Unknown Contact',
            };
        }) || [];
        return {
            name: contact.name,
            email: contact.email || undefined,
            phone: contact.phone || undefined,
            occupation: contact.occupation || undefined,
            company: contact.company || undefined,
            college: contact.college || undefined,
            category: contact.category || undefined,
            hometown: contact.hometown || undefined,
            currentLocation: contact.currentLocation || undefined,
            birthday: contact.birthday || undefined,
            ownerRelationshipLabel: contact.ownerRelationshipLabel || undefined,
            notes: contact.notes || undefined,
            tags: contact.tags || [],
            relationships: contactRelationships,
        };
    });

    const { output } = await answerContactQuestionPrompt({
        question: input.question,
        contacts: enrichedContacts,
    });
    if (!output) {
        throw new Error("AI failed to generate an answer.");
    }
    return output;
  }
);

// If using the registered flow, the exported function would change:
// export async function answerContactQuestion(input: AnswerContactQuestionInput): Promise<AnswerContactQuestionOutput> {
//   return answerContactQuestionFlowInternal(input);
// }
*/
