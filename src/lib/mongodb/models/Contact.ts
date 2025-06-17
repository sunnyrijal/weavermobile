import { Schema, model, models, Document, Model } from 'mongoose';

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
  photoURL?: string;
  birthday?: string;
  hometown?: string;
  currentLocation?: string;
  occupation?: string;
  company?: string;
  college?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const ContactSchema = new Schema<IContact>(
  {
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    photoURL: String,
    birthday: String,
    hometown: String,
    currentLocation: String,
    occupation: String,
    company: String,
    college: String,
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
  },
  { timestamps: true }
);

// Create and export the model
const Contact: Model<IContact> = models.Contact || model<IContact>('Contact', ContactSchema);

export default Contact; 