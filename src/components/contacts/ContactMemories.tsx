"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useMemories } from '@/hooks/useMemories';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Brain, Calendar, Tag, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ClientSideFormattedDate from '@/components/shared/ClientSideFormattedDate';
import { Memory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ContactMemoriesProps {
  contactId: string;
}

export function ContactMemories({ contactId }: ContactMemoriesProps) {
  const { getMemoriesByContactId, deleteMemory } = useMemories();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const memoriesFetchedRef = useRef(false);

  useEffect(() => {
    const fetchMemories = async () => {
      if (!contactId) return;
      
      setLoading(true);
      try {
        const contactMemories = await getMemoriesByContactId(contactId);
        setMemories(contactMemories);
        memoriesFetchedRef.current = true;
      } catch (error) {
        console.error('Error fetching memories:', error);
        toast({ 
          title: 'Error',
          description: 'Failed to fetch memories for this contact',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (!memoriesFetchedRef.current || memoriesFetchedRef.current !== contactId) {
      memoriesFetchedRef.current = contactId;
      fetchMemories();
    }
  }, [contactId, getMemoriesByContactId, toast]);

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      const success = await deleteMemory(memoryId);
      if (success) {
        setMemories(prev => prev.filter(memory => memory.id !== memoryId));
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast({ 
        title: 'Error',
        description: 'Failed to delete memory',
        variant: 'destructive'
      });
    }
  };

  const refreshMemories = async () => {
    if (!contactId) return;
    
    setLoading(true);
    try {
      const contactMemories = await getMemoriesByContactId(contactId);
      setMemories(contactMemories);
      toast({ 
        title: 'Memories Refreshed',
        description: 'The memories list has been updated'
      });
    } catch (error) {
      console.error('Error refreshing memories:', error);
      toast({ 
        title: 'Error',
        description: 'Failed to refresh memories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Memories</h3>
        {[1, 2].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Memories</h3>
        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Brain className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No memories associated with this contact yet.</p>
            <p className="text-sm">Use the memory button to create memories and link them to this contact.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Memories {memories.length > 0 ? `(${memories.length})` : ''}</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshMemories}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>
      {memories.map(memory => (
        <Card key={memory.id} className="group">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base">{memory.summary.length > 60 ? `${memory.summary.substring(0, 60)}...` : memory.summary}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  <ClientSideFormattedDate date={memory.timestamp} format="PPP" />
                </CardDescription>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Memory</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this memory? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteMemory(memory.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">{memory.summary}</p>
            {memory.entities && (
              <div className="space-y-2">
                {memory.entities.people && memory.entities.people.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {memory.entities.people.map((person, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{person}</Badge>
                    ))}
                  </div>
                )}
                {memory.entities.locations && memory.entities.locations.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {memory.entities.locations.map((location, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-blue-50">{location}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            {memory.tags && memory.tags.length > 0 && (
              <div className="flex items-center gap-1 mt-3 pt-3 border-t">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {memory.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 