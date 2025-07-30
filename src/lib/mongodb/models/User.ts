import { Schema, model, models, Document, Model } from 'mongoose';

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  subscription: {
    plan: 'free' | 'pro' | 'business';
    status: 'active' | 'cancelled' | 'past_due';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    usage: {
      aiParsingSessions: number;
      contactsCount: number;
      lastResetDate: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    displayName: String,
    photoURL: String,
    subscription: {
      plan: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
      status: { type: String, enum: ['active', 'cancelled', 'past_due'], default: 'active' },
      currentPeriodStart: { type: Date, default: Date.now },
      currentPeriodEnd: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // 30 days
      usage: {
        aiParsingSessions: { type: Number, default: 0 },
        contactsCount: { type: Number, default: 0 },
        lastResetDate: { type: Date, default: Date.now }
      }
    }
  },
  { timestamps: true }
);

const User = models.User || model<IUser>('User', UserSchema);

export default User; 