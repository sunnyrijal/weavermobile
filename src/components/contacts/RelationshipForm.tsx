import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type RelationshipType = "Dad" | "Mom" | "Brother" | "Sister" | "Friend" | "Partner" | "Pet" | "Other";

interface RelationshipFormProps {
  contacts: { id: string; name: string; category?: string }[];
  initial?: {
    relatedContactId?: string;
    name?: string;
    type?: RelationshipType;
    customLabel?: string;
    notes?: string;
  };
  onSave: (data: { relatedContactId?: string; name?: string; type: RelationshipType; customLabel?: string; notes?: string }) => void;
  onCancel: () => void;
}

const RELATIONSHIP_TYPES: RelationshipType[] = ["Dad", "Mom", "Brother", "Sister", "Friend", "Partner", "Pet", "Other"];

export default function RelationshipForm({ contacts, initial, onSave, onCancel }: RelationshipFormProps) {
  const [type, setType] = useState<RelationshipType>(initial?.type || "Friend");
  const [relatedContactId, setRelatedContactId] = useState(initial?.relatedContactId || "");
  const [name, setName] = useState(initial?.name || "");
  const [customLabel, setCustomLabel] = useState(initial?.customLabel || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      relatedContactId: relatedContactId || undefined,
      name: relatedContactId ? undefined : name,
      type,
      customLabel: customLabel || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 font-medium text-sm">Relationship Type</label>
        <Select value={type} onValueChange={v => setType(v as RelationshipType)}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {RELATIONSHIP_TYPES.map(rt => (
              <SelectItem key={rt} value={rt}>{rt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block mb-1 font-medium text-sm">Contact</label>
        <Select value={relatedContactId} onValueChange={v => setRelatedContactId(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select existing contact (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">-- Not in contacts --</SelectItem>
            {contacts.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!relatedContactId && (
          <Input
            className="mt-2"
            placeholder="Enter name if not in contacts"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}
      </div>
      <div>
        <label className="block mb-1 font-medium text-sm">Custom Label <span className="text-xs text-muted-foreground">(optional)</span></label>
        <Input value={customLabel} onChange={e => setCustomLabel(e.target.value)} placeholder="e.g. Godfather, Roommate" />
      </div>
      <div>
        <label className="block mb-1 font-medium text-sm">Notes <span className="text-xs text-muted-foreground">(optional)</span></label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about this relationship..." />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="default">Save</Button>
      </div>
    </form>
  );
} 