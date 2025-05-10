'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting tags for contacts
 * based on their profile information and data imported from different networks.
 *
 * - suggestTags - A function that suggests tags for a contact.
 * - SuggestTagsInput - The input type for the suggestTags function.
 * - SuggestTagsOutput - The return type for the suggestTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTagsInputSchema = z.object({
  profileInformation: z
    .string()
    .describe(
      'A string containing the profile information of the contact, including details from various networks and profile input forms.'
    ),
  importedData: z
    .string()
    .optional()
    .describe(
      'Optional data imported from different networks (e.g., LinkedIn, Facebook) that can be used to suggest tags.'
    ),
});

export type SuggestTagsInput = z.infer<typeof SuggestTagsInputSchema>;

const SuggestTagsOutputSchema = z.object({
  suggestedTags: z
    .array(z.string())
    .describe('An array of suggested tags for the contact.'),
});

export type SuggestTagsOutput = z.infer<typeof SuggestTagsOutputSchema>;

export async function suggestTags(input: SuggestTagsInput): Promise<SuggestTagsOutput> {
  return suggestTagsFlow(input);
}

const suggestTagsPrompt = ai.definePrompt({
  name: 'suggestTagsPrompt',
  input: {schema: SuggestTagsInputSchema},
  output: {schema: SuggestTagsOutputSchema},
  prompt: `You are an expert in contact categorization and tagging.
Based on the following profile information and imported data, suggest relevant tags for this contact.

Profile Information: {{{profileInformation}}}
Imported Data: {{{importedData}}}

Suggest at least 5 tags that would be helpful for organizing and categorizing this contact. Return the tags as an array of strings.
`,
});

const suggestTagsFlow = ai.defineFlow(
  {
    name: 'suggestTagsFlow',
    inputSchema: SuggestTagsInputSchema,
    outputSchema: SuggestTagsOutputSchema,
  },
  async input => {
    const {output} = await suggestTagsPrompt(input);
    return output!;
  }
);
