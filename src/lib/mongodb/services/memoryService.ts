import { connectToDatabase } from '../config';
import Memory, { IMemory } from '../models/Memory';
import mongoose from 'mongoose';

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
    const memories = await Memory.find({ ownerId }).sort({ timestamp: -1 });
    
    // Convert the MongoDB _id to id for the frontend
    return memories.map(memory => convertDocumentToObject(memory));
  }

  /**
   * Get a memory by ID
   */
  static async getMemoryById(id: string): Promise<IMemory | null> {
    await connectToDatabase();
    const memory = await Memory.findById(id);
    
    if (!memory) return null;
    
    // Convert the MongoDB _id to id for the frontend
    return convertDocumentToObject(memory);
  }

  /**
   * Update a memory
   */
  static async updateMemory(id: string, memoryData: Partial<IMemory>): Promise<IMemory | null> {
    await connectToDatabase();
    const memory = await Memory.findByIdAndUpdate(id, memoryData, { new: true });
    
    if (!memory) return null;
    
    // Convert the MongoDB _id to id for the frontend
    return convertDocumentToObject(memory);
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
    }).sort({ timestamp: -1 });
    
    // Convert the MongoDB _id to id for the frontend
    return memories.map(memory => convertDocumentToObject(memory));
  }

  /**
   * Get memories by linked contact ID
   */
  static async getMemoriesByContactId(ownerId: string, contactId: string): Promise<IMemory[]> {
    await connectToDatabase();
    const memories = await Memory.find({
      ownerId,
      linkedContactIds: contactId
    }).sort({ timestamp: -1 });
    
    // Convert the MongoDB _id to id for the frontend
    return memories.map(memory => convertDocumentToObject(memory));
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
    }).sort({ timestamp: -1 });
    
    // Convert the MongoDB _id to id for the frontend
    return memories.map(memory => convertDocumentToObject(memory));
  }
} 