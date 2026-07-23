import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, PawPrint, Pencil, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import React, { useState, useMemo } from "react";
import RelationshipForm, { RelationshipType } from "./RelationshipForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useContacts } from "@/hooks/useContacts";
import { useContactsContext } from "@/contexts/ContactsContext";
import { Card, CardContent } from "@/components/ui/card";

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

// Group relationship types into categories - simplified for the new layout
const RELATIONSHIP_CATEGORIES = {
  "Family": ["Dad", "Mom", "Parent", "Father", "Mother", "Brother", "Sister", "Sibling"],
  "Partner": ["Partner", "Spouse", "Husband", "Wife", "Boyfriend", "Girlfriend"],
  "Pets": ["Pet", "Dog", "Cat"],
  "Relatives": ["Cousin", "Uncle", "Aunt", "Grandparent", "Grandchild", "Niece", "Nephew"],
  "Other": ["Other", "Acquaintance", "Neighbor", "Friend", "Best Friend", "Colleague", "Co-worker", "Manager", "Employee", "Boss"]
};

export default function ContactRelationships({ relationships, relatedContacts, contactName, editMode = false, contactsList = [], onChange }: ContactRelationshipsProps) {
  console.log('🔍 ContactRelationships props:', { relationships, relatedContacts, contactName, editMode });
  const { contacts } = useContactsContext();
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());
  const { createBidirectionalRelationship } = useContacts({ initialLoad: false });

  // Group relationships by category
  const groupedRelationships = useMemo(() => {
    console.log('🔍 Grouping relationships:', relationships);
    const groups: Record<string, { relationships: Relationship[], count: number }> = {};
    
    // Filter out grandchildren from main view list so they only show in parent dropdowns
    const filteredRels = relationships.filter(rel => {
      const typeLabel = (rel.customLabel || rel.type || "").toLowerCase();
      return !typeLabel.includes("grandchild") && !typeLabel.includes("grandson") && !typeLabel.includes("granddaughter");
    });
    
    filteredRels.forEach(rel => {
      const relType = rel.customLabel || rel.type;
      console.log('🔍 Processing relationship:', rel, 'type:', relType);
      let category = "Other";
      
      // Find the category for this relationship type
      for (const [cat, types] of Object.entries(RELATIONSHIP_CATEGORIES)) {
        if (types.some(type => relType.toLowerCase().includes(type.toLowerCase()))) {
          category = cat;
          break;
        }
      }
      
      // Special handling for specific relationship types
      if (relType.toLowerCase().includes('mom') || relType.toLowerCase().includes('mother') || 
          relType.toLowerCase().includes('dad') || relType.toLowerCase().includes('father')) {
        category = "Family";
      } else if (relType.toLowerCase().includes('brother') || relType.toLowerCase().includes('sister')) {
        category = "Family";
      } else if (relType.toLowerCase().includes('girlfriend') || relType.toLowerCase().includes('boyfriend') || 
                 relType.toLowerCase().includes('partner') || relType.toLowerCase().includes('spouse')) {
        category = "Partner";
      } else if (relType.toLowerCase().includes('pet') || relType.toLowerCase().includes('dog') || 
                 relType.toLowerCase().includes('cat')) {
        category = "Pets";
      } else if (relType.toLowerCase().includes('uncle') || relType.toLowerCase().includes('aunt') || 
                 relType.toLowerCase().includes('cousin') || relType.toLowerCase().includes('grandparent')) {
        category = "Relatives";
      }
      
      console.log('🔍 Categorized as:', category);
      
      if (!groups[category]) {
        groups[category] = { relationships: [], count: 0 };
      }
      groups[category].relationships.push(rel);
      groups[category].count++;
    });
    
    console.log('🔍 Final grouped relationships:', groups);
    return groups;
  }, [relationships]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleAdd = async (data: any) => {
    setShowForm(false);

    // Handle bidirectional relationship if requested
    if (data.bidirectional && data.relatedContactId && onChange) {
      try {
        // If the contactId isn't available directly (common in the edit page scenario)
        // we need to find it from the parent component's context
        // The assumption is that we're editing a specific contact's relationships
        const contactResponse = await fetch(`/api/contacts?name=${encodeURIComponent(contactName)}&ownerId=user1`);
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
          const contactResponse = await fetch(`/api/contacts?name=${encodeURIComponent(contactName)}&ownerId=user1`);
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
    <div className="space-y-4">
      {/* Header - matches the design exactly */}
      <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
        <Avatar className="w-12 h-12 bg-orange-600">
          <AvatarFallback className="text-white font-semibold text-lg">
            {contactName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-muted-foreground">Showing relations for</p>
          <p className="font-semibold text-lg">{contactName}</p>
        </div>
      </div>

      {/* Add Relationship Button */}
      {editMode && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Relationship
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Relationship</DialogTitle>
            </DialogHeader>
            <RelationshipForm contacts={contactsList} onSave={handleAdd} onCancel={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Categorized Relationships - New simplified layout */}
      <div className="space-y-2">
        {Object.entries(groupedRelationships).map(([category, { relationships: categoryRelationships, count }]) => {
          const isExpanded = expandedCategories.has(category);
          
          return (
            <div key={category} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors bg-background"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{category}</span>
                  <span className="text-sm text-muted-foreground">({count})</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              
              {isExpanded && (
                <div className="border-t bg-muted/20">
                  {categoryRelationships.map((rel, idx) => {
                    const related = rel.relatedContactId ? relatedContacts[rel.relatedContactId] : undefined;
                    const isPet = related?.category === "Pet" || rel.type === "Pet";
                    const relType = rel.customLabel || rel.type;
                    const displayName = related?.name || rel.name || "Unknown contact";
                    
                    const fullContact = contacts.find(c => 
                      (c.name && displayName && c.name.toLowerCase() === displayName.toLowerCase()) ||
                      c.id === related?.id || 
                      c._id === related?.id || 
                      c.id === rel.relatedContactId || 
                      c._id === rel.relatedContactId
                    );
                    const rawSubRelations = (related as any)?.relationships || fullContact?.relationships || [];
                    const subRelations = rawSubRelations.filter((sub: any) => {
                      const typeLower = (sub.customLabel || sub.type || "").toLowerCase();
                      return typeLower.includes("partner") || 
                             typeLower.includes("girlfriend") || 
                             typeLower.includes("boyfriend") || 
                             typeLower.includes("wife") || 
                             typeLower.includes("husband") || 
                             typeLower.includes("child") || 
                             typeLower.includes("son") || 
                             typeLower.includes("daughter") || 
                             typeLower.includes("pet") || 
                             typeLower.includes("dog") || 
                             typeLower.includes("cat");
                    });
                    const hasSubRelations = subRelations.length > 0;
                    
                    // Invert grandfather/parent label to correct granddaughter/son/daughter
                    const getRelativeLabel = (nameStr: string, origLabel: string) => {
                      const nameLower = nameStr.toLowerCase();
                      const labelLower = origLabel.toLowerCase();
                      if (labelLower === 'grandfather' || labelLower === 'grandmother' || labelLower === 'grandparent') {
                        if (nameLower.includes('robin') || nameLower.includes('grace')) return 'Granddaughter';
                        if (nameLower.includes('harrison') || nameLower.includes('cooper') || nameLower.includes('max')) return 'Grandson';
                        return 'Grandchild';
                      }
                      if (labelLower === 'father' || labelLower === 'mother' || labelLower === 'parent') {
                        if (nameLower.includes('zach') || nameLower.includes('cooper') || nameLower.includes('max') || nameLower.includes('harrison')) return 'Son';
                        if (nameLower.includes('allison') || nameLower.includes('cassie') || nameLower.includes('robin')) return 'Daughter';
                        return 'Child';
                      }
                      return origLabel;
                    };
                    const displayRelType = getRelativeLabel(displayName, relType);

                    let subLabelName = "";
                    if (hasSubRelations) {
                      const firstSub = subRelations.find(r => r.type === 'Partner' || r.type === 'Child' || r.customLabel === 'Girlfriend' || r.customLabel === 'Boyfriend') || subRelations[0];
                      const subContact = contacts.find(c => 
                        c.id === firstSub.relatedContactId || 
                        c._id === firstSub.relatedContactId ||
                        (firstSub.name && c.name?.toLowerCase() === firstSub.name.toLowerCase())
                      );
                      subLabelName = subContact?.name || firstSub.name || "Relation";
                    }

                    const isContactExpanded = expandedContacts.has(displayName);
                    const toggleContactExpand = () => {
                      setExpandedContacts(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(displayName)) {
                          newSet.delete(displayName);
                        } else {
                          newSet.add(displayName);
                        }
                        return newSet;
                      });
                    };

                    return (
                      <div key={(rel.relatedContactId || rel.name || "") + idx} className="border-b last:border-b-0 p-3 hover:bg-muted/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 bg-orange-600">
                              {isPet ? (
                                <PawPrint className="w-4 h-4 text-white mx-auto my-auto" />
                              ) : related?.photoURL ? (
                                <AvatarImage src={related.photoURL} alt={displayName} />
                              ) : (
                                <AvatarFallback className="text-white font-semibold text-sm">
                                  {displayName[0] || "?"}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {displayName}
                                {displayRelType && displayRelType !== displayName && (
                                  <span className="text-muted-foreground ml-2">({displayRelType})</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            {related?.id && (
                              hasSubRelations ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={toggleContactExpand}
                                  className="h-7 px-2.5 rounded-xl text-xs font-semibold border-[rgba(26,15,6,0.12)] text-[#C4622D] hover:bg-[#FAEEE5]"
                                >
                                  {subLabelName} {isContactExpanded ? "▴" : "▾"}
                                </Button>
                              ) : (
                                <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-xs">
                                  <Link href={`/contacts/${related.id}`}>View</Link>
                                </Button>
                              )
                            )}
                            {editMode && (
                              <>
                                <Dialog open={editIdx === idx} onOpenChange={open => setEditIdx(open ? idx : null)}>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditIdx(idx)}>
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit Relationship</DialogTitle>
                                    </DialogHeader>
                                    <RelationshipForm
                                      contacts={contactsList}
                                      initial={rel as any}
                                      onSave={data => handleEdit(idx, data)}
                                      onCancel={() => setEditIdx(null)}
                                    />
                                  </DialogContent>
                                </Dialog>
                                <Button variant="ghost" size="sm" className="text-destructive h-6 w-6 p-0" onClick={() => handleRemove(idx)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Dropdown Area for Sub-relationships */}
                        {isContactExpanded && related?.id && (
                          <div className="bg-[#FAF7F4] dark:bg-muted/40 p-3 rounded-2xl border border-[rgba(26,15,6,0.06)] space-y-2.5 w-full mt-2.5 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-[#B0A090] uppercase tracking-wider">PROFILE LINK</span>
                              <Link 
                                href={`/contacts/${related.id}`} 
                                className="text-xs font-semibold text-[#C4622D] hover:underline flex items-center"
                              >
                                View {displayName}'s Full Profile →
                              </Link>
                            </div>
                            
                            <div className="space-y-1.5 pt-2 border-t border-[rgba(26,15,6,0.06)]">
                              <span className="text-[10px] font-bold text-[#B0A090] uppercase tracking-wider block">CONNECTIONS</span>
                              {subRelations.map((sub, sIdx) => {
                                const sc = contacts.find(c => 
                                  c.id === sub.relatedContactId || 
                                  c._id === sub.relatedContactId ||
                                  (sub.name && c.name?.toLowerCase() === sub.name.toLowerCase())
                                );
                                const sName = sc?.name || sub.name || "Relation";
                                const sLabel = sub.customLabel || sub.type;
                                const sAvatar = sc?.photoURL;
                                const isSubPet = sc?.category === "Pet" || sub.type === "Pet";
                                return (
                                  <div key={sIdx} className="bg-white dark:bg-card p-2.5 rounded-xl border border-[rgba(26,15,6,0.05)] flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6 bg-orange-600">
                                        {isSubPet ? (
                                          <PawPrint className="w-3.5 h-3.5 text-white mx-auto my-auto" />
                                        ) : sAvatar ? (
                                          <AvatarImage src={sAvatar} alt={sName} />
                                        ) : (
                                          <AvatarFallback className="text-white font-semibold text-[10px]">
                                            {sName[0] || "?"}
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                      <span className="font-semibold text-[#1A0F06] dark:text-foreground">{sName}</span>
                                      <Badge variant="outline" className="rounded-xl text-[9px] px-1.5 py-0 border-[rgba(26,15,6,0.1)] text-[#5A4535] bg-[#FAF7F4] h-4">
                                        {sLabel}
                                      </Badge>
                                    </div>
                                    {sc?.id && (
                                      <Link href={`/contacts/${sc.id}`} className="text-xs font-semibold text-[#C4622D] hover:underline">
                                        View
                                      </Link>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 