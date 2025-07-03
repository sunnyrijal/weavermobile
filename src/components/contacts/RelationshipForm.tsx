"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type RelationshipType = "Dad" | "Mom" | "Brother" | "Sister" | "Friend" | "Partner" | "Pet" | "Cousin" | "Child" | "Colleague" | "Other";

interface RelationshipFormProps {
  contacts: { id: string; name: string; category?: string }[];
  initial?: {
    relatedContactId?: string;
    name?: string;
    type?: RelationshipType;
    customLabel?: string;
    notes?: string;
    bidirectional?: boolean;
  };
  onSave: (data: { 
    relatedContactId?: string; 
    name?: string; 
    type: RelationshipType; 
    customLabel?: string; 
    notes?: string;
    bidirectional: boolean;
  }) => void;
  onCancel: () => void;
}

const RELATIONSHIP_TYPES: RelationshipType[] = ["Dad", "Mom", "Brother", "Sister", "Friend", "Partner", "Pet", "Cousin", "Child", "Colleague", "Other"];

export default function RelationshipForm({ contacts, initial, onSave, onCancel }: RelationshipFormProps) {
  const [type, setType] = useState<RelationshipType>(initial?.type || "Friend");
  const [relatedContactId, setRelatedContactId] = useState(initial?.relatedContactId || "");
  const [name, setName] = useState(initial?.name || "");
  const [customLabel, setCustomLabel] = useState(initial?.customLabel || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [bidirectional, setBidirectional] = useState(initial?.bidirectional !== false); // Default to true

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      relatedContactId: relatedContactId || undefined,
      name: relatedContactId ? undefined : name,
      type,
      customLabel: customLabel || undefined,
      notes: notes || undefined,
      bidirectional
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="related-contact">Related Contact</Label>
        <Select value={relatedContactId} onValueChange={setRelatedContactId}>
          <SelectTrigger id="related-contact">
            <SelectValue placeholder="Select a contact" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {contacts.map((contact) => (
              <SelectItem key={contact.id} value={contact.id}>
                {contact.name} {contact.category ? `(${contact.category})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!relatedContactId && (
        <div className="space-y-2">
          <Label htmlFor="name">Contact Name (if not in system yet)</Label>
          <Input id="name" placeholder="Enter name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="relationship-type">Relationship Type</Label>
        <Select value={type} onValueChange={(value: RelationshipType) => setType(value)}>
          <SelectTrigger id="relationship-type">
            <SelectValue placeholder="Select a relationship type" />
          </SelectTrigger>
          <SelectContent>
            {RELATIONSHIP_TYPES.map((relType) => (
              <SelectItem key={relType} value={relType}>{relType}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-label">Custom Label (optional)</Label>
        <Input id="custom-label" placeholder="E.g., Best friend from college" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" placeholder="Add any additional details about this relationship" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>
      
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="bidirectional" 
          checked={bidirectional} 
          onChange={(e) => setBidirectional(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-ring"
        />
        <Label htmlFor="bidirectional" className="text-sm">Automatically create inverse relationship</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
} 