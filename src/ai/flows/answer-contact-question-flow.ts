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
  major: z.string().optional(),
  category: z.string().optional(),
  hometown: z.string().optional(),
  currentLocation: z.string().optional(),
  birthday: z.string().optional(), // Assuming birthday is pre-formatted
  ownerRelationshipLabel: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  relationships: z.array(z.object({
    relatedContactName: z.string(),
    type: z.string(),
    customLabel: z.string().optional(),
  })).optional(),
  // Basic information fields
  height: z.string().optional(),
  eyeColor: z.string().optional(),
  hairColor: z.string().optional(),
  bodyType: z.string().optional(),
  dressingStyle: z.string().optional(),
  skinTone: z.string().optional(),
  ethnicity: z.string().optional(),
  facialFeatures: z.string().optional(),
  distinguishingFeatures: z.string().optional(),
  voice: z.string().optional(),
  accent: z.string().optional(),
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
  try {
    const {output} = await answerContactQuestionPrompt({
        question: input.question,
        contacts: input.contacts,
    });
    if (output && output.answer) {
      return output;
    }
  } catch (err) {
    console.warn("Gemini AI API call failed or blocked (403 Forbidden), using local intelligent contact search fallback:", err);
  }

  // Smart local fallback when AI API is blocked or offline
  const qLower = input.question.toLowerCase();
  const matchedContacts = input.contacts.filter(c => {
    const nameMatch = c.name?.toLowerCase().includes(qLower);
    const occMatch = c.occupation?.toLowerCase().includes(qLower);
    const compMatch = c.company?.toLowerCase().includes(qLower);
    const locMatch = c.currentLocation?.toLowerCase().includes(qLower) || c.hometown?.toLowerCase().includes(qLower);
    const categoryMatch = c.category?.toLowerCase().includes(qLower);
    const notesMatch = c.notes?.toLowerCase().includes(qLower);
    
    // Check question words against contact properties
    const words = qLower.split(/\s+/).filter(w => w.length > 2 && !['who', 'what', 'where', 'when', 'is', 'the', 'are', 'live', 'work', 'my', 'contact', 'contacts', 'about', 'tell', 'me', 'which', 'has', 'in'].includes(w));
    const wordMatches = words.some(w => 
      c.name?.toLowerCase().includes(w) || 
      c.occupation?.toLowerCase().includes(w) ||
      c.company?.toLowerCase().includes(w) ||
      c.currentLocation?.toLowerCase().includes(w) ||
      c.hometown?.toLowerCase().includes(w) ||
      c.notes?.toLowerCase().includes(w)
    );

    return nameMatch || occMatch || compMatch || locMatch || categoryMatch || notesMatch || wordMatches;
  });

  if (matchedContacts.length === 0) {
    return {
      answer: "I checked your contacts, but I couldn't find relevant details matching your question."
    };
  }

  const details = matchedContacts.slice(0, 5).map(c => {
    const parts = [
      `📌 **${c.name}** (${c.category || 'Contact'})`,
      c.occupation ? `Occupation: ${c.occupation}` : null,
      c.company ? `Company: ${c.company}` : null,
      c.currentLocation ? `Location: ${c.currentLocation}` : null,
      c.hometown ? `Hometown: ${c.hometown}` : null,
      c.birthday ? `Birthday: ${c.birthday}` : null,
      c.notes ? `Notes: ${c.notes.slice(0, 150)}` : null,
    ].filter(Boolean);
    return parts.join('\n  • ');
  }).join('\n\n');

  return {
    answer: `Here is what I found in your contacts:\n\n${details}`
  };
}

const answerContactQuestionPrompt = ai.definePrompt({
  name: 'answerContactQuestionPrompt',
  input: { schema: AnswerContactQuestionInputSchema }, // Uses the schema that includes contacts
  output: { schema: AnswerContactQuestionOutputSchema },
  prompt: `You are a helpful AI assistant for NetworkNest. You have access to a list of the user's contacts.
Answer the user's question based *only* on the information provided in the contacts list.
If the information is not in the contacts list, say "I don't have that information in the contacts provided."
Do not make up information or use external knowledge.

**CRITICAL: Always provide consistent, detailed responses. For location-based questions, always use the full profile format with proper line breaks. Never give short, inconsistent answers.**

If the question is about a person's pet (e.g., "Sam's dog name?"), look for relationships of type "Pet" associated with that person. The pet's name will be the name of the related contact. Also consider contacts with category "Pet".
If the question is about a person's partner (e.g., "Who is Chandra's partner?"), look for relationships of type "Partner".

AGE CALCULATION: When asked about someone's age, calculate it from their birthday if available. The birthday format is YYYY-MM-DD. Calculate the current age and respond with "X years old" or "X year old" for single year. IMPORTANT: If you have a birthday, you MUST calculate the age. Do not say "I don't have that information" if you have a birthday field.

RESPONSE FORMATTING RULES:

1. For general questions about a person (e.g., "Tell me about Alice" or "What do you know about John?"), use the full format:
Name: [person's name]
Nickname: [nickname if available]
Age: [calculated age from birthday if available]
Birthday: [birthday if available]
Job: [occupation if available]
Hometown: [hometown if available]
Current Location: [current location if available]
Major: [major/field of study if available]
Relationship: [user's relationship to this person if available]
Notes: [notes if available]
Relationships: [list related contacts with their relationship type, e.g., "Nickki Plukett (Partner), Debbie Kittelson (Family), Dave Kittleson (Family), Jimmy Kittelson (Family)"]

2. For specific questions, give only the relevant answer:
- "Alice birthday" → "Alice's birthday: [date]"
- "Alice age" → "Alice's age: [calculated age] years old" (calculate from birthday if available)
- "Alice home" → "Alice's hometown: [hometown] | Current location: [current location]"
- "Alice phone" → "Alice's phone: [phone number]"
- "Alice job" → "Alice's occupation: [job/occupation]"
- "Alice college" → "Alice's college: [college]"
- "Alice major" → "Alice's major: [major/field of study]"
- "Alice relationship" → "Alice's relationship: [user's relationship to Alice]"
- "Alice height" or "how tall is Alice" → "Alice's height: [height]"
- "Alice eye color" → "Alice's eye color: [eye color]"
- "Alice hair color" → "Alice's hair color: [hair color]"
- "Alice body type" → "Alice's body type: [body type]"
- "Alice dressing style" → "Alice's dressing style: [dressing style]"

3. For relationship questions, be bidirectional:
- "Alice dad" → "Alice's dad: [dad's name]"
- "Bruce Lipton" (when Bruce is Alice's dad) → "Bruce Lipton is Alice's dad"
- "Alice partner" → "Alice's partner: [partner's name]"
- "John Smith" (when John is Alice's partner) → "John Smith is Alice's partner"
- "who is Dave?" (when Dave is someone's father) → "Dave is [person]'s father"
- For family relationships, group them: "Family: [list all family members]"
- For partners, use: "Partner: [partner's name]"

4. If the user query is just a name (e.g., "arsene", "Alice", "John"):
   a) If the person is related to a main contact (has relationships pointing TO them), start with the relationship context:
      [Person's Name] is [Main Contact's Name]'s [Relationship Type]
      Then provide full profile information using the format from rule #1
   
   b) If the person is a main contact (no relationships pointing TO them), provide full profile information using the format from rule #1

5. For questions about multiple people or comparisons, provide concise answers focusing on the specific information requested.

6. For location-based questions (e.g., "who do I know in Seattle?", "who lives in New York?"):
   a) First, list the people in that location with a brief statement
   b) Then provide detailed profiles for each person using the full format from rule #1
   c) Use this exact format:
      [Person's Name] is in [Location].
      
      [Person's Name]'s profile:
      Name: [person's name]
      Age: [calculated age from birthday if available]
      Birthday: [birthday if available]
      Job: [occupation if available]
      Company: [company if available]
      Hometown: [hometown if available]
      Current Location: [current location if available]
      Major: [major/field of study if available]
      Relationship: [user's relationship to this person if available]
      Notes: [notes if available]
      Relationships: [list related contacts with their relationship type]

**IMPORTANT FORMATTING RULES:**
- Do NOT include "(Met)" or "(Processed)" in the name
- Do NOT include "is User's Friend" or similar phrases
- Do NOT include "Notable events" section - birthdays should be in the Birthday field
- Always calculate and show age when birthday is available
- Use the exact format specified above
- Only include fields that are available
- For age calculation, use the birthday format YYYY-MM-DD to calculate current age
- For location questions, ALWAYS use the detailed profile format with line breaks
- Be consistent - give the same detailed response every time for the same question
- Example for "who do I know in Seattle?":
  Ally is in Seattle.
  
  Ally's profile:
  Name: Ally
  Age: 22 years old
  Birthday: 2001-08-01
  Job: Software Engineer
  Company: Tech Solutions Inc.
  Hometown: Portland, OR
  Current Location: Seattle, WA
  Major: Arizona State University
  Relationship: My college roommate
  Notes: Ally likes to go on vacation, especially Kayaking and sailing. She wants to go running together sometime.
  Relationships: None

User's Question: "{{{question}}}"

Here are the contacts you have access to:
{{#if contacts}}
  {{#each contacts}}
    Name: {{{this.name}}}
    {{#if this.nickname}}Nickname: {{{this.nickname}}}{{/if}}
    {{#if this.birthday}}Birthday: {{{this.birthday}}}{{/if}}
    {{#if this.email}}Email: {{{this.email}}}{{/if}}
    {{#if this.phone}}Phone: {{{this.phone}}}{{/if}}
    {{#if this.occupation}}Occupation: {{{this.occupation}}}{{/if}}
    {{#if this.company}}Company: {{{this.company}}}{{/if}}
    {{#if this.college}}College: {{{this.college}}}{{/if}}
    {{#if this.major}}Major: {{{this.major}}}{{/if}}
    {{#if this.category}}Category: {{{this.category}}}{{/if}}
    {{#if this.hometown}}Hometown: {{{this.hometown}}}{{/if}}
    {{#if this.currentLocation}}Current Location: {{{this.currentLocation}}}{{/if}}
    {{#if this.ownerRelationshipLabel}}User's Relationship: {{{this.ownerRelationshipLabel}}}{{/if}}
    {{#if this.notes}}Notes: {{{this.notes}}}{{/if}}
    {{#if this.interests.length}}
        Interests: {{#each this.interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
    {{/if}}
    {{#if this.relationships.length}}
        Relationships:
        {{#each this.relationships}}
            - {{this.relatedContactName}} ({{this.type}}{{#if this.customLabel}}: {{this.customLabel}}{{/if}})
        {{/each}}
    {{/if}}
    {{#if this.height}}Height: {{{this.height}}}{{/if}}
    {{#if this.eyeColor}}Eye Color: {{{this.eyeColor}}}{{/if}}
    {{#if this.hairColor}}Hair Color: {{{this.hairColor}}}{{/if}}
    {{#if this.bodyType}}Body Type: {{{this.bodyType}}}{{/if}}
    {{#if this.dressingStyle}}Dressing Style: {{{this.dressingStyle}}}{{/if}}
    {{#if this.skinTone}}Skin Tone: {{{this.skinTone}}}{{/if}}
    {{#if this.ethnicity}}Ethnicity: {{{this.ethnicity}}}{{/if}}
    {{#if this.facialFeatures}}Facial Features: {{{this.facialFeatures}}}{{/if}}
    {{#if this.distinguishingFeatures}}Distinguishing Features: {{{this.distinguishingFeatures}}}{{/if}}
    {{#if this.voice}}Voice: {{{this.voice}}}{{/if}}
    {{#if this.accent}}Accent: {{{this.accent}}}{{/if}}
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
