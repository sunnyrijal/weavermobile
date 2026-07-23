"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Merge, Trash2, Save } from "lucide-react";
import type { Contact } from "@/lib/types";

interface DuplicateGroup {
  group: Contact[];
  primaryContact: Contact;
  suggestedMerge: any;
}

interface ContactMergeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: DuplicateGroup[];
  onMergeComplete: () => void;
}

export function ContactMergeModal({ isOpen, onOpenChange, duplicates, onMergeComplete }: ContactMergeModalProps) {
  const { toast } = useToast();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [mergedContact, setMergedContact] = useState<any>({});
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const currentGroup = duplicates[currentGroupIndex];

  React.useEffect(() => {
    if (currentGroup) {
      setMergedContact(currentGroup.suggestedMerge);
      setSelectedContactIds(currentGroup.group.map(c => c.id));
    }
  }, [currentGroup]);

  const handleMerge = async () => {
    if (selectedContactIds.length < 2) {
      toast({ title: "No duplicates selected", description: "Please select at least 2 contacts to merge.", variant: "destructive" });
      return;
    }

    setIsMerging(true);
    try {
      const response = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mergedContact,
          duplicateIds: selectedContactIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to merge contacts');
      }

      toast({ title: "Merge successful", description: "Contacts have been merged successfully." });
      
      // Move to next group or close if done
      if (currentGroupIndex < duplicates.length - 1) {
        setCurrentGroupIndex(currentGroupIndex + 1);
      } else {
        onOpenChange(false);
        onMergeComplete();
      }
    } catch (error) {
      console.error('Error merging contacts:', error);
      toast({ title: "Merge failed", description: "Failed to merge contacts.", variant: "destructive" });
    } finally {
      setIsMerging(false);
    }
  };

  const handleSkip = () => {
    if (currentGroupIndex < duplicates.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else {
      onOpenChange(false);
      onMergeComplete();
    }
  };

  const handleContactToggle = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContactIds(prev => [...prev, contactId]);
    } else {
      setSelectedContactIds(prev => prev.filter(id => id !== contactId));
    }
  };

  if (!currentGroup) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Merge Duplicate Contacts
          </DialogTitle>
          <DialogDescription>
            Review and merge duplicate contacts. Select which contacts to merge and review the suggested merged data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Group {currentGroupIndex + 1} of {duplicates.length}</span>
            <span>{selectedContactIds.length} contacts selected</span>
          </div>

          {/* Contact selection */}
          <div className="space-y-4">
            <h3 className="font-semibold">Select contacts to merge:</h3>
            <div className="grid gap-3">
              {currentGroup.group.map((contact) => (
                <Card key={contact.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={contact.id}
                      checked={selectedContactIds.includes(contact.id)}
                      onCheckedChange={(checked) => handleContactToggle(contact.id, checked as boolean)}
                    />
                    <Label htmlFor={contact.id} className="flex items-center gap-3 cursor-pointer flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.photoURL} />
                        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {contact.email && <Badge variant="secondary" className="text-xs">{contact.email}</Badge>}
                          {contact.phone && <Badge variant="secondary" className="text-xs">{contact.phone}</Badge>}
                          {contact.company && <Badge variant="secondary" className="text-xs">{contact.company}</Badge>}
                        </div>
                      </div>
                    </Label>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Merged contact preview */}
          <div className="space-y-4">
            <h3 className="font-semibold">Merged contact data:</h3>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={mergedContact.name || ''}
                      onChange={(e) => setMergedContact((prev: any) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={mergedContact.email || ''}
                      onChange={(e) => setMergedContact((prev: any) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={mergedContact.phone || ''}
                      onChange={(e) => setMergedContact((prev: any) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={mergedContact.company || ''}
                      onChange={(e) => setMergedContact((prev: any) => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={mergedContact.occupation || ''}
                      onChange={(e) => setMergedContact((prev: any) => ({ ...prev, occupation: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentLocation">Location</Label>
                    <Input
                      id="currentLocation"
                      value={mergedContact.currentLocation || ''}
                      onChange={(e) => setMergedContact((prev: any) => ({ ...prev, currentLocation: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={mergedContact.notes || ''}
                    onChange={(e) => setMergedContact((prev: any) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleSkip}>
              Skip
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleMerge} disabled={isMerging || selectedContactIds.length < 2}>
                {isMerging ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    Merging...
                  </>
                ) : (
                  <>
                    <Merge className="mr-2 h-4 w-4" />
                    Merge Contacts
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 