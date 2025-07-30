import mongoose, { Schema, model, models, Document } from 'mongoose';

// Define the Vault interface
export interface IVault extends Document {
  id: string;
  name: string;
  description?: string;
  type: 'personal' | 'work' | 'family' | 'custom';
  color: string;
  isDefault: boolean;
  ownerId: string;
  contacts: string[]; // Contact IDs
  settings: {
    privacy: 'private' | 'shared';
    sharingPermissions: string[]; // User IDs who can access
    autoAddNewContacts: boolean;
    reminderSettings: {
      enabled: boolean;
      defaultLeadTime: number; // days
      notificationMethods: {
        email: boolean;
        push: boolean;
        sms: boolean;
      };
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const VaultSchema = new Schema<IVault>(
  {
    name: { type: String, required: true },
    description: String,
    type: { 
      type: String, 
      enum: ['personal', 'work', 'family', 'custom'],
      required: true 
    },
    color: { type: String, default: '#3B82F6' }, // Default blue
    isDefault: { type: Boolean, default: false },
    ownerId: { type: String, required: true, index: true },
    contacts: [{ type: String }], // Contact IDs
    settings: {
      privacy: { 
        type: String, 
        enum: ['private', 'shared'],
        default: 'private'
      },
      sharingPermissions: [String], // User IDs
      autoAddNewContacts: { type: Boolean, default: false },
      reminderSettings: {
        enabled: { type: Boolean, default: true },
        defaultLeadTime: { type: Number, default: 1 }, // days
        notificationMethods: {
          email: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          sms: { type: Boolean, default: false },
        },
      },
    },
  },
  { timestamps: true }
);

// Use the recommended singleton pattern
const Vault = mongoose.models.Vault || model<IVault>('Vault', VaultSchema);
export default Vault; 