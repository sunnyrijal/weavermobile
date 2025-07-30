import mongoose, { Schema, model, models, Document, Model } from 'mongoose';

export interface IJournalEntry extends Document {
  ownerId: string;
  timestamp: Date;
  summary: string;
  originalContent: string;
  linkedContactIds?: string[];
  tags?: string[];
  mood?: string;
  category?: 'New Contact' | 'Contact Update' | 'General Memory';
}

const JournalEntrySchema = new Schema<IJournalEntry>({
  ownerId: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true },
  summary: { type: String, required: true },
  originalContent: { type: String, required: true },
  linkedContactIds: [{ type: String }],
  tags: [{ type: String }],
  mood: { type: String },
  category: { type: String, enum: ['New Contact', 'Contact Update', 'General Memory'], default: 'General Memory' },
});

const JournalEntry: Model<IJournalEntry> = mongoose.models.JournalEntry || model<IJournalEntry>('JournalEntry', JournalEntrySchema);

export default JournalEntry; 