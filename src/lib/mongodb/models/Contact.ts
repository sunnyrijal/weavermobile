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
  name?: string;
}

// Define the SocialProfiles interface
interface SocialProfiles {
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  [key: string]: string | undefined;
}

// Define the Reminder interface
interface Reminder {
  id: string;
  title: string;
  date: Date;
  type: 'birthday' | 'anniversary' | 'call' | 'meeting' | 'gift' | 'custom';
  description?: string;
  isCompleted: boolean;
  leadTime: number; // days before event
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  recurring?: {
    frequency: 'yearly' | 'monthly' | 'weekly' | 'custom';
    interval?: number;
  };
}

// Define the Activity interface
interface Activity {
  id: string;
  type: 'call' | 'meeting' | 'gift' | 'social' | 'work' | 'custom';
  date: Date;
  duration?: number; // in minutes
  notes: string;
  mood?: 'positive' | 'neutral' | 'negative';
  tags: string[];
  location?: string;
  participants?: string[]; // other contact IDs
  outcome?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
}

// Define the Address interface
interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  isPrimary: boolean;
  notes?: string;
}

// Define the CustomField interface
interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'url' | 'address' | 'number' | 'boolean';
  value: string;
  isPrivate: boolean;
  category: 'personal' | 'work' | 'social' | 'emergency' | 'custom';
}

// Define the Pet interface
interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  birthDate?: Date;
  notes?: string;
}

// Define the FamilyMember interface
interface FamilyMember {
  id: string;
  relationship: string;
  contactId: string;
  isPrimary: boolean;
  children?: string[];
  parents?: string[];
}

// Define the Gift interface
interface Gift {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: Date;
  occasion?: string;
  isReceived: boolean;
  notes?: string;
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
  gender?: string;
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
  
  // Monica-inspired enhanced fields
  reminders: Reminder[];
  activities: Activity[];
  addresses: Address[];
  customFields: CustomField[];
  pets: Pet[];
  familyMembers: FamilyMember[];
  gifts: Gift[];
  
  // Enhanced relationship tracking
  anniversary?: Date;
  howWeMet?: string;
  firstMeetingDate?: Date;
  lastContactDate?: Date;
  contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'rarely';
  
  // Emergency contact information
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  
  // Preferences and interests
  preferences?: {
    communicationMethod: 'phone' | 'email' | 'text' | 'social' | 'in-person';
    preferredContactTime?: string;
    interests: string[];
    dislikes: string[];
    dietaryRestrictions?: string[];
    allergies?: string[];
  };
  
  // Work and professional information
  workInfo?: {
    position: string;
    department?: string;
    startDate?: Date;
    endDate?: Date;
    companyWebsite?: string;
    workPhone?: string;
    workEmail?: string;
    manager?: string;
    directReports?: string[];
  };
  
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
  isCompanyContact?: boolean;
  companyContextType?: 'shared' | 'private';
  lastUpdatedBy?: string;
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
    gender: { type: String },
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
    isCompanyContact: { type: Boolean, default: false },
    companyContextType: { type: String, enum: ['shared', 'private'] },
    lastUpdatedBy: String,
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
    
    // Monica-inspired enhanced fields
    reminders: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        date: { type: Date, required: true },
        type: { 
          type: String, 
          enum: ['birthday', 'anniversary', 'call', 'meeting', 'gift', 'custom'],
          required: true 
        },
        description: String,
        isCompleted: { type: Boolean, default: false },
        leadTime: { type: Number, default: 1 }, // days
        notificationPreferences: {
          email: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          sms: { type: Boolean, default: false },
        },
        recurring: {
          frequency: { 
            type: String, 
            enum: ['yearly', 'monthly', 'weekly', 'custom'] 
          },
          interval: Number,
        },
      },
    ],
    activities: [
      {
        id: { type: String, required: true },
        type: { 
          type: String, 
          enum: ['call', 'meeting', 'gift', 'social', 'work', 'custom'],
          required: true 
        },
        date: { type: Date, required: true },
        duration: Number, // minutes
        notes: String,
        mood: { 
          type: String, 
          enum: ['positive', 'neutral', 'negative'] 
        },
        tags: [String],
        location: String,
        participants: [String], // contact IDs
        outcome: String,
        followUpRequired: { type: Boolean, default: false },
        followUpDate: Date,
      },
    ],
    addresses: [
      {
        id: { type: String, required: true },
        type: { 
          type: String, 
          enum: ['home', 'work', 'other'],
          required: true 
        },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: String,
        country: { type: String, required: true },
        postalCode: String,
        isPrimary: { type: Boolean, default: false },
        notes: String,
      },
    ],
    customFields: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        type: { 
          type: String, 
          enum: ['text', 'email', 'phone', 'date', 'url', 'address', 'number', 'boolean'],
          required: true 
        },
        value: String,
        isPrivate: { type: Boolean, default: false },
        category: { 
          type: String, 
          enum: ['personal', 'work', 'social', 'emergency', 'custom'],
          default: 'personal'
        },
      },
    ],
    pets: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        type: String,
        breed: String,
        birthDate: Date,
        notes: String,
      },
    ],
    familyMembers: [
      {
        id: { type: String, required: true },
        relationship: { type: String, required: true },
        contactId: { type: String, required: true },
        isPrimary: { type: Boolean, default: false },
        children: [String],
        parents: [String],
      },
    ],
    gifts: [
      {
        id: { type: String, required: true },
        description: { type: String, required: true },
        amount: Number,
        currency: { type: String, default: 'USD' },
        date: { type: Date, required: true },
        occasion: String,
        isReceived: { type: Boolean, default: false },
        notes: String,
      },
    ],
    
    // Enhanced relationship tracking
    anniversary: Date,
    howWeMet: String,
    firstMeetingDate: Date,
    lastContactDate: Date,
    contactFrequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'rarely'] 
    },
    
    // Emergency contact information
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
    },
    
    // Preferences and interests
    preferences: {
      communicationMethod: { 
        type: String, 
        enum: ['phone', 'email', 'text', 'social', 'in-person'] 
      },
      preferredContactTime: String,
      interests: [String],
      dislikes: [String],
      dietaryRestrictions: String,
      allergies: String,
    },
    
    // Work and professional information
    workInfo: {
      position: String,
      department: String,
      startDate: Date,
      endDate: Date,
      companyWebsite: String,
      workPhone: String,
      workEmail: String,
      manager: String,
      directReports: [String],
    },
    
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