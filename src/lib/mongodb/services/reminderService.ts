import Contact, { IContact } from '../models/Contact';
import { connectToDatabase } from '../config';

export class ReminderService {
  /**
   * Get all reminders for a user
   */
  static async getUserReminders(ownerId: string, options?: {
    includeCompleted?: boolean;
    dateRange?: { start: Date; end: Date };
    type?: string;
  }) {
    await connectToDatabase();
    
    const query: any = { ownerId };
    
    if (!options?.includeCompleted) {
      query['reminders.isCompleted'] = { $ne: true };
    }
    
    if (options?.dateRange) {
      query['reminders.date'] = {
        $gte: options.dateRange.start,
        $lte: options.dateRange.end
      };
    }
    
    if (options?.type) {
      query['reminders.type'] = options.type;
    }
    
    const contacts = await Contact.find(query).select('name reminders');
    
    const reminders = contacts.flatMap(contact => 
      contact.reminders.map(reminder => ({
        ...reminder.toObject(),
        contactName: contact.name,
        contactId: contact._id
      }))
    );
    
    return reminders.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Get upcoming reminders (next 30 days)
   */
  static async getUpcomingReminders(ownerId: string) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return this.getUserReminders(ownerId, {
      includeCompleted: false,
      dateRange: { start: new Date(), end: thirtyDaysFromNow }
    });
  }

  /**
   * Get today's reminders
   */
  static async getTodayReminders(ownerId: string) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getUserReminders(ownerId, {
      includeCompleted: false,
      dateRange: { start: today, end: tomorrow }
    });
  }

  /**
   * Add a reminder to a contact
   */
  static async addReminder(contactId: string, reminderData: {
    title: string;
    date: Date;
    type: 'birthday' | 'anniversary' | 'call' | 'meeting' | 'gift' | 'custom';
    description?: string;
    leadTime?: number;
    notificationPreferences?: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    recurring?: {
      frequency: 'yearly' | 'monthly' | 'weekly' | 'custom';
      interval?: number;
    };
  }) {
    await connectToDatabase();
    
    const reminder = {
      id: Math.random().toString(36).substr(2, 9),
      ...reminderData,
      isCompleted: false,
      leadTime: reminderData.leadTime || 1,
      notificationPreferences: reminderData.notificationPreferences || {
        email: true,
        push: true,
        sms: false
      }
    };
    
    const contact = await Contact.findByIdAndUpdate(
      contactId,
      { $push: { reminders: reminder } },
      { new: true }
    );
    
    return contact;
  }

  /**
   * Update a reminder
   */
  static async updateReminder(contactId: string, reminderId: string, updates: any) {
    await connectToDatabase();
    
    const contact = await Contact.findById(contactId);
    if (!contact) throw new Error('Contact not found');
    
    const reminderIndex = contact.reminders.findIndex(r => r.id === reminderId);
    if (reminderIndex === -1) throw new Error('Reminder not found');
    
    contact.reminders[reminderIndex] = {
      ...contact.reminders[reminderIndex].toObject(),
      ...updates
    };
    
    await contact.save();
    return contact;
  }

  /**
   * Mark reminder as completed
   */
  static async completeReminder(contactId: string, reminderId: string) {
    return this.updateReminder(contactId, reminderId, { isCompleted: true });
  }

  /**
   * Delete a reminder
   */
  static async deleteReminder(contactId: string, reminderId: string) {
    await connectToDatabase();
    
    const contact = await Contact.findByIdAndUpdate(
      contactId,
      { $pull: { reminders: { id: reminderId } } },
      { new: true }
    );
    
    return contact;
  }

  /**
   * Create birthday reminder for a contact
   */
  static async createBirthdayReminder(contactId: string, birthday: Date, leadTime: number = 7) {
    const reminderDate = new Date(birthday);
    reminderDate.setDate(reminderDate.getDate() - leadTime);
    
    return this.addReminder(contactId, {
      title: 'Birthday',
      date: reminderDate,
      type: 'birthday',
      description: 'Birthday reminder',
      leadTime,
      recurring: { frequency: 'yearly' }
    });
  }

  /**
   * Create anniversary reminder for a contact
   */
  static async createAnniversaryReminder(contactId: string, anniversary: Date, leadTime: number = 7) {
    const reminderDate = new Date(anniversary);
    reminderDate.setDate(reminderDate.getDate() - leadTime);
    
    return this.addReminder(contactId, {
      title: 'Anniversary',
      date: reminderDate,
      type: 'anniversary',
      description: 'Anniversary reminder',
      leadTime,
      recurring: { frequency: 'yearly' }
    });
  }

  /**
   * Get overdue reminders
   */
  static async getOverdueReminders(ownerId: string) {
    const today = new Date();
    
    return this.getUserReminders(ownerId, {
      includeCompleted: false,
      dateRange: { start: new Date(0), end: today }
    });
  }

  /**
   * Process recurring reminders
   */
  static async processRecurringReminders() {
    await connectToDatabase();
    
    const contacts = await Contact.find({
      'reminders.recurring': { $exists: true },
      'reminders.isCompleted': true
    });
    
    const processedReminders = [];
    
    for (const contact of contacts) {
      for (const reminder of contact.reminders) {
        if (reminder.isCompleted && reminder.recurring) {
          const nextDate = this.calculateNextRecurringDate(reminder.date, reminder.recurring);
          
          if (nextDate) {
            const newReminder = {
              ...reminder.toObject(),
              id: Math.random().toString(36).substr(2, 9),
              date: nextDate,
              isCompleted: false
            };
            
            delete newReminder._id;
            
            await Contact.findByIdAndUpdate(
              contact._id,
              { $push: { reminders: newReminder } }
            );
            
            processedReminders.push(newReminder);
          }
        }
      }
    }
    
    return processedReminders;
  }

  /**
   * Calculate next recurring date
   */
  private static calculateNextRecurringDate(date: Date, recurring: any): Date | null {
    const nextDate = new Date(date);
    
    switch (recurring.frequency) {
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        return nextDate;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        return nextDate;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        return nextDate;
      case 'custom':
        if (recurring.interval) {
          nextDate.setDate(nextDate.getDate() + recurring.interval);
          return nextDate;
        }
        return null;
      default:
        return null;
    }
  }

  /**
   * Get reminder statistics
   */
  static async getReminderStats(ownerId: string) {
    const [total, completed, upcoming, overdue] = await Promise.all([
      this.getUserReminders(ownerId, { includeCompleted: true }),
      this.getUserReminders(ownerId, { includeCompleted: true }).then(reminders => 
        reminders.filter(r => r.isCompleted)
      ),
      this.getUpcomingReminders(ownerId),
      this.getOverdueReminders(ownerId)
    ]);
    
    return {
      total: total.length,
      completed: completed.length,
      upcoming: upcoming.length,
      overdue: overdue.length,
      completionRate: total.length > 0 ? (completed.length / total.length) * 100 : 0
    };
  }
} 