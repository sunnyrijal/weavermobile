import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, PawPrint, Pencil, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import RelationshipForm, { RelationshipType } from "./RelationshipForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useContacts } from "@/hooks/useContacts";

interface Relationship {
  relatedContactId?: string;
  name?: string;
  type: string;
  customLabel?: string;
  notes?: string;
}

interface RelatedContact {
  id: string;
  name: string;
  photoURL?: string;
  category?: string;
}

interface ContactRelationshipsProps {
  relationships: Relationship[];
  relatedContacts: Record<string, RelatedContact | undefined>;
  contactName: string;
  editMode?: boolean;
  contactsList?: { id: string; name: string; category?: string }[]; // for add/edit
  onChange?: (updated: Relationship[]) => void; // called after add/edit/remove
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  Dad: "bg-blue-100 text-blue-800",
  Mom: "bg-pink-100 text-pink-800",
  Brother: "bg-cyan-100 text-cyan-800",
  Sister: "bg-rose-100 text-rose-800",
  Friend: "bg-green-100 text-green-800",
  Partner: "bg-purple-100 text-purple-800",
  Pet: "bg-yellow-100 text-yellow-800",
  Other: "bg-gray-100 text-gray-800",
};

export default function ContactRelationships({ relationships, relatedContacts, contactName, editMode = false, contactsList = [], onChange }: ContactRelationshipsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const { createBidirectionalRelationship } = useContacts({ initialLoad: false });

  const handleAdd = async (data: any) => {
    setShowForm(false);

    // Handle bidirectional relationship if requested
    if (data.bidirectional && data.relatedContactId && onChange) {
      try {
        // If the contactId isn't available directly (common in the edit page scenario)
        // we need to find it from the parent component's context
        // The assumption is that we're editing a specific contact's relationships
        const contactResponse = await fetch(`/api/contacts?name=${encodeURIComponent(contactName)}`);
        if (contactResponse.ok) {
          const contactData = await contactResponse.json();
          if (contactData.contacts && contactData.contacts.length > 0) {
            const contactId = contactData.contacts[0].id;
            
            // Create the bidirectional relationship
            await createBidirectionalRelationship(
              contactId, 
              data.relatedContactId, 
              data.type, 
              data.customLabel
            );
            
            // Fetch updated relationships for this contact
            const updatedContactResponse = await fetch(`/api/contacts/${contactId}`);
            if (updatedContactResponse.ok) {
              const updatedContact = await updatedContactResponse.json();
              if (onChange && updatedContact.contact.relationships) {
                onChange(updatedContact.contact.relationships);
                return; // We've already updated with the latest relationships
              }
            }
          }
        }
      } catch (error) {
        console.error("Error creating bidirectional relationship:", error);
      }
    }
    
    // If bidirectional failed or wasn't requested, fall back to normal behavior
    if (onChange) onChange([...(relationships || []), data]);
  };

  const handleEdit = async (idx: number, data: any) => {
    setEditIdx(null);
    
    if (data.bidirectional && data.relatedContactId && onChange) {
      // Handle bidirectional updates similar to handleAdd
      // First, get the current relationship to compare with the new one
      const currentRel = relationships[idx];
      
      // Only proceed if the relationship changed
      if (currentRel.relatedContactId !== data.relatedContactId || 
          currentRel.type !== data.type) {
        try {
          // Same logic as handleAdd to find the contactId
          const contactResponse = await fetch(`/api/contacts?name=${encodeURIComponent(contactName)}`);
          if (contactResponse.ok) {
            const contactData = await contactResponse.json();
            if (contactData.contacts && contactData.contacts.length > 0) {
              const contactId = contactData.contacts[0].id;
              
              await createBidirectionalRelationship(
                contactId, 
                data.relatedContactId, 
                data.type, 
                data.customLabel
              );
              
              // Fetch updated relationships
              const updatedContactResponse = await fetch(`/api/contacts/${contactId}`);
              if (updatedContactResponse.ok) {
                const updatedContact = await updatedContactResponse.json();
                if (onChange && updatedContact.contact.relationships) {
                  onChange(updatedContact.contact.relationships);
                  return;
                }
              }
            }
          }
        } catch (error) {
          console.error("Error updating bidirectional relationship:", error);
        }
      }
    }
    
    // Fall back to normal behavior
    if (onChange) onChange(relationships.map((r, i) => (i === idx ? data : r)));
  };

  const handleRemove = (idx: number) => {
    if (onChange) onChange(relationships.filter((_, i) => i !== idx));
  };

  if (!relationships || relationships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Users className="w-10 h-10 text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-sm">No relationships defined for {contactName}.</p>
        {editMode && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}><Plus className="mr-2 h-4 w-4" /> Add Relationship</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Relationship</DialogTitle>
              </DialogHeader>
              <RelationshipForm contacts={contactsList} onSave={handleAdd} onCancel={() => setShowForm(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }
  return (
    <div>
      {editMode && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button variant="outline" className="mb-4" onClick={() => setShowForm(true)}><Plus className="mr-2 h-4 w-4" /> Add Relationship</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Relationship</DialogTitle>
            </DialogHeader>
            <RelationshipForm contacts={contactsList} onSave={handleAdd} onCancel={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      )}
      <ul className="space-y-2 sm:space-y-3">
        {relationships.map((rel, idx) => {
          const related = rel.relatedContactId ? relatedContacts[rel.relatedContactId] : undefined;
          const isPet = related?.category === "Pet" || rel.type === "Pet";
          const relType = rel.customLabel || rel.type;
          return (
            <li key={(rel.relatedContactId || rel.name || "") + idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 gap-2 sm:gap-0">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  {isPet ? (
                    <PawPrint className="w-6 h-6 text-yellow-700 mx-auto my-auto" />
                  ) : related?.photoURL ? (
                    <AvatarImage src={related.photoURL} alt={related.name} />
                  ) : (
                    <AvatarFallback>{related?.name ? related.name[0] : rel.name ? rel.name[0] : "?"}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="font-medium text-sm">
                    {related?.name || 
                     rel.name || 
                     (rel.customLabel ? `${rel.customLabel}` : (rel.type === "Pet" ? "Pet" : "Unknown contact"))}
                  </div>
                  <Badge className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${RELATIONSHIP_COLORS[relType] || RELATIONSHIP_COLORS.Other}`}>{relType}</Badge>
                  {rel.notes && <div className="text-xs text-muted-foreground mt-1">{rel.notes}</div>}
                </div>
              </div>
              <div className="flex gap-2 items-center mt-2 sm:mt-0">
                {related?.id && (
                  <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto text-xs sm:text-sm h-7 sm:h-8">
                    <Link href={`/contacts/${related.id}`}>View Profile</Link>
                  </Button>
                )}
                {editMode && (
                  <>
                    <Dialog open={editIdx === idx} onOpenChange={open => setEditIdx(open ? idx : null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setEditIdx(idx)}><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Relationship</DialogTitle>
                        </DialogHeader>
                        <RelationshipForm
                          contacts={contactsList}
                          initial={rel}
                          onSave={data => handleEdit(idx, data)}
                          onCancel={() => setEditIdx(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={() => handleRemove(idx)}><Trash2 className="w-4 h-4 mr-1" /> Remove</Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
} 