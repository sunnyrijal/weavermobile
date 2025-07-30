import Contact, { IContact } from '../models/Contact';
import { connectToDatabase } from '../config';

export class ActivityService {
  /**
   * Add an activity to a contact
   */
  static async addActivity(contactId: string, activityData: {
    type: 'call' | 'meeting' | 'gift' | 'social' | 'work' | 'custom';
    date: Date;
    duration?: number;
    notes: string;
    mood?: 'positive' | 'neutral' | 'negative';
    tags?: string[];
    location?: string;
    participants?: string[];
    outcome?: string;
    followUpRequired?: boolean;
    followUpDate?: Date;
  }) {
    await connectToDatabase();
    
    const activity = {
      id: Math.random().toString(36).substr(2, 9),
      ...activityData,
      tags: activityData.tags || [],
      participants: activityData.participants || [],
      followUpRequired: activityData.followUpRequired || false
    };
    
    const contact = await Contact.findByIdAndUpdate(
      contactId,
      { 
        $push: { activities: activity },
        $set: { lastContactDate: activityData.date }
      },
      { new: true }
    );
    
    return contact;
  }

  /**
   * Get activities for a contact
   */
  static async getContactActivities(contactId: string, options?: {
    limit?: number;
    offset?: number;
    type?: string;
    dateRange?: { start: Date; end: Date };
    mood?: string;
  }) {
    await connectToDatabase();
    
    const contact = await Contact.findById(contactId);
    if (!contact) throw new Error('Contact not found');
    
    let activities = contact.activities;
    
    // Filter by type
    if (options?.type) {
      activities = activities.filter(a => a.type === options.type);
    }
    
    // Filter by date range
    if (options?.dateRange) {
      activities = activities.filter(a => 
        a.date >= options.dateRange!.start && a.date <= options.dateRange!.end
      );
    }
    
    // Filter by mood
    if (options?.mood) {
      activities = activities.filter(a => a.mood === options.mood);
    }
    
    // Sort by date (newest first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Apply pagination
    if (options?.offset) {
      activities = activities.slice(options.offset);
    }
    
    if (options?.limit) {
      activities = activities.slice(0, options.limit);
    }
    
    return activities;
  }

  /**
   * Get all activities for a user
   */
  static async getUserActivities(ownerId: string, options?: {
    limit?: number;
    offset?: number;
    type?: string;
    dateRange?: { start: Date; end: Date };
    mood?: string;
  }) {
    await connectToDatabase();
    
    const query: any = { ownerId };
    
    if (options?.type) {
      query['activities.type'] = options.type;
    }
    
    if (options?.dateRange) {
      query['activities.date'] = {
        $gte: options.dateRange.start,
        $lte: options.dateRange.end
      };
    }
    
    if (options?.mood) {
      query['activities.mood'] = options.mood;
    }
    
    const contacts = await Contact.find(query).select('name activities');
    
    const activities = contacts.flatMap(contact => 
      contact.activities.map(activity => ({
        ...activity.toObject(),
        contactName: contact.name,
        contactId: contact._id
      }))
    );
    
    // Sort by date (newest first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Apply pagination
    if (options?.offset) {
      activities.splice(0, options.offset);
    }
    
    if (options?.limit) {
      activities.splice(options.limit);
    }
    
    return activities;
  }

  /**
   * Update an activity
   */
  static async updateActivity(contactId: string, activityId: string, updates: any) {
    await connectToDatabase();
    
    const contact = await Contact.findById(contactId);
    if (!contact) throw new Error('Contact not found');
    
    const activityIndex = contact.activities.findIndex(a => a.id === activityId);
    if (activityIndex === -1) throw new Error('Activity not found');
    
    contact.activities[activityIndex] = {
      ...contact.activities[activityIndex].toObject(),
      ...updates
    };
    
    await contact.save();
    return contact;
  }

  /**
   * Delete an activity
   */
  static async deleteActivity(contactId: string, activityId: string) {
    await connectToDatabase();
    
    const contact = await Contact.findByIdAndUpdate(
      contactId,
      { $pull: { activities: { id: activityId } } },
      { new: true }
    );
    
    return contact;
  }

  /**
   * Get activities requiring follow-up
   */
  static async getFollowUpActivities(ownerId: string) {
    const today = new Date();
    
    return this.getUserActivities(ownerId, {
      dateRange: { start: new Date(0), end: today }
    }).then(activities => 
      activities.filter(a => a.followUpRequired && (!a.followUpDate || a.followUpDate <= today))
    );
  }

  /**
   * Get activity statistics
   */
  static async getActivityStats(ownerId: string, dateRange?: { start: Date; end: Date }) {
    const activities = await this.getUserActivities(ownerId, { dateRange });
    
    const stats = {
      total: activities.length,
      byType: {} as Record<string, number>,
      byMood: {} as Record<string, number>,
      averageDuration: 0,
      totalDuration: 0,
      followUpRequired: 0
    };
    
    let totalDuration = 0;
    let activitiesWithDuration = 0;
    
    activities.forEach(activity => {
      // Count by type
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;
      
      // Count by mood
      if (activity.mood) {
        stats.byMood[activity.mood] = (stats.byMood[activity.mood] || 0) + 1;
      }
      
      // Duration stats
      if (activity.duration) {
        totalDuration += activity.duration;
        activitiesWithDuration++;
      }
      
      // Follow-up count
      if (activity.followUpRequired) {
        stats.followUpRequired++;
      }
    });
    
    stats.totalDuration = totalDuration;
    stats.averageDuration = activitiesWithDuration > 0 ? totalDuration / activitiesWithDuration : 0;
    
    return stats;
  }

  /**
   * Get relationship insights
   */
  static async getRelationshipInsights(contactId: string) {
    const activities = await this.getContactActivities(contactId);
    
    const insights = {
      totalInteractions: activities.length,
      lastContact: activities.length > 0 ? activities[0].date : null,
      averageMood: this.calculateAverageMood(activities),
      mostCommonActivity: this.getMostCommonActivity(activities),
      contactFrequency: this.calculateContactFrequency(activities),
      relationshipHealth: this.calculateRelationshipHealth(activities)
    };
    
    return insights;
  }

  /**
   * Calculate average mood
   */
  private static calculateAverageMood(activities: any[]): string {
    const moodScores = { positive: 1, neutral: 0, negative: -1 };
    const activitiesWithMood = activities.filter(a => a.mood);
    
    if (activitiesWithMood.length === 0) return 'neutral';
    
    const totalScore = activitiesWithMood.reduce((sum, activity) => 
      sum + moodScores[activity.mood], 0
    );
    
    const averageScore = totalScore / activitiesWithMood.length;
    
    if (averageScore > 0.3) return 'positive';
    if (averageScore < -0.3) return 'negative';
    return 'neutral';
  }

  /**
   * Get most common activity type
   */
  private static getMostCommonActivity(activities: any[]): string {
    const typeCounts: Record<string, number> = {};
    
    activities.forEach(activity => {
      typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
    });
    
    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'social';
  }

  /**
   * Calculate contact frequency
   */
  private static calculateContactFrequency(activities: any[]): string {
    if (activities.length < 2) return 'rarely';
    
    const sortedActivities = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const recentActivities = sortedActivities.slice(0, 10);
    const averageDaysBetween = this.calculateAverageDaysBetween(recentActivities);
    
    if (averageDaysBetween <= 1) return 'daily';
    if (averageDaysBetween <= 7) return 'weekly';
    if (averageDaysBetween <= 30) return 'monthly';
    if (averageDaysBetween <= 90) return 'quarterly';
    if (averageDaysBetween <= 365) return 'yearly';
    return 'rarely';
  }

  /**
   * Calculate average days between activities
   */
  private static calculateAverageDaysBetween(activities: any[]): number {
    if (activities.length < 2) return 0;
    
    let totalDays = 0;
    let count = 0;
    
    for (let i = 0; i < activities.length - 1; i++) {
      const days = Math.abs(
        (new Date(activities[i].date).getTime() - new Date(activities[i + 1].date).getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      totalDays += days;
      count++;
    }
    
    return count > 0 ? totalDays / count : 0;
  }

  /**
   * Calculate relationship health score
   */
  private static calculateRelationshipHealth(activities: any[]): number {
    if (activities.length === 0) return 0;
    
    const recentActivities = activities.slice(0, 10);
    const positiveActivities = recentActivities.filter(a => a.mood === 'positive').length;
    const negativeActivities = recentActivities.filter(a => a.mood === 'negative').length;
    
    const healthScore = (positiveActivities - negativeActivities) / recentActivities.length;
    return Math.max(0, Math.min(100, (healthScore + 1) * 50)); // Convert to 0-100 scale
  }

  /**
   * Log a call activity
   */
  static async logCall(contactId: string, data: {
    date: Date;
    duration: number;
    notes: string;
    mood?: 'positive' | 'neutral' | 'negative';
    outcome?: string;
    followUpRequired?: boolean;
    followUpDate?: Date;
  }) {
    return this.addActivity(contactId, {
      type: 'call',
      ...data
    });
  }

  /**
   * Log a meeting activity
   */
  static async logMeeting(contactId: string, data: {
    date: Date;
    duration: number;
    location?: string;
    notes: string;
    mood?: 'positive' | 'neutral' | 'negative';
    participants?: string[];
    outcome?: string;
    followUpRequired?: boolean;
    followUpDate?: Date;
  }) {
    return this.addActivity(contactId, {
      type: 'meeting',
      ...data
    });
  }

  /**
   * Log a gift activity
   */
  static async logGift(contactId: string, data: {
    date: Date;
    description: string;
    amount?: number;
    currency?: string;
    notes: string;
    mood?: 'positive' | 'neutral' | 'negative';
    isReceived: boolean;
  }) {
    return this.addActivity(contactId, {
      type: 'gift',
      ...data
    });
  }
} 