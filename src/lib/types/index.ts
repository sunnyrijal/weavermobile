import type { Timestamp } from 'firebase/firestore'; // Only for type, mock will use Date
import type { z } from 'zod';
import type { contactFormSchema } from '@/components/contacts/ContactForm'; // Assuming ContactForm will export its schema

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: Date | Timestamp;
  userPreferences?: {
    defaultView?: 'list' | 'grid' | 'tree';
  };
}

export interface Relationship {
  relatedContactId: string;
  type: string; // e.g., "Parent", "Sibling", "Partner", "Child", "Colleague", "Pet", "Friend"
  customLabel?: string;
}

export interface NotableEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  description?: string;
}

export interface Contact {
  id: string; // Firestore document ID
  ownerId: string; // User UID
  name: string;
  photoURL?: string; // URL to image in Firebase Storage
  birthday?: string; // YYYY-MM-DD
  hometown?: string; // e.g., "Kritipur, Nepal"
  currentLocation?: string; // e.g., "Cincinnati, Ohio"
  occupation?: string;
  company?: string;
  college?: string; 
  socialProfiles?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
    [key: string]: string | undefined; // For other social platforms
  };
  phone?: string;
  email?: string;
  category?: string; // e.g., "Family", "Friend", "Colleague", "Professional", or custom
  ownerRelationshipLabel?: string; // User's specific relationship to this contact, e.g., "Host Mom"
  importSource?: string; // e.g., "Manual", "LinkedIn", "Phone"
  tags: string[];
  notes?: string;
  photosTogether: string[]; // Array of URLs to images in Firebase Storage
  relationships: Relationship[];
  notableEvents?: NotableEvent[]; // Added notable events
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// For Relationship Map visualization
export interface NodeData extends Contact {
  isCentral?: boolean;
}

export interface EdgeData {
  id: string; // Unique ID for the edge
  source: string; // contactId
  target: string; // contactId
  label?: string; // relationship type or customLabel
  type: string; // relationship type
}

// Example for OAuth preview
export interface ImportedContactPreview {
  sourceId: string; // ID from the external platform
  name: string;
  photoURL?: string;
  email?: string;
  [key: string]: any; // Other metadata
}

export type ContactViewMode = 'list' | 'grid' | 'tree';

// Form specific types
export type ContactFormValues = z.infer<typeof contactFormSchema>;
