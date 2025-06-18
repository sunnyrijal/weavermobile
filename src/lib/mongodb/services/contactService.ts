import { connectToDatabase } from '../config';
import Contact, { IContact } from '../models/Contact';
import mongoose from 'mongoose';

// Helper function to convert MongoDB document to plain object with id
const convertDocumentToObject = (doc: IContact): any => {
  const obj = doc.toObject();
  obj.id = obj._id.toString();
  return obj;
};

export class ContactService {
  /**
   * Create a new contact
   */
  static async createContact(contactData: Partial<IContact>): Promise<IContact> {
    await connectToDatabase();
    const contact = new Contact(contactData);
    await contact.save();
    
    // Convert the MongoDB _id to id for the frontend
    return convertDocumentToObject(contact);
  }

  /**
   * Get all contacts for a specific owner
   */
  static async getContactsByOwnerId(ownerId: string): Promise<IContact[]> {
    await connectToDatabase();
    const contacts = await Contact.find({ ownerId }).sort({ name: 1 });
    
    // Convert the MongoDB _id to id for the frontend
    return contacts.map(contact => convertDocumentToObject(contact));
  }

  /**
   * Get a contact by ID
   */
  static async getContactById(id: string): Promise<IContact | null> {
    await connectToDatabase();
    const contact = await Contact.findById(id);
    
    if (!contact) return null;
    
    // Convert the MongoDB _id to id for the frontend
    return convertDocumentToObject(contact);
  }

  /**
   * Update a contact
   */
  static async updateContact(id: string, contactData: Partial<IContact>): Promise<IContact | null> {
    await connectToDatabase();
    const contact = await Contact.findByIdAndUpdate(id, contactData, { new: true });
    
    if (!contact) return null;
    
    // Convert the MongoDB _id to id for the frontend
    return convertDocumentToObject(contact);
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
    const contacts = await Contact.find({
      ownerId,
      name: { $regex: searchTerm, $options: 'i' }
    }).sort({ name: 1 });
    
    // Convert the MongoDB _id to id for the frontend
    return contacts.map(contact => convertDocumentToObject(contact));
  }

  /**
   * Get contacts by tag
   */
  static async getContactsByTag(ownerId: string, tag: string): Promise<IContact[]> {
    await connectToDatabase();
    const contacts = await Contact.find({
      ownerId,
      tags: tag
    }).sort({ name: 1 });
    
    // Convert the MongoDB _id to id for the frontend
    return contacts.map(contact => convertDocumentToObject(contact));
  }

  /**
   * Get contacts by category
   */
  static async getContactsByCategory(ownerId: string, category: string): Promise<IContact[]> {
    await connectToDatabase();
    const contacts = await Contact.find({
      ownerId,
      category
    }).sort({ name: 1 });
    
    // Convert the MongoDB _id to id for the frontend
    return contacts.map(contact => convertDocumentToObject(contact));
  }

  /**
   * Import mock data into MongoDB (for development/testing)
   */
  static async importMockData(contacts: any[]): Promise<number> {
    await connectToDatabase();
    
    // Clear existing contacts first (optional)
    await Contact.deleteMany({});
    
    // Ensure each contact has an id property set to the same value as _id
    const contactsWithId = contacts.map(contact => {
      if (!contact.id) {
        contact.id = new mongoose.Types.ObjectId().toString();
      }
      return contact;
    });
    
    // Insert all contacts
    const result = await Contact.insertMany(contactsWithId);
    return result.length;
  }
} 