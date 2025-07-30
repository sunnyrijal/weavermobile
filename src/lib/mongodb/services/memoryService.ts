import { connectToDatabase } from '../config';
import Memory, { IMemory } from '../models/Memory';
import mongoose from 'mongoose';
import JournalEntry from '../models/Journal';

// Helper function to convert MongoDB document to plain object with id
const convertDocumentToObject = (doc: IMemory): any => {
  const obj = doc.toObject();
  obj.id = obj._id.toString();
  return obj;
};

export class MemoryService {
  /**
   * Create a new memory
   */
  static async createMemory(memoryData: Partial<IMemory>): Promise<IMemory> {
    await connectToDatabase();
    const memory = new Memory(memoryData);
    await memory.save();
    
    // Convert the MongoDB _id to id for the frontend
    return convertDocumentToObject(memory);
  }

  /**
   * Get all memories for a specific owner
   */
  static async getMemoriesByOwnerId(ownerId: string): Promise<IMemory[]> {
    await connectToDatabase();
    const memories = await Memory.find({ ownerId }, null, { lean: true }).sort({ timestamp: -1 });
    
    return memories.map((memory: any) => ({ ...memory, id: memory._id.toString() }));
  }

  /**
   * Get a memory by ID
   */
  static async getMemoryById(id: string): Promise<IMemory | null> {
    await connectToDatabase();
    const memory = await Memory.findById(id, null, { lean: true });
    
    if (!memory) return null;
    
    return { ...memory, id: memory._id.toString() } as any;
  }

  /**
   * Update a memory
   */
  static async updateMemory(id: string, memoryData: Partial<IMemory>): Promise<IMemory | null> {
    await connectToDatabase();
    const memory = await Memory.findByIdAndUpdate(id, memoryData, { new: true, lean: true });
    
    if (!memory) return null;
    
    return { ...memory, id: memory._id.toString() } as any;
  }

  /**
   * Delete a memory
   */
  static async deleteMemory(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await Memory.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Get memories by tag
   */
  static async getMemoriesByTag(ownerId: string, tag: string): Promise<IMemory[]> {
    await connectToDatabase();
    const memories = await Memory.find({
      ownerId,
      tags: tag
    }, null, { lean: true }).sort({ timestamp: -1 });
    
    return memories.map((memory: any) => ({ ...memory, id: memory._id.toString() }));
  }

  /**
   * Get memories by linked contact ID
   */
  static async getMemoriesByContactId(ownerId: string, contactId: string): Promise<IMemory[]> {
    await connectToDatabase();
    const memories = await Memory.find({
      ownerId,
      linkedContactIds: contactId
    }, null, { lean: true }).sort({ timestamp: -1 });
    
    return memories.map((memory: any) => ({ ...memory, id: memory._id.toString() }));
  }

  /**
   * Search memories by text content
   */
  static async searchMemories(ownerId: string, searchTerm: string): Promise<IMemory[]> {
    await connectToDatabase();
    const memories = await Memory.find({
      ownerId,
      $or: [
        { summary: { $regex: searchTerm, $options: 'i' } },
        { transcript: { $regex: searchTerm, $options: 'i' } }
      ]
    }, null, { lean: true }).sort({ timestamp: -1 });

    return memories.map((memory: any) => ({ ...memory, id: memory._id.toString() }));
  }
    
  static async createJournalEntry({ ownerId, content, timestamp, linkedContactIds, tags }) {
    return await JournalEntry.create({ ownerId, content, timestamp, linkedContactIds, tags });
  }
} 