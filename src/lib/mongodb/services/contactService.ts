import { connectToDatabase } from '../config';
import Contact, { IContact } from '../models/Contact';

export class ContactService {
  /**
   * Create a new contact
   */
  static async createContact(contactData: Partial<IContact>): Promise<IContact> {
    await connectToDatabase();
    const contact = new Contact(contactData);
    return await contact.save();
  }

  /**
   * Get all contacts for a specific owner
   */
  static async getContactsByOwnerId(ownerId: string): Promise<IContact[]> {
    await connectToDatabase();
    return await Contact.find({ ownerId }).sort({ name: 1 });
  }

  /**
   * Get a contact by ID
   */
  static async getContactById(id: string): Promise<IContact | null> {
    await connectToDatabase();
    return await Contact.findById(id);
  }

  /**
   * Update a contact
   */
  static async updateContact(id: string, contactData: Partial<IContact>): Promise<IContact | null> {
    await connectToDatabase();
    return await Contact.findByIdAndUpdate(id, contactData, { new: true });
  }

  /**
   * Delete a contact
   */
  static async deleteContact(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await Contact.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Search contacts by name
   */
  static async searchContacts(ownerId: string, searchTerm: string): Promise<IContact[]> {
    await connectToDatabase();
    return await Contact.find({
      ownerId,
      name: { $regex: searchTerm, $options: 'i' }
    }).sort({ name: 1 });
  }

  /**
   * Get contacts by tag
   */
  static async getContactsByTag(ownerId: string, tag: string): Promise<IContact[]> {
    await connectToDatabase();
    return await Contact.find({
      ownerId,
      tags: tag
    }).sort({ name: 1 });
  }

  /**
   * Get contacts by category
   */
  static async getContactsByCategory(ownerId: string, category: string): Promise<IContact[]> {
    await connectToDatabase();
    return await Contact.find({
      ownerId,
      category
    }).sort({ name: 1 });
  }

  /**
   * Import mock data into MongoDB (for development/testing)
   */
  static async importMockData(contacts: any[]): Promise<number> {
    await connectToDatabase();
    
    // Clear existing contacts first (optional)
    await Contact.deleteMany({});
    
    // Insert all contacts
    const result = await Contact.insertMany(contacts);
    return result.length;
  }
} 