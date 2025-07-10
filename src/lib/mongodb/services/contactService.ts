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

  /**
   * Find and prepare duplicate contacts for merging
   */
  static async findAndPrepareDuplicateMerges(ownerId: string): Promise<any[]> {
    await connectToDatabase();
    
    // Get all contacts for the owner
    const contacts = await Contact.find({ ownerId }).sort({ name: 1 });
    
    const duplicates: any[] = [];
    const processedIds = new Set<string>();
    
    for (let i = 0; i < contacts.length; i++) {
      if (processedIds.has(contacts[i]._id.toString())) continue;
      
      const contact = contacts[i];
      const similarContacts: any[] = [];
      
      // Find contacts with similar names (case-insensitive)
      for (let j = i + 1; j < contacts.length; j++) {
        const otherContact = contacts[j];
        if (processedIds.has(otherContact._id.toString())) continue;
        
        // Check for name similarity
        const nameSimilarity = this.calculateNameSimilarity(contact.name, otherContact.name);
        if (nameSimilarity > 0.7) { // 70% similarity threshold
          similarContacts.push(convertDocumentToObject(otherContact));
          processedIds.add(otherContact._id.toString());
        }
      }
      
      if (similarContacts.length > 0) {
        similarContacts.unshift(convertDocumentToObject(contact));
        duplicates.push({
          group: similarContacts,
          primaryContact: convertDocumentToObject(contact),
          suggestedMerge: this.suggestMergeData(similarContacts)
        });
        processedIds.add(contact._id.toString());
      }
    }
    
    return duplicates;
  }

  /**
   * Calculate similarity between two names
   */
  private static calculateNameSimilarity(name1: string, name2: string): number {
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, ' ').trim();
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    if (n1 === n2) return 1.0;
    
    // Simple Levenshtein distance calculation
    const matrix = Array(n1.length + 1).fill(null).map(() => Array(n2.length + 1).fill(null));
    
    for (let i = 0; i <= n1.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= n2.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= n1.length; i++) {
      for (let j = 1; j <= n2.length; j++) {
        const cost = n1[i - 1] === n2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const distance = matrix[n1.length][n2.length];
    const maxLength = Math.max(n1.length, n2.length);
    return 1 - (distance / maxLength);
  }

  /**
   * Suggest merge data based on contact group
   */
  private static suggestMergeData(contacts: any[]): any {
    if (contacts.length === 0) return {};
    
    const merged: any = {
      name: '',
      email: '',
      phone: '',
      occupation: '',
      company: '',
      college: '',
      category: '',
      hometown: '',
      currentLocation: '',
      birthday: '',
      tags: [],
      notes: '',
      relationships: []
    };
    
    // Use the first contact as base
    const baseContact = contacts[0];
    merged.name = baseContact.name;
    
    // Merge all unique values
    const allEmails = contacts.map(c => c.email).filter(Boolean);
    const allPhones = contacts.map(c => c.phone).filter(Boolean);
    const allOccupations = contacts.map(c => c.occupation).filter(Boolean);
    const allCompanies = contacts.map(c => c.company).filter(Boolean);
    const allColleges = contacts.map(c => c.college).filter(Boolean);
    const allCategories = contacts.map(c => c.category).filter(Boolean);
    const allHometowns = contacts.map(c => c.hometown).filter(Boolean);
    const allCurrentLocations = contacts.map(c => c.currentLocation).filter(Boolean);
    const allBirthdays = contacts.map(c => c.birthday).filter(Boolean);
    const allTags = contacts.flatMap(c => c.tags || []).filter(Boolean);
    const allNotes = contacts.map(c => c.notes).filter(Boolean);
    const allRelationships = contacts.flatMap(c => c.relationships || []);
    
    // Take the first non-empty value for each field
    merged.email = allEmails[0] || '';
    merged.phone = allPhones[0] || '';
    merged.occupation = allOccupations[0] || '';
    merged.company = allCompanies[0] || '';
    merged.college = allColleges[0] || '';
    merged.category = allCategories[0] || '';
    merged.hometown = allHometowns[0] || '';
    merged.currentLocation = allCurrentLocations[0] || '';
    merged.birthday = allBirthdays[0] || '';
    merged.tags = [...new Set(allTags)];
    merged.notes = allNotes.join('\n\n').trim() || '';
    merged.relationships = allRelationships;
    
    return merged;
  }
} 