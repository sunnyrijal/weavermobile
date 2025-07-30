import User, { IUser } from '../models/User';

export class UserService {
  /**
   * Get or create user
   */
  static async getOrCreateUser(uid: string, userData: { email: string; displayName?: string; photoURL?: string }): Promise<IUser> {
    let user = await User.findOne({ uid });
    
    if (!user) {
      user = await User.create({
        uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        subscription: {
          plan: 'free',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          usage: {
            aiParsingSessions: 0,
            contactsCount: 0,
            lastResetDate: new Date()
          }
        }
      });
    }
    
    return user;
  }

  /**
   * Get user by UID
   */
  static async getUserByUid(uid: string): Promise<IUser | null> {
    return await User.findOne({ uid });
  }

  /**
   * Check if user can use AI parsing
   */
  static async canUseAiParsing(uid: string): Promise<{ canUse: boolean; remaining: number; limit: number }> {
    const user = await this.getUserByUid(uid);
    if (!user) return { canUse: false, remaining: 0, limit: 0 };

    // Reset usage if it's a new month
    await this.resetMonthlyUsageIfNeeded(user);

    const limits = {
      free: 3,
      pro: -1, // unlimited
      business: -1 // unlimited
    };

    const limit = limits[user.subscription.plan];
    const remaining = limit === -1 ? -1 : Math.max(0, limit - user.subscription.usage.aiParsingSessions);
    const canUse = limit === -1 || user.subscription.usage.aiParsingSessions < limit;

    return { canUse, remaining, limit };
  }

  /**
   * Increment AI parsing usage
   */
  static async incrementAiParsingUsage(uid: string): Promise<void> {
    const user = await this.getUserByUid(uid);
    if (!user) return;

    await this.resetMonthlyUsageIfNeeded(user);
    
    if (user.subscription.plan === 'free') {
      user.subscription.usage.aiParsingSessions += 1;
      await user.save();
    }
  }

  /**
   * Check contact limits
   */
  static async canAddContact(uid: string): Promise<{ canAdd: boolean; remaining: number; limit: number }> {
    let user = await this.getUserByUid(uid);
    
    // If user doesn't exist, create them with free plan
    if (!user) {
      user = await this.getOrCreateUser(uid, { 
        email: `${uid}@example.com`, 
        displayName: uid 
      });
    }

    const limits = {
      free: 1000, // Increased for development/testing
      pro: 500,
      business: -1 // unlimited
    };

    const limit = limits[user.subscription.plan];
    const remaining = limit === -1 ? -1 : Math.max(0, limit - user.subscription.usage.contactsCount);
    const canAdd = limit === -1 || user.subscription.usage.contactsCount < limit;

    return { canAdd, remaining, limit };
  }

  /**
   * Update contact count
   */
  static async updateContactCount(uid: string, count: number): Promise<void> {
    const user = await this.getUserByUid(uid);
    if (!user) return;

    user.subscription.usage.contactsCount = count;
    await user.save();
  }

  /**
   * Reset monthly usage if needed
   */
  private static async resetMonthlyUsageIfNeeded(user: IUser): Promise<void> {
    const now = new Date();
    const lastReset = user.subscription.usage.lastResetDate;
    
    // Check if it's a new month
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      user.subscription.usage.aiParsingSessions = 0;
      user.subscription.usage.lastResetDate = now;
      await user.save();
    }
  }

  /**
   * Update subscription
   */
  static async updateSubscription(uid: string, plan: 'free' | 'pro' | 'business', status: 'active' | 'cancelled' | 'past_due' = 'active'): Promise<void> {
    const user = await this.getUserByUid(uid);
    if (!user) return;

    user.subscription.plan = plan;
    user.subscription.status = status;
    user.subscription.currentPeriodStart = new Date();
    user.subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await user.save();
  }

  /**
   * Get usage statistics
   */
  static async getUsageStats(uid: string): Promise<{
    plan: string;
    status: string;
    aiParsingSessions: number;
    contactsCount: number;
    limits: { aiParsing: number; contacts: number };
    remaining: { aiParsing: number; contacts: number };
  }> {
    let user = await this.getUserByUid(uid);
    
    // If user doesn't exist, create them with free plan
    if (!user) {
      user = await this.getOrCreateUser(uid, { 
        email: `${uid}@example.com`, 
        displayName: uid 
      });
    }

    await this.resetMonthlyUsageIfNeeded(user);

    const limits = {
      free: { aiParsing: 3, contacts: 1000 }, // Increased for development/testing
      pro: { aiParsing: -1, contacts: 500 },
      business: { aiParsing: -1, contacts: -1 }
    };

    const planLimits = limits[user.subscription.plan];
    
    return {
      plan: user.subscription.plan,
      status: user.subscription.status,
      aiParsingSessions: user.subscription.usage.aiParsingSessions,
      contactsCount: user.subscription.usage.contactsCount,
      limits: planLimits,
      remaining: {
        aiParsing: planLimits.aiParsing === -1 ? -1 : Math.max(0, planLimits.aiParsing - user.subscription.usage.aiParsingSessions),
        contacts: planLimits.contacts === -1 ? -1 : Math.max(0, planLimits.contacts - user.subscription.usage.contactsCount)
      }
    };
  }
} 