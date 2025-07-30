import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Memory } from '@/lib/types';

interface MemoriesContextValue {
  memories: Memory[];
  loading: boolean;
  error: string | null;
  fetchMemories: () => Promise<void>;
  createMemory: (memoryData: Partial<Memory>) => Promise<Memory | null>;
  updateMemory: (id: string, memoryData: Partial<Memory>) => Promise<Memory | null>;
  deleteMemory: (id: string) => Promise<boolean>;
  searchMemories: (query: string) => Promise<Memory[]>;
  getMemoriesByTag: (tag: string) => Promise<Memory[]>;
  getMemoriesByContactId: (contactId: string) => Promise<Memory[]>;
}

const MemoriesContext = createContext<MemoriesContextValue | undefined>(undefined);

interface MemoriesProviderProps {
  children: React.ReactNode;
}

export function MemoriesProvider({ children }: MemoriesProviderProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a ref to track if memories have been fetched
  const memoriesFetchedRef = useRef(false);

  // Fetch all memories for the current user
  const fetchMemories = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/memories?ownerId=${currentUser.uid}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMemories(data.memories || []);
      memoriesFetchedRef.current = true;
    } catch (err) {
      console.error('Error fetching memories:', err);
      setError('Failed to fetch memories');
      toast({ 
        title: 'Error',
        description: 'Failed to fetch memories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser, toast]);

  // Create a new memory
  const createMemory = useCallback(async (memoryData: Partial<Memory>) => {
    if (!currentUser) {
      toast({ 
        title: 'Error',
        description: 'You must be logged in to create memories',
        variant: 'destructive'
      });
      return null;
    }
    
    try {
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...memoryData,
          ownerId: currentUser.uid,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update the local state with the new memory
      setMemories(prev => [data.memory, ...prev]);
      
      toast({ 
        title: 'Success',
        description: 'Memory created successfully',
      });
      
      return data.memory;
    } catch (err) {
      console.error('Error creating memory:', err);
      toast({ 
        title: 'Error',
        description: 'Failed to create memory',
        variant: 'destructive'
      });
      return null;
    }
  }, [currentUser, toast]);

  // Update a memory
  const updateMemory = useCallback(async (id: string, memoryData: Partial<Memory>) => {
    try {
      const response = await fetch(`/api/memories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoryData),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update the local state with the updated memory
      setMemories(prev => prev.map(memory => memory.id === id ? data.memory : memory));
      
      toast({ 
        title: 'Success',
        description: 'Memory updated successfully',
      });
      
      return data.memory;
    } catch (err) {
      console.error('Error updating memory:', err);
      toast({ 
        title: 'Error',
        description: 'Failed to update memory',
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);

  // Delete a memory
  const deleteMemory = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/memories/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Update the local state by removing the deleted memory
      setMemories(prev => prev.filter(memory => memory.id !== id));
      
      toast({ 
        title: 'Success',
        description: 'Memory deleted successfully',
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting memory:', err);
      toast({ 
        title: 'Error',
        description: 'Failed to delete memory',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  // Search memories
  const searchMemories = useCallback(async (query: string) => {
    if (!currentUser) return [];
    
    try {
      const response = await fetch(`/api/memories/search?ownerId=${currentUser.uid}&q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.memories || [];
    } catch (err) {
      console.error('Error searching memories:', err);
      toast({ 
        title: 'Error',
        description: 'Failed to search memories',
        variant: 'destructive'
      });
      return [];
    }
  }, [currentUser, toast]);

  // Get memories by tag
  const getMemoriesByTag = useCallback(async (tag: string) => {
    if (!currentUser) return [];
    
    try {
      const response = await fetch(`/api/memories/search?ownerId=${currentUser.uid}&tag=${encodeURIComponent(tag)}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.memories || [];
    } catch (err) {
      console.error('Error fetching memories by tag:', err);
      toast({ 
        title: 'Error',
        description: 'Failed to fetch memories by tag',
        variant: 'destructive'
      });
      return [];
    }
  }, [currentUser, toast]);

  // Get memories by contact ID
  const getMemoriesByContactId = useCallback(async (contactId: string) => {
    if (!currentUser) return [];
    
    try {
      const response = await fetch(`/api/memories/search?ownerId=${currentUser.uid}&contactId=${encodeURIComponent(contactId)}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.memories || [];
    } catch (err) {
      console.error('Error fetching memories by contact ID:', err);
      toast({ 
        title: 'Error',
        description: 'Failed to fetch memories by contact ID',
        variant: 'destructive'
      });
      return [];
    }
  }, [currentUser, toast]);

  // Fetch memories on component mount and when currentUser changes
  useEffect(() => {
    const shouldFetchMemories = currentUser && (!memoriesFetchedRef.current || memories.length === 0);
    
    if (shouldFetchMemories) {
      fetchMemories();
    }
  }, [currentUser, fetchMemories, memories.length]);

  const value: MemoriesContextValue = {
    memories,
    loading,
    error,
    fetchMemories,
    createMemory,
    updateMemory,
    deleteMemory,
    searchMemories,
    getMemoriesByTag,
    getMemoriesByContactId
  };

  return (
    <MemoriesContext.Provider value={value}>
      {children}
    </MemoriesContext.Provider>
  );
}

export function useMemoriesContext() {
  const context = useContext(MemoriesContext);
  if (context === undefined) {
    throw new Error('useMemoriesContext must be used within a MemoriesProvider');
  }
  return context;
} 