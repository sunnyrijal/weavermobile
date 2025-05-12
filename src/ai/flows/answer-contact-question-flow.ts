'use server';
/**
 * @fileOverview A Genkit flow to answer user questions about their contacts
 * based on the provided mock contact data.
 *
 * - answerContactQuestion - A function that takes a user's question and returns an answer.
 * - AnswerContactQuestionInput - The input type for the answerContactQuestion function.
 * - AnswerContactQuestionOutput - The return type for the answerContactQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { mockContacts } from '@/lib/mockData';
import type { Contact, Relationship, NotableEvent } from '@/lib/types';

// Define a schema for enriched relationship data for the prompt
const EnrichedRelationshipSchema = z.object({
  relatedContactId: z.string(),
  type: z.string(),
  customLabel: z.string().optional(),
  relatedContactName: z.string(),
});

// Define a schema for enriched contact data for the prompt
const EnrichedContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  occupation: z.string().optional(),
  company: z.string().optional(),
  category: z.string().optional(),
  ownerRelationshipLabel: z.string().optional(),
  hometown: z.string().optional(),
  currentLocation: z.string().optional(),
  birthday: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  college: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()),
  relationships: z.array(EnrichedRelationshipSchema),
  notableEvents: z.array(z.object({
    id: z.string(),
    title: z.string(),
    date: z.string(),
    description: z.string().optional(),
  })).optional(),
});


const AnswerContactQuestionInputSchema = z.object({
  question: z.string().describe("The user's question about their contacts."),
});
export type AnswerContactQuestionInput = z.infer<typeof AnswerContactQuestionInputSchema>;

const AnswerContactQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the user\'s question based on their contact data.'),
});
export type AnswerContactQuestionOutput = z.infer<typeof AnswerContactQuestionOutputSchema>;

// Internal schema for the prompt's input context
const PromptInputSchema = z.object({
    question: z.string(),
    contacts: z.array(EnrichedContactSchema),
});


export async function answerContactQuestion(input: AnswerContactQuestionInput): Promise<AnswerContactQuestionOutput> {
  return answerContactQuestionFlow(input);
}

const answerContactQuestionPrompt = ai.definePrompt({
  name: 'answerContactQuestionPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: AnswerContactQuestionOutputSchema},
  prompt: `You are a helpful personal assistant for the NetworkNest application. Your role is to answer questions about the user's contacts based SOLELY on the contact data provided below. Do not make up information or answer questions outside of this contact data. If the information is not available in the contacts, clearly state that you don't have that information.

User's Question: {{{question}}}

Contact Data:
{{#each contacts}}
Name: {{this.name}} (ID: {{this.id}})
{{#if this.occupation}}Occupation: {{this.occupation}}{{/if}}
{{#if this.company}}Company: {{this.company}}{{/if}}
{{#if this.category}}Category: {{this.category}}{{/if}}
{{#if this.ownerRelationshipLabel}}User's Relationship to this contact: {{this.ownerRelationshipLabel}}{{/if}}
{{#if this.hometown}}Hometown: {{this.hometown}}{{/if}}
{{#if this.currentLocation}}Current Location: {{this.currentLocation}}{{/if}}
{{#if this.birthday}}Birthday: {{this.birthday}} (YYYY-MM-DD format){{/if}}
{{#if this.email}}Email: {{this.email}}{{/if}}
{{#if this.phone}}Phone: {{this.phone}}{{/if}}
{{#if this.college}}College: {{this.college}}{{/if}}
{{#if this.notes}}Notes: {{this.notes}}{{/if}}
{{#if this.tags.length}}Tags: {{#each this.tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if this.relationships.length}}
Relationships:
{{#each this.relationships}}
  - {{this.type}}{{#if this.customLabel}} ({{this.customLabel}}){/if}} with {{this.relatedContactName}} (ID: {{this.relatedContactId}})
{{/each}}
{{/if}}
{{#if this.notableEvents.length}}
Notable Events:
{{#each this.notableEvents}}
  - {{this.title}} on {{this.date}}{{#if this.description}}: {{this.description}}{{/if}}
{{/each}}
{{/if}}
---
{{/each}}

Based on the contact data, answer the user's question. Be concise and directly answer the question. If you cannot find the answer, say "I do not have that information in the contacts."
`,
});

const answerContactQuestionFlow = ai.defineFlow(
  {
    name: 'answerContactQuestionFlow',
    inputSchema: AnswerContactQuestionInputSchema,
    outputSchema: AnswerContactQuestionOutputSchema,
  },
  async (input) => {
    const contactsById = mockContacts.reduce((acc, contact) => {
      acc[contact.id] = contact;
      return acc;
    }, {} as Record<string, Contact>);

    const enrichedContacts = mockContacts.map(contact => ({
      ...contact,
      relationships: contact.relationships.map(rel => ({
        ...rel,
        relatedContactName: contactsById[rel.relatedContactId]?.name || 'Unknown Contact',
      })),
      // Ensure notableEvents is an array, even if undefined on original contact
      notableEvents: contact.notableEvents || [], 
      // Ensure tags is an array
      tags: contact.tags || [],
    }));

    const {output} = await answerContactQuestionPrompt({
        question: input.question,
        contacts: enrichedContacts,
    });
    
    if (!output) {
        return { answer: "Sorry, I couldn't process that question." };
    }
    return output;
  }
);
