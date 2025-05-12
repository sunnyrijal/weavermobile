import type { z } from 'zod';
// It's better to define the schema in ContactForm.tsx and import its inferred type here,
// or define the schema here and import it into ContactForm.tsx.
// For now, let's assume contactFormSchema will be defined elsewhere (e.g. in ContactForm.tsx)
// and we just need to define its type here for other components to use.

// Placeholder for the actual schema which will be in ContactForm.tsx
// This is just to make the ContactFormValues type available.
// The actual schema definition will be in ContactForm.tsx to keep it co-located.
const placeholderContactFormSchema = z.object({
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  occupation: z.string().optional(),
  company: z.string().optional(),
  college: z.string().optional(), // Added college field
  category: z.string().optional(),
  ownerRelationshipLabel: z.string().optional(), // User's specific relationship (e.g., "My Host Mom")
  locationDetails: z.string().optional(),
  birthday: z.date().optional().nullable(),
  photoURL: z.string().optional(),
  tags: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof placeholderContactFormSchema>;
