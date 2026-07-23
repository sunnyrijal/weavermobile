import Vault, { IVault } from '../models/Vault';
import Contact from '../models/Contact';
import { connectToDatabase } from '../config';

export class VaultService {
  /**
   * Get all vaults for a user
   */
  static async getUserVaults(ownerId: string) {
    await connectToDatabase();
    
    const vaults = await Vault.find({ ownerId }).sort({ createdAt: -1 });
    return vaults;
  }

  /**
   * Get a specific vault
   */
  static async getVault(vaultId: string, ownerId: string) {
    await connectToDatabase();
    
    const vault = await Vault.findOne({ _id: vaultId, ownerId });
    if (!vault) throw new Error('Vault not found');
    
    return vault;
  }

  /**
   * Create a new vault
   */
  static async createVault(ownerId: string, vaultData: {
    name: string;
    description?: string;
    type: 'personal' | 'work' | 'family' | 'custom';
    color?: string;
    isDefault?: boolean;
    settings?: {
      privacy: 'private' | 'shared';
      sharingPermissions: string[];
      autoAddNewContacts: boolean;
      reminderSettings: {
        enabled: boolean;
        defaultLeadTime: number;
        notificationMethods: {
          email: boolean;
          push: boolean;
          sms: boolean;
        };
      };
    };
  }) {
    await connectToDatabase();
    
    // If this is the first vault, make it default
    const existingVaults = await this.getUserVaults(ownerId);
    const isDefault = existingVaults.length === 0 || vaultData.isDefault;
    
    // If making this vault default, unset other defaults
    if (isDefault) {
      await Vault.updateMany(
        { ownerId, isDefault: true },
        { isDefault: false }
      );
    }
    
    const vault = await Vault.create({
      ...vaultData,
      ownerId,
      isDefault,
      contacts: [],
      settings: vaultData.settings || {
        privacy: 'private',
        sharingPermissions: [],
        autoAddNewContacts: false,
        reminderSettings: {
          enabled: true,
          defaultLeadTime: 1,
          notificationMethods: {
            email: true,
            push: true,
            sms: false
          }
        }
      }
    });
    
    return vault;
  }

  /**
   * Update a vault
   */
  static async updateVault(vaultId: string, ownerId: string, updates: any) {
    await connectToDatabase();
    
    // If making this vault default, unset other defaults
    if (updates.isDefault) {
      await Vault.updateMany(
        { ownerId, isDefault: true },
        { isDefault: false }
      );
    }
    
    const vault = await Vault.findOneAndUpdate(
      { _id: vaultId, ownerId },
      updates,
      { new: true }
    );
    
    if (!vault) throw new Error('Vault not found');
    
    return vault;
  }

  /**
   * Delete a vault
   */
  static async deleteVault(vaultId: string, ownerId: string) {
    await connectToDatabase();
    
    const vault = await Vault.findOne({ _id: vaultId, ownerId });
    if (!vault) throw new Error('Vault not found');
    
    // Move contacts to default vault or delete them
    if (vault.contacts.length > 0) {
      const defaultVault = await Vault.findOne({ ownerId, isDefault: true });
      
      if (defaultVault) {
        // Move contacts to default vault
        await Contact.updateMany(
          { _id: { $in: vault.contacts } },
          { $set: { vaultId: defaultVault._id } }
        );
      } else {
        // Create a new default vault
        const newDefaultVault = await this.createVault(ownerId, {
          name: 'Personal',
          type: 'personal',
          isDefault: true
        });
        
        await Contact.updateMany(
          { _id: { $in: vault.contacts } },
          { $set: { vaultId: newDefaultVault._id } }
        );
      }
    }
    
    await Vault.findByIdAndDelete(vaultId);
    
    return { success: true, message: 'Vault deleted successfully' };
  }

  /**
   * Add contacts to a vault
   */
  static async addContactsToVault(vaultId: string, ownerId: string, contactIds: string[]) {
    await connectToDatabase();
    
    const vault = await Vault.findOne({ _id: vaultId, ownerId });
    if (!vault) throw new Error('Vault not found');
    
    // Add contacts to vault
    await Vault.findByIdAndUpdate(
      vaultId,
      { $addToSet: { contacts: { $each: contactIds } } }
    );
    
    // Update contacts with vault reference
    await Contact.updateMany(
      { _id: { $in: contactIds }, ownerId },
      { $set: { vaultId } }
    );
    
    return { success: true, message: 'Contacts added to vault' };
  }

  /**
   * Remove contacts from a vault
   */
  static async removeContactsFromVault(vaultId: string, ownerId: string, contactIds: string[]) {
    await connectToDatabase();
    
    const vault = await Vault.findOne({ _id: vaultId, ownerId });
    if (!vault) throw new Error('Vault not found');
    
    // Remove contacts from vault
    await Vault.findByIdAndUpdate(
      vaultId,
      { $pull: { contacts: { $in: contactIds } } }
    );
    
    // Remove vault reference from contacts
    await Contact.updateMany(
      { _id: { $in: contactIds }, ownerId },
      { $unset: { vaultId: 1 } }
    );
    
    return { success: true, message: 'Contacts removed from vault' };
  }

  /**
   * Get contacts in a vault
   */
  static async getVaultContacts(vaultId: string, ownerId: string, options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    await connectToDatabase();
    
    const vault = await Vault.findOne({ _id: vaultId, ownerId });
    if (!vault) throw new Error('Vault not found');
    
    let query: any = { 
      _id: { $in: vault.contacts },
      ownerId 
    };
    
    if (options?.search) {
      query.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
        { phone: { $regex: options.search, $options: 'i' } }
      ];
    }
    
    const contacts = await Contact.find(query)
      .limit(options?.limit || 50)
      .skip(options?.offset || 0)
      .sort({ name: 1 });
    
    const total = await Contact.countDocuments(query);
    
    return {
      contacts,
      total,
      vault
    };
  }

  /**
   * Get vault statistics
   */
  static async getVaultStats(ownerId: string) {
    await connectToDatabase();
    
    const vaults = await this.getUserVaults(ownerId);
    const stats = [];
    
    for (const vault of vaults) {
      const contactCount = vault.contacts.length;
      const recentActivity = await this.getVaultRecentActivity(vault._id.toString());
      
      stats.push({
        vaultId: vault._id,
        vaultName: vault.name,
        contactCount,
        recentActivity,
        type: vault.type,
        isDefault: vault.isDefault
      });
    }
    
    return stats;
  }

  /**
   * Get recent activity for a vault
   */
  private static async getVaultRecentActivity(vaultId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const contacts = await Contact.find({
      vaultId,
      'activities.date': { $gte: thirtyDaysAgo }
    }).select('activities');
    
    const recentActivities = contacts.flatMap(contact => 
      contact.activities.filter((activity: any) => 
        new Date(activity.date) >= thirtyDaysAgo
      )
    );
    
    return recentActivities.length;
  }

  /**
   * Share a vault with another user
   */
  static async shareVault(vaultId: string, ownerId: string, userId: string) {
    await connectToDatabase();
    
    const vault = await Vault.findOne({ _id: vaultId, ownerId });
    if (!vault) throw new Error('Vault not found');
    
    if (vault.settings.privacy === 'private') {
      throw new Error('Cannot share private vault');
    }
    
    await Vault.findByIdAndUpdate(
      vaultId,
      { $addToSet: { 'settings.sharingPermissions': userId } }
    );
    
    return { success: true, message: 'Vault shared successfully' };
  }

  /**
   * Unshare a vault with another user
   */
  static async unshareVault(vaultId: string, ownerId: string, userId: string) {
    await connectToDatabase();
    
    const vault = await Vault.findOne({ _id: vaultId, ownerId });
    if (!vault) throw new Error('Vault not found');
    
    await Vault.findByIdAndUpdate(
      vaultId,
      { $pull: { 'settings.sharingPermissions': userId } }
    );
    
    return { success: true, message: 'Vault unshared successfully' };
  }

  /**
   * Get shared vaults for a user
   */
  static async getSharedVaults(userId: string) {
    await connectToDatabase();
    
    const vaults = await Vault.find({
      'settings.sharingPermissions': userId
    }).populate('ownerId', 'displayName email');
    
    return vaults;
  }
} 