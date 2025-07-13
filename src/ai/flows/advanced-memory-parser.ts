'use server';
/**
 * @fileOverview Advanced memory parser using Gemini Pro for sophisticated contact updates
 * 
 * This flow can handle:
 * - Multi-contact updates from single memory
 * - Relationship corrections and additions
 * - Event extraction and creation
 * - Contextual references and ambiguity resolution
 * - Complex corrections and updates
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input schema for advanced memory parsing
const AdvancedMemoryInputSchema = z.object({
  memory: z.string().describe('The user memory text to parse for contact updates'),
  existingContacts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    birthday: z.string().optional(),
    occupation: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    relationships: z.array(z.object({
      contactId: z.string(),
      type: z.string(),
      name: z.string()
    })).optional()
  })).optional().describe('Existing contacts for context and matching')
});

export type AdvancedMemoryInput = z.infer<typeof AdvancedMemoryInputSchema>;

// Output schema for complex contact updates
const ContactUpdateSchema = z.object({
  contactId: z.string().optional().describe('ID of existing contact to update, or null for new contact'),
  contactName: z.string().describe('Name of the contact being updated'),
  field: z.enum([
    'name', 'email', 'phone', 'birthday', 'occupation', 'company', 
    'location', 'notes', 'relationship', 'event', 'correction'
  ]).describe('Type of field being updated'),
  value: z.union([z.string(), z.object({}).passthrough()]).describe('New value for the field'),
  correction: z.boolean().default(false).describe('Whether this is correcting existing information'),
  confidence: z.number().min(0).max(1).describe('Confidence level of this update (0-1)'),
  context: z.string().optional().describe('Additional context about this update'),
  relationship: z.object({
    to: z.string().optional().describe('Name of related contact'),
    type: z.string().describe('Type of relationship'),
    isCorrection: z.boolean().default(false).describe('Whether this relationship is correcting existing info')
  }).optional().describe('Relationship information if this is a relationship update'),
  event: z.object({
    type: z.string().describe('Type of event (birthday, anniversary, meeting, etc.)'),
    date: z.string().optional().describe('Event date if mentioned'),
    description: z.string().optional().describe('Event description'),
    attendees: z.array(z.string()).optional().describe('Other people involved')
  }).optional().describe('Event information if this memory mentions an event')
});

const AdvancedMemoryOutputSchema = z.object({
  updates: z.array(ContactUpdateSchema).describe('Array of contact updates extracted from the memory'),
  newContacts: z.array(z.object({
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    birthday: z.string().optional(),
    occupation: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    relationships: z.array(z.object({
      name: z.string(),
      type: z.string()
    })).optional()
  })).describe('New contacts to create'),
  events: z.array(z.object({
    type: z.string(),
    date: z.string().optional(),
    description: z.string(),
    attendees: z.array(z.string())
  })).describe('Events to create'),
  confidence: z.number().min(0).max(1).describe('Overall confidence in the parsing'),
  ambiguity: z.array(z.string()).describe('List of ambiguous references that need clarification')
});

export type AdvancedMemoryOutput = z.infer<typeof AdvancedMemoryOutputSchema>;

export async function parseAdvancedMemory(input: AdvancedMemoryInput): Promise<AdvancedMemoryOutput> {
  return advancedMemoryParserFlow(input);
}

const advancedMemoryParserPrompt = ai.definePrompt({
  name: 'advancedMemoryParserPrompt',
  input: { schema: AdvancedMemoryInputSchema },
  output: { schema: AdvancedMemoryOutputSchema },
  prompt: `You are an advanced AI assistant specialized in parsing user memories for contact management updates. You can extract complex contact updates, relationship changes, corrections, and events from natural language.

Your task is to analyze the user's memory and extract all actionable contact updates, new contacts, relationships, corrections, and events.

## Memory to Parse:
"{{{memory}}}"

## Existing Contacts (for context):
{{{existingContacts}}}

## Instructions:

1. **Contact Updates**: Identify any updates to existing contacts (name corrections, new info, etc.)
2. **New Contacts**: Identify any new people mentioned who should be added
3. **Relationships**: Extract relationship information between contacts
4. **Corrections**: Detect when the user is correcting previous information
5. **Events**: Extract events like birthdays, anniversaries, meetings, etc.
6. **Context**: Use existing contacts to resolve ambiguous references like "her birthday" or "his brother"

## Output Format:
Return a JSON object with:
- updates: Array of specific contact field updates
- newContacts: Array of new contacts to create
- events: Array of events to create
- confidence: Overall confidence (0-1)
- ambiguity: List of ambiguous references needing clarification

## Examples:

Memory: "Ally's brother John's birthday is actually July 21, not July 20. Also, Ally's new email is ally@example.com."
Expected Updates:
- Update John's birthday to July 21 (correction)
- Update Ally's email to ally@example.com
- Establish brother relationship between Ally and John

Memory: "Met Sarah at the coffee shop. She works at Microsoft and her birthday is next week."
Expected Updates:
- Create new contact: Sarah
- Add company: Microsoft
- Create birthday event for next week
- Add location context: coffee shop

Memory: "Actually, her name is spelled Ally, not Allie. And she's my cousin, not my sister."
Expected Updates:
- Correct name spelling: Ally (correction)
- Update relationship: cousin (correction)

Provide the output as a JSON object matching the defined schema. Be thorough but only include information that is clearly stated or strongly implied in the memory.`
});

const advancedMemoryParserFlow = ai.defineFlow(
  {
    name: 'advancedMemoryParserFlow',
    inputSchema: AdvancedMemoryInputSchema,
    outputSchema: AdvancedMemoryOutputSchema,
  },
  async (input) => {
    const { output } = await advancedMemoryParserPrompt(input);
    if (!output) {
      throw new Error("AI failed to parse advanced memory information.");
    }
    return output;
  }
); 