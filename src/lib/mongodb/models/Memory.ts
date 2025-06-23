import { Schema, model, models, Document, Model } from 'mongoose';
import { ExtractedEntities } from '@/ai/flows/process-voice-input-flow';

// Define the Memory interface extending Document
export interface IMemory extends Document {
  ownerId: string;
  timestamp: Date;
  eventDate?: string;
  inputType: 'voice' | 'text';
  transcript?: string;
  summary: string;
  entities?: ExtractedEntities;
  linkedContactIds: string[];
  tags: string[];
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral' | 'mixed';
  };
  photos?: string[];
}

// Define the schema
const MemorySchema = new Schema<IMemory>(
  {
    ownerId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now },
    eventDate: String,
    inputType: { type: String, required: true, enum: ['voice', 'text'] },
    transcript: String,
    summary: { type: String, required: true },
    entities: {
      people: [String],
      organizations: [String],
      relationships: [String],
      dates: [String],
      locations: [String],
      keyEvents: [String]
    },
    linkedContactIds: [String],
    tags: [String],
    sentiment: {
      score: Number,
      label: { type: String, enum: ['positive', 'negative', 'neutral', 'mixed'] }
    },
    photos: [String]
  },
  { timestamps: true }
);

// Create and export the model
const Memory: Model<IMemory> = models.Memory || model<IMemory>('Memory', MemorySchema);

export default Memory; 