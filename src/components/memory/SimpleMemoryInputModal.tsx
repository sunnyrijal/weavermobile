"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save, XCircle, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';

interface SimpleMemoryInputModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SimpleMemoryInputModal({ isOpen, onOpenChange }: SimpleMemoryInputModalProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [memoryText, setMemoryText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveMemory = async () => {
    if (!currentUser) {
      toast({title: "Not Logged In", description: "Please log in to save memories.", variant: "destructive"});
      return;
    }
    
    if (!memoryText.trim()) {
      toast({ title: "No Memory Content", description: "Please enter some text for your memory.", variant: "destructive"});
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerId: currentUser.uid,
          timestamp: new Date(),
          inputType: 'text',
          transcript: memoryText,
          summary: memoryText,
          linkedContactIds: [],
          tags: [],
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      toast({ title: "Memory Saved", description: "Your memory has been saved successfully." });
      setMemoryText('');
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving memory:", error);
      toast({ title: "Save Error", description: "Failed to save memory to database.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setMemoryText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Brain className="text-primary"/> Add New Memory</DialogTitle>
          <DialogDescription>
            Capture memories using text. You can add more details later.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto space-y-4 pr-2">
          <div className="space-y-2">
            <Label htmlFor="memory-text">Write down your memory:</Label>
            <Textarea
              id="memory-text"
              placeholder="Type your memory here..."
              value={memoryText}
              onChange={(e) => setMemoryText(e.target.value)}
              rows={6}
              className="min-h-[150px]"
            />
          </div>
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              <XCircle className="mr-2 h-4 w-4"/>Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSaveMemory} 
            disabled={isSaving || !memoryText.trim()} 
            className="w-full sm:w-auto"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Memory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 