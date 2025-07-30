import mongoose, { Schema, model, models, Document, Model } from 'mongoose';

// Define the NotableEvent interface
interface NotableEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
}

// Define the Relationship interface
interface Relationship {
  relatedContactId: string;
  type: string;
  customLabel?: string;
  notes?: string;
}

// Define the SocialProfiles interface
interface SocialProfiles {
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  [key: string]: string | undefined;
}

// Define the Contact interface extending Document
export interface IContact extends Document {
  ownerId: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  preferredName?: string;
  nickname?: string;
  hiddenNotes?: string;
  photoURL?: string;
  birthday?: string;
  birthYear?: string;
  age?: string;
  hometown?: string;
  currentLocation?: string;
  occupation?: string;
  company?: string;
  college?: string;
  major?: string;
  socialProfiles?: SocialProfiles;
  phone?: string;
  email?: string;
  category?: string;
  ownerRelationshipLabel?: string;
  importSource?: string;
  tags: string[];
  notes?: string;
  photosTogether: string[];
  relationships: Relationship[];
  notableEvents?: NotableEvent[];
  // Basic information fields
  height?: string;
  eyeColor?: string;
  hairColor?: string;
  bodyType?: string;
  dressingStyle?: string;
  skinTone?: string;
  ethnicity?: string;
  facialFeatures?: string;
  distinguishingFeatures?: string;
  voice?: string;
  accent?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const ContactSchema = new Schema<IContact>(
  {
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    firstName: { type: String },
    middleName: { type: String },
    lastName: { type: String },
    preferredName: { type: String },
    nickname: { type: String },
    hiddenNotes: { type: String },
    photoURL: String,
    birthday: String,
    birthYear: String,
    age: String,
    hometown: String,
    currentLocation: String,
    occupation: String,
    company: String,
    college: String,
    major: String,
    socialProfiles: {
      linkedin: String,
      instagram: String,
      twitter: String,
      facebook: String,
    },
    phone: String,
    email: String,
    category: String,
    ownerRelationshipLabel: String,
    importSource: String,
    tags: [String],
    notes: String,
    photosTogether: [String],
    relationships: [
      {
        relatedContactId: { type: String, required: true },
        type: { type: String, required: true },
        customLabel: String,
        notes: String,
      },
    ],
    notableEvents: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        date: { type: String, required: true },
        description: String,
      },
    ],
    // Basic information fields
    height: String,
    eyeColor: String,
    hairColor: String,
    bodyType: String,
    dressingStyle: String,
    skinTone: String,
    ethnicity: String,
    facialFeatures: String,
    distinguishingFeatures: String,
    voice: String,
    accent: String,
  },
  { timestamps: true }
);

// Use the recommended singleton pattern
const Contact = mongoose.models.Contact || model<IContact>('Contact', ContactSchema);
export default Contact; 