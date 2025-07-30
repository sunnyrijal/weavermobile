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
    'name', 'nickname', 'email', 'phone', 'birthday', 'occupation', 'company', 
    'location', 'hometown', 'college', 'notes', 'relationship', 'event', 'correction'
  ]).describe('Type of field being updated'),
  value: z.any().describe('New value for the field'),
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
  updates: z.array(ContactUpdateSchema).optional().default([]).describe('Array of contact updates extracted from the memory'),
  newContacts: z.array(z.object({
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    birthday: z.string().optional(),
    occupation: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    hometown: z.string().optional(),
    currentLocation: z.string().optional(),
    college: z.string().optional(),
    notes: z.string().optional(),
    relationships: z.array(z.object({
      name: z.string(),
      type: z.string()
    })).optional()
  })).optional().default([]).describe('New contacts to create'),
  events: z.array(z.object({
    type: z.string(),
    date: z.string().optional(),
    description: z.string(),
    attendees: z.array(z.string())
  })).optional().default([]).describe('Events to create'),
  confidence: z.number().min(0).max(1).optional().default(0.5).describe('Overall confidence in the parsing'),
  ambiguity: z.array(z.string()).optional().default([]).describe('List of ambiguous references that need clarification')
});

export type AdvancedMemoryOutput = z.infer<typeof AdvancedMemoryOutputSchema>;

// Updated: 2024-06-09

function formatBirthday(birthday: string | undefined, age: number | undefined, currentYear: number): string | undefined {
  if (!birthday) return undefined;
  // If birthday is in "0000-MM-DD" or "YYYY-MM-DD" format
  const match = birthday.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    let year = match[1];
    const month = match[2];
    const day = match[3];
    if ((year === "0000" || year === "1970") && age) {
      year = String(currentYear - age);
    }
    // Convert to "Feb 25, 2002"
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[parseInt(month, 10) - 1];
    return `${monthName} ${parseInt(day, 10)}, ${year}`;
  }
  // If birthday is already in "Feb 25" format and age is present
  if (age && !/\d{4}/.test(birthday)) {
    return `${birthday}, ${currentYear - age}`;
  }
  return birthday;
}

export async function parseAdvancedMemory(text: string, userProfile: { college?: string }, currentYear: number = 2025): Promise<ParseResult> {
  // 1. Person and nickname resolution
  const { persons, name_map } = await callPersonResolution(text);
  console.log('name_map:', name_map);

  // 2. Fact extraction (Holmes)
  const holmesFacts = await callHolmesExtractor(text, Object.keys(name_map));
  console.log('holmesFacts:', holmesFacts);

  // 3. Relationship extraction (GLiREL)
  const glirelRels = await callGLiREL(text, Object.keys(name_map));
  console.log('glirelRels:', glirelRels);

  // 4. Build contact_updates
  const contact_updates: ContactUpdate[] = [];
  for (const [canonicalName, meta] of Object.entries(name_map)) {
    const facts = holmesFacts.facts[canonicalName] || {};
    const age = facts.age ? parseInt(facts.age) : undefined;
    const birthday = formatBirthday(facts.birthday, age, currentYear);
    const college = facts.college || (/freshman year of college|dorm/i.test(text) ? userProfile.college : undefined);
    const relationships = (glirelRels.relationships || [])
      .filter((rel: any) => rel.from === canonicalName)
      .map((rel: any) => ({
        person_name: rel.to,
        relationship_type: rel.type,
      }));
    const notable_events = [];
    if (/met.*freshman year/i.test(text)) {
      notable_events.push({ event_description: 'met user freshman year of college', date: null });
    }
    contact_updates.push({
      name: canonicalName,
      nickname: meta.nickname,
      is_new_contact: true,
      extracted_info: {
        age,
        birthday,
        hometown: facts.hometown,
        current_location: facts.current_location,
        college,
        major: facts.major,
        occupation: facts.occupation,
        interests: facts.interests ? [facts.interests] : [],
        notes: facts.notes,
        relationships,
        notable_events,
      },
    });
  }
  console.log('contact_updates:', contact_updates);
  const general_journal_notes = text;
  return { contact_updates, general_journal_notes };
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
   - **BIRTHDAY EXTRACTION**: If you see "age X" for an existing contact, create a birthday update with the calculated date
2. **New Contacts**: Identify any new people mentioned who should be added. 
   - **CRITICAL NAME RESOLUTION**: When a person is mentioned with both a nickname and full name, create ONLY ONE contact with the full name and set the nickname field. For example:
     - "Jake" and "Jacob Lucas" → Create ONE contact: name: "Jacob Lucas", nickname: "Jake"
     - "Mike" and "Michael Smith" → Create ONE contact: name: "Michael Smith", nickname: "Mike"
     - "Sarah" and "Sarah Johnson" → Create ONE contact: name: "Sarah Johnson" (no nickname needed)
   - If a person is mentioned in the memory and they are NOT in the existing contacts list, create them as a NEW contact
   - Only use the "updates" array for people who already exist in the contacts list
   - Use "newContacts" array for ALL new people mentioned
3. **Age Extraction**: When you see "age X" or "X years old", extract this as a birthday field. Calculate the birthday by subtracting the age from the current year (2025). For example:
   - "age 22" → birthday: "2003-01-01" (assuming they are 22 in 2025)
   - "25 years old" → birthday: "2000-01-01" (assuming they are 25 in 2025)
   - Use January 1st as the default date when only age is given
   - **CRITICAL**: If you see "age 22" for a person, you MUST create a birthday field with the calculated date
   - **MANDATORY**: Every time you see "age X" in the memory, you MUST extract it as a birthday field
4. **Occupation/Major**: Extract academic majors (e.g., "Comp Sci major") as occupation field
5. **Nicknames**: If a nickname is mentioned (e.g., "Jake is from..."), extract it as a 'nickname' field, but do NOT overwrite the full name unless the memory is a correction (e.g., "her name is actually...").
6. **Hometown vs. Current Location**: 
   - If the memory says "from [place]" or "Home: [place]", treat it as 'hometown'
   - If it says "lives in [place]" or "Currently goes to [place]", treat it as 'currentLocation'
   - If it says "currently attends [university]", treat it as 'college'
7. **Family Relationships**: Extract family relationships with proper types. Each person should be a SEPARATE contact:
   - "mom: [name]" → Create separate contact for [name] with relationship type "Parent" (Mother)
   - "dad [name]" → Create separate contact for [name] with relationship type "Parent" (Father)
   - "brother [name]" → Create separate contact for [name] with relationship type "Sibling" (Brother)
   - "girlfriend [name]" → Create separate contact for [name] with relationship type "Partner"
   - "boyfriend [name]" → Create separate contact for [name] with relationship type "Partner"
   - **IMPORTANT**: Do NOT create self-referential relationships (e.g., "Jadon Kittelson" related to "Jadon Kittelson")
   - **IMPORTANT**: If a person already exists in the contacts list, use "updates" array instead of "newContacts"
8. **Corrections**: Detect when the user is correcting previous information
9. **Events**: Only extract real events that have a specific date, such as birthdays, anniversaries, or scheduled meetings. Do NOT include academic majors, alumni status, current activities, or descriptors as events. Ignore any event that does not have a valid date. Do NOT treat tags, descriptors, or academic statuses as events.
10. **Context**: Use existing contacts to resolve ambiguous references like "her birthday" or "his brother"
11. **College/University Understanding**: 
    - "Gustie Alumni" or "Gustavus Alumni" → college: "Gustavus Adolphus College"
    - If "Gustie" is mentioned without context, use "Gustie Alumni" as college
    - "Mankato University" → college: "Mankato University"

## CRITICAL RULES:
- **NAME RESOLUTION**: When the same person is mentioned with both a nickname and full name, create ONLY ONE contact with the full name and nickname field
- Each person mentioned should be a SEPARATE contact in the newContacts array
- **NAMES MUST BE CLEAN**: Use only the person's actual name, no extra words like "(The)", "the", etc.
- **EXAMPLES OF CORRECT NAMES**: "Jacob Lucas", "Sydney", "Marty Lucas"
- **EXAMPLES OF INCORRECT NAMES**: "Jake (The)", "the Sydney", "Marty Lucas (The)"
- **STRICT NAME RULE**: NEVER add "(The)" or any other words to names. Use ONLY the person's actual name.
- **ONLY CREATE CONTACTS FOR PEOPLE EXPLICITLY MENTIONED**: Do not create contacts for people not mentioned in the memory.
- **RELATIONSHIP DIRECTION**: When creating relationships, the direction should be FROM the person TO their relative:
  - If "mom: Debbie Kittelson" is mentioned for Jadon, then Debbie should have a relationship TO Jadon with type "Parent"
  - If "brother: Jimmy Kittelson" is mentioned for Jadon, then Jimmy should have a relationship TO Jadon with type "Sibling"
  - The relationship type should reflect the relative's role TO the main person
  - **CORRECT EXAMPLE**: If memory says "Jadon's mom is Debbie", then Debbie's relationship to Jadon should be "Parent"
  - **CORRECT EXAMPLE**: If memory says "Jadon's brother is Jimmy", then Jimmy's relationship to Jadon should be "Sibling"
  - **CORRECT EXAMPLE**: If memory says "Jadon's girlfriend is Nickki", then Nickki's relationship to Jadon should be "Partner"

## Output Format:
Return a JSON object with:
- updates: Array of specific contact field updates
- newContacts: Array of new contacts to create (ONE PER PERSON)
- events: Array of events to create (ONLY real events with a valid date)
- confidence: Overall confidence (0-1)
- ambiguity: List of ambiguous references needing clarification

## Examples:

Memory: "I met Jake, my freshman year of college. Same dorm building (pittman), he is from Kansas, but now lives in Minneapolis. He took accounting and is CPA now. His full name Jacob Lucas. His girlfriend Sydney. brother Marty Lucas. Plays tennis. birthday feb 25. he is 23 yrs old."
Expected Output:
- newContacts: [
    {
      name: "Jacob Lucas",
      nickname: "Jake",
      occupation: "CPA",
      hometown: "Kansas",
      currentLocation: "Minneapolis",
      birthday: "2002-02-25",
      college: "college",
      tags: ["tennis", "accounting", "CPA"]
    },
    {
      name: "Sydney",
      category: "Partner"
    },
    {
      name: "Marty Lucas",
      category: "Family"
    }
  ]
- events: [] // No events, as there are no real events with a date

Memory: "Jadon's birthday is July 20, 2002."
Expected Output:
- events: [{ type: "Birthday", date: "2002-07-20", description: "Jadon Kittelson's birthday" }]

Provide the output as a JSON object matching the defined schema. Be thorough but only include information that is clearly stated or strongly implied in the memory.`
});

// Post-processing: filter out any events that do not have a valid date or are not a real event type
function filterValidEvents(events) {
  if (!Array.isArray(events)) return [];
  return events.filter(event => {
    // Must have a valid date and a real event type
    if (!event.date || typeof event.date !== 'string' || event.date.length < 8) return false;
    const validTypes = ['Birthday', 'Anniversary', 'Meeting', 'Event'];
    return validTypes.includes(event.type) && !/major|alumni|currently|studies|occupation|job|tag|descriptor/i.test(event.description || '');
  });
}

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
    // Filter events to only include real, valid events
    if (output.events) {
      output.events = filterValidEvents(output.events);
    }
    return output;
  }
); 