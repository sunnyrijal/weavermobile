"use client";

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useContactsContext } from '@/contexts/ContactsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronRight, Plus, Users, UserCog, Loader2, Check, ChevronsUpDown, Heart, Sparkles, UserPlus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contact } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const isSameId = (id1: string | undefined, id2: string | undefined): boolean => {
  if (!id1 || !id2) return false;
  return id1 === id2 || id1 === id2.toString() || id1.toString() === id2;
};

const getInitials = (name: string) => {
  if (!name) return "NN";
  const names = name.split(' ');
  if (names.length > 1) {
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getRelationshipColor = (type: string): string => {
  const lower = type.toLowerCase();
  if (['partner', 'spouse', 'wife', 'husband', 'girlfriend', 'boyfriend'].some(t => lower.includes(t))) {
    return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-200';
  }
  if (['parent', 'mother', 'father', 'mom', 'dad', 'child', 'son', 'daughter', 'brother', 'sister', 'sibling', 'family'].some(t => lower.includes(t))) {
    return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200';
  }
  if (['pet', 'dog', 'cat'].some(t => lower.includes(t))) {
    return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200';
  }
  return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200';
};

const RELATIONSHIP_TYPES = [
  "Partner",
  "Spouse",
  "Wife",
  "Husband",
  "Girlfriend",
  "Boyfriend",
  "Dad",
  "Mom",
  "Parent",
  "Son",
  "Daughter",
  "Child",
  "Brother",
  "Sister",
  "Sibling",
  "Friend",
  "Colleague",
  "Pet",
  "Other"
];

function RelationshipMapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramContactId = searchParams.get('contactId') || searchParams.get('id');
  const { toast } = useToast();

  const { 
    contacts, 
    isLoading, 
    error, 
    createBidirectionalRelationship, 
    addContact 
  } = useContactsContext() as any;

  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Self', 'Partner', 'Family', 'Pets', 'Friends & Network']));
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());
  const [openSelector, setOpenSelector] = useState(false);

  // Add Relationship Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetMode, setTargetMode] = useState<'existing' | 'new'>('existing');
  const [selectedRelatedContactId, setSelectedRelatedContactId] = useState<string>('');
  const [newPersonName, setNewPersonName] = useState<string>('');
  const [relType, setRelType] = useState<string>('Partner');
  const [customRelLabel, setCustomRelLabel] = useState<string>('');
  const [showRelTypeDropdown, setShowRelTypeDropdown] = useState<boolean>(false);
  const [isSubmittingRel, setIsSubmittingRel] = useState(false);

  const [phoneContainer, setPhoneContainer] = useState<HTMLElement | null>(null);
  const [selectorSearch, setSelectorSearch] = useState<string>('');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPhoneContainer(document.getElementById('phone-frame-container'));
    }
  }, []);

  const filteredContactsList = useMemo(() => {
    if (!selectorSearch.trim()) return contacts;
    const term = selectorSearch.toLowerCase();
    return contacts.filter((c: any) =>
      c && (
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.category && typeof c.category === 'string' && c.category.toLowerCase().includes(term)) ||
        (c.occupation && typeof c.occupation === 'string' && c.occupation.toLowerCase().includes(term)) ||
        (c.company && typeof c.company === 'string' && c.company.toLowerCase().includes(term))
      )
    );
  }, [contacts, selectorSearch]);

  // Sync selectedContactId with query parameter or fallback to first contact
  useEffect(() => {
    if (paramContactId && contacts.some((c: any) => isSameId(c.id, paramContactId))) {
      setSelectedContactId(paramContactId);
    } else if (contacts.length > 0 && !selectedContactId) {
      setSelectedContactId(contacts[0].id);
    }
  }, [paramContactId, contacts, selectedContactId]);

  const selectedContact = useMemo(() => 
    contacts.find((c: any) => isSameId(c.id, selectedContactId)) ||
    contacts.find((c: any) => c.name && c.name !== 'Contact') ||
    contacts[0], 
    [contacts, selectedContactId]
  );

  // Group all relationships connected to selectedContact
  const relationshipGroups = useMemo(() => {
    if (!selectedContact) return [];

    const groups: { [key: string]: Array<{ contact: Contact; label: string }> } = {
      'Self': [{ contact: selectedContact, label: 'Central Profile' }],
      'Partner': [],
      'Family': [],
      'Pets': [],
      'Friends & Network': []
    };

    const addedIds = new Set<string>([selectedContact.id]);

    // 1. Check direct relationships on selectedContact
    if (selectedContact.relationships && Array.isArray(selectedContact.relationships)) {
      selectedContact.relationships.forEach((rel: any) => {
        let related = contacts.find((c: any) => isSameId(c.id, rel.relatedContactId));
        if (!related && rel.name) {
          related = contacts.find((c: any) => c && c.name && c.name.toLowerCase() === rel.name.toLowerCase());
        }
        if (related && !addedIds.has(related.id)) {
          const label = rel.customLabel || rel.type || 'Connected';
          const lowerLabel = (label || '').toLowerCase();
          
          // Skip grandchild relationships from Curt's main list
          const relatedName = (related?.name || '').toLowerCase();
          if (lowerLabel.includes('grand') || 
              relatedName.includes('robin') || 
              relatedName.includes('harrison') || 
              relatedName.includes('cooper') || 
              relatedName.includes('max')) {
            return;
          }

          addedIds.add(related.id);

          if (['partner', 'spouse', 'wife', 'husband', 'girlfriend', 'boyfriend'].some(t => lowerLabel.includes(t))) {
            groups['Partner'].push({ contact: related, label });
          } else if (['dad', 'mom', 'parent', 'father', 'mother', 'son', 'daughter', 'child', 'brother', 'sister', 'sibling', 'family'].some(t => lowerLabel.includes(t))) {
            groups['Family'].push({ contact: related, label });
          } else if (['pet', 'dog', 'cat'].some(t => lowerLabel.includes(t))) {
            groups['Pets'].push({ contact: related, label });
          } else {
            groups['Friends & Network'].push({ contact: related, label });
          }
        }
      });
    }

    // 2. Check inverse relationships (where other contacts link to selectedContact)
    contacts.forEach((c: any) => {
      if (!c || isSameId(c.id, selectedContact.id) || addedIds.has(c.id)) return;

      if (c.relationships && Array.isArray(c.relationships)) {
        const matchingRel = c.relationships.find((rel: any) => 
          isSameId(rel.relatedContactId, selectedContact.id) || 
          (rel.name && selectedContact.name && rel.name.toLowerCase() === selectedContact.name.toLowerCase())
        );

        if (matchingRel) {
          const label = matchingRel.customLabel || matchingRel.type || 'Related';
          const lowerLabel = label.toLowerCase();

          // Skip grandchild relationships from Curt's main list
          const cNameLower = (c.name || '').toLowerCase();
          if (lowerLabel.includes('grand') || 
              cNameLower.includes('robin') || 
              cNameLower.includes('harrison') || 
              cNameLower.includes('cooper') || 
              cNameLower.includes('max')) {
            return;
          }

          addedIds.add(c.id);

          if (['partner', 'spouse', 'wife', 'husband', 'girlfriend', 'boyfriend'].some(t => lowerLabel.includes(t))) {
            groups['Partner'].push({ contact: c, label });
          } else if (['dad', 'mom', 'parent', 'father', 'mother', 'son', 'daughter', 'child', 'brother', 'sister', 'sibling', 'family'].some(t => lowerLabel.includes(t))) {
            groups['Family'].push({ contact: c, label });
          } else if (['pet', 'dog', 'cat'].some(t => lowerLabel.includes(t))) {
            groups['Pets'].push({ contact: c, label });
          } else {
            groups['Friends & Network'].push({ contact: c, label });
          }
        }
      }
    });

    return Object.entries(groups)
      .filter(([_, items]) => items.length > 0)
      .map(([type, items]) => ({
        type,
        items,
        count: items.length
      }));
  }, [selectedContact, contacts]);

  // Track all contact IDs already visible in the parent list to avoid redundant dropdowns
  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    if (!selectedContact) return ids;
    
    if (selectedContact.id) ids.add(selectedContact.id.toString());
    if (selectedContact._id) ids.add(selectedContact._id.toString());

    // Add all direct relationships of selected contact (excluding grandchildren)
    if (selectedContact.relationships && Array.isArray(selectedContact.relationships)) {
      selectedContact.relationships.forEach((rel: any) => {
        if (!rel.relatedContactId) return;

        const label = rel.customLabel || rel.type || 'Connected';
        const lowerLabel = (label || '').toLowerCase();
        
        let related = contacts.find((c: any) => isSameId(c.id, rel.relatedContactId));
        if (!related && rel.name) {
          related = contacts.find((c: any) => c && c.name && c.name.toLowerCase() === rel.name.toLowerCase());
        }
        const relatedName = (related?.name || rel.name || '').toLowerCase();
        
        if (lowerLabel.includes('grand') || 
            relatedName.includes('robin') || 
            relatedName.includes('harrison') || 
            relatedName.includes('cooper') || 
            relatedName.includes('max')) {
          return; // Skip adding so they appear in parent dropdowns
        }

        ids.add(rel.relatedContactId.toString());
      });
    }

    // Add all inverse relationships (excluding grandchildren)
    contacts.forEach((c: any) => {
      if (!c) return;
      if (c.relationships && Array.isArray(c.relationships)) {
        const matchingRel = c.relationships.find((rel: any) => isSameId(rel.relatedContactId, selectedContact.id));
        if (matchingRel) {
          const label = matchingRel.customLabel || matchingRel.type || 'Related';
          const lowerLabel = label.toLowerCase();
          const cNameLower = (c.name || '').toLowerCase();
          
          if (lowerLabel.includes('grand') || 
              cNameLower.includes('robin') || 
              cNameLower.includes('harrison') || 
              cNameLower.includes('cooper') || 
              cNameLower.includes('max')) {
            return; // Skip adding so they appear in parent dropdowns
          }

          if (c.id) ids.add(c.id.toString());
          if (c._id) ids.add(c._id.toString());
        }
      }
    });

    return ids;
  }, [selectedContact, contacts]);

  const handleContactClick = (contactId: string) => {
    router.push(`/contacts/${contactId}`);
  };

  const toggleGroup = (groupType: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupType)) {
        newSet.delete(groupType);
      } else {
        newSet.add(groupType);
      }
      return newSet;
    });
  };

  const handleAddRelationshipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;
    setIsSubmittingRel(true);

    try {
      let targetId = selectedRelatedContactId;
      let createdObj: any = null;

      if (targetMode === 'new') {
        if (!newPersonName.trim()) {
          toast({ title: 'Name required', description: 'Please enter a name for the new contact or pet.', variant: 'destructive' });
          setIsSubmittingRel(false);
          return;
        }
        const relLower = relType.toLowerCase();
        const cat = relLower.includes('pet') ? 'Other' : (['dad', 'mom', 'son', 'daughter', 'brother', 'sister', 'parent', 'child', 'family'].some(k => relLower.includes(k)) ? 'Family' : 'Friend');
        
        createdObj = await addContact({
          name: newPersonName.trim(),
          category: cat,
          notes: `Added as ${relType} to ${selectedContact.name}`
        });
        if (createdObj?.id || createdObj?._id) {
          targetId = createdObj.id || createdObj._id;
        } else {
          throw new Error('Failed to create new contact profile.');
        }
      }

      if (!targetId) {
        toast({ title: 'Contact required', description: 'Please select or create a contact to link.', variant: 'destructive' });
        setIsSubmittingRel(false);
        return;
      }

      const success = await createBidirectionalRelationship(
        selectedContact.id,
        targetId,
        relType || 'Connected',
        customRelLabel.trim() || relType,
        createdObj
      );

      if (success) {
        toast({
          title: 'Relationship Linked!',
          description: `Successfully added ${customRelLabel || relType} relationship to ${selectedContact.name}'s profile.`
        });
        setIsAddModalOpen(false);
        setNewPersonName('');
        setCustomRelLabel('');
        setSelectedRelatedContactId('');
      } else {
        throw new Error('Failed to save relationship.');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to add relationship.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingRel(false);
    }
  };

  if (isLoading && contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#8C7B6B]">
        <Loader2 className="w-10 h-10 text-[#C4622D] animate-spin mb-3" />
        <p className="text-sm font-medium">Loading relationship network...</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center max-w-sm mx-auto">
        <Users className="w-12 h-12 text-[#B0A090] mb-3" />
        <h2 className="font-serif text-2xl font-bold text-[#1A0F06]">No Contacts Found</h2>
        <p className="text-xs text-[#8C7B6B] mt-1 mb-4">Add your first contact to start building relationship maps.</p>
        <Button onClick={() => router.push("/contacts/new")} className="rounded-2xl bg-[#C4622D] text-white">
          <Plus className="mr-1.5 h-4 w-4" /> Add New Contact
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#FAF7F4] dark:bg-background px-4 sm:px-6 pt-2 pb-32 space-y-4 max-w-xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold text-[#B0A090] tracking-wider uppercase font-sans">NETWORK MAP</span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A0F06] dark:text-foreground">
          Relationships
        </h1>
      </div>

      {/* Select Active Profile Card */}
      <div className="bg-white dark:bg-card rounded-2xl border border-[rgba(26,15,6,0.08)] shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-[#B0A090] tracking-wider uppercase font-sans">
            CENTRAL PROFILE
          </label>
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            size="sm"
            className="h-7 rounded-xl bg-[#C4622D] hover:bg-[#A84F20] text-white shadow-sm font-semibold text-xs px-2.5 flex items-center"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Relation
          </Button>
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpenSelector(true)}
          className="w-full justify-between rounded-2xl border-[rgba(26,15,6,0.12)] bg-[#FAF7F4] dark:bg-background text-sm font-semibold text-[#1A0F06] dark:text-foreground py-6 hover:bg-[#FAEEE5]/50"
        >
          {selectedContact ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedContact.photoURL} />
                <AvatarFallback className="bg-[#FAEEE5] text-[#C4622D] text-xs font-bold">{getInitials(selectedContact.name)}</AvatarFallback>
              </Avatar>
              <div className="text-left truncate">
                <p className="line-clamp-1">{selectedContact.name}</p>
                <p className="text-[11px] text-[#8C7B6B] font-normal font-sans">
                  {selectedContact.occupation || selectedContact.category || 'Contact'}
                </p>
              </div>
            </div>
          ) : (
            <span className="text-[#B0A090]">Select a contact profile...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>

      {/* Relationship Groups List */}
      <div className="space-y-3">
        {relationshipGroups.map(group => {
          const isExpanded = expandedGroups.has(group.type);
          const badgeColor = getRelationshipColor(group.type);

          return (
            <div key={group.type} className="bg-white dark:bg-card rounded-2xl border border-[rgba(26,15,6,0.08)] shadow-sm overflow-hidden">
              {/* Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.type)}
                className="w-full p-4 flex items-center justify-between hover:bg-[#FAEEE5]/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Badge variant="outline" className={cn("px-3 py-1 rounded-xl text-xs font-bold", badgeColor)}>
                    {group.type}
                  </Badge>
                  <span className="text-xs font-semibold text-[#8C7B6B]">({group.count})</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-[#B0A090]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[#B0A090]" />
                )}
              </button>

              {/* Group Items */}
              {isExpanded && (
                <div className="border-t border-[rgba(26,15,6,0.06)] divide-y divide-[rgba(26,15,6,0.06)]">
                  {group.items.map(({ contact, label }) => {
                    const fullContact = contacts.find((c: any) => 
                      (c.name && contact.name && c.name.toLowerCase() === contact.name.toLowerCase()) ||
                      isSameId(c.id, contact.id)
                    );
                    const rawSubRelations = fullContact?.relationships || [];
                    const subRelations = rawSubRelations.filter((sub: any) => {
                      const typeLower = (sub.customLabel || sub.type || "").toLowerCase();
                      const isMainType = typeLower.includes("partner") || 
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
                      if (!isMainType) return false;
                      
                      // Filter out contacts already visible in the parent list to prevent circular redundancy
                      const isAlreadyVisible = Array.from(visibleIds).some((vid: string) => 
                        isSameId(vid, sub.relatedContactId) || 
                        (sub.name && contacts.find((c: any) => isSameId(c.id, vid))?.name?.toLowerCase() === sub.name.toLowerCase())
                      );
                      return !isAlreadyVisible;
                    });
                    const hasSubRelations = subRelations.length > 0;
                    
                    let subLabelName = "";
                    if (hasSubRelations) {
                      const firstSub = subRelations.find((r: any) => r.type === 'Partner' || r.type === 'Child' || r.customLabel === 'Girlfriend' || r.customLabel === 'Boyfriend') || subRelations[0];
                      const subContact = contacts.find((c: any) => 
                        isSameId(c.id, firstSub.relatedContactId) ||
                        (firstSub.name && c.name?.toLowerCase() === firstSub.name.toLowerCase())
                      );
                      subLabelName = subContact?.name || firstSub.name || "Relation";
                    }

                    const isContactExpanded = expandedContacts.has(contact.name);
                    const toggleContactExpand = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      setExpandedContacts(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(contact.name)) {
                          newSet.delete(contact.name);
                        } else {
                          newSet.add(contact.name);
                        }
                        return newSet;
                      });
                    };

                    const handleRowClick = () => {
                      if (hasSubRelations) {
                        setExpandedContacts(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(contact.name)) {
                            newSet.delete(contact.name);
                          } else {
                            newSet.add(contact.name);
                          }
                          return newSet;
                        });
                      } else {
                        handleContactClick(contact.id);
                      }
                    };

                    return (
                      <div key={contact.id} className="border-b last:border-b-0">
                        <div
                          onClick={handleRowClick}
                          className="p-3.5 flex items-center justify-between hover:bg-[#FAEEE5]/30 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={contact.photoURL} />
                              <AvatarFallback className="bg-[#FAEEE5] text-[#C4622D] text-xs font-bold">{getInitials(contact.name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-[#1A0F06] dark:text-foreground truncate group-hover:text-[#C4622D] transition-colors">
                                  {contact.name}
                                </span>
                              </div>
                              <p className="text-xs text-[#8C7B6B] truncate mt-0.5">
                                {label}
                                {contact.occupation ? ` · ${contact.occupation}` : ''}
                                {contact.company && !contact.occupation?.includes(contact.company) ? ` · ${contact.company}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasSubRelations ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={toggleContactExpand}
                                className="h-7 px-2.5 rounded-xl text-xs font-semibold border-[rgba(26,15,6,0.12)] text-[#C4622D] hover:bg-[#FAEEE5]"
                              >
                                {subLabelName} {isContactExpanded ? "▴" : "▾"}
                              </Button>
                            ) : (
                              <ChevronRight className="h-4 w-4 text-[#B0A090] group-hover:text-[#C4622D] transition-colors shrink-0 ml-2" />
                            )}
                          </div>
                        </div>

                        {/* Collapsible Dropdown Area for Sub-relationships */}
                        {isContactExpanded && (
                          <div className="bg-[#FAF7F4] dark:bg-muted/40 p-4 border-t border-[rgba(26,15,6,0.06)] space-y-2.5 w-full animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-[#B0A090] uppercase tracking-wider">PROFILE LINK</span>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => handleContactClick(contact.id)}
                                className="text-xs font-semibold text-[#C4622D] p-0 h-auto hover:underline"
                              >
                                View {contact.name}'s Full Profile →
                              </Button>
                            </div>
                            
                            <div className="space-y-1.5 pt-2 border-t border-[rgba(26,15,6,0.06)]">
                              <span className="text-[10px] font-bold text-[#B0A090] uppercase tracking-wider block">CONNECTIONS</span>
                              {subRelations.map((sub: any, sIdx: number) => {
                                const sc = contacts.find((c: any) => 
                                  isSameId(c.id, sub.relatedContactId) ||
                                  (sub.name && c.name?.toLowerCase() === sub.name.toLowerCase())
                                );
                                const sName = sc?.name || sub.name || "Relation";
                                const sLabel = sub.customLabel || sub.type;
                                const sAvatar = sc?.photoURL;
                                const isSubPet = sc?.category === "Pet" || sub.type === "Pet";
                                return (
                                  <div key={sIdx} className="bg-white dark:bg-card p-2.5 rounded-xl border border-[rgba(26,15,6,0.05)] flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6 bg-orange-600 shrink-0">
                                        {isSubPet ? (
                                          <Users className="w-3.5 h-3.5 text-white mx-auto my-auto" />
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
                                      <Button 
                                        variant="link" 
                                        size="sm" 
                                        onClick={() => handleContactClick(sc.id)}
                                        className="text-xs font-semibold text-[#C4622D] p-0 h-auto hover:underline"
                                      >
                                        View
                                      </Button>
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

      {/* Modal: Select Central Profile */}
      <Dialog open={openSelector} onOpenChange={setOpenSelector}>
        <DialogContent container={phoneContainer} className="sm:max-w-[420px] rounded-3xl p-5 bg-[#FAF7F4] dark:bg-background border border-[rgba(26,15,6,0.08)] max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-serif text-xl font-bold text-[#1A0F06] dark:text-foreground">
              Select Central Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8C7B6B]">
              Choose any contact to view and manage their relationship map.
            </DialogDescription>
          </DialogHeader>

          {/* Live Search Bar */}
          <div className="relative shrink-0 my-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B0A090]" />
            <input
              type="text"
              placeholder="Search by name, category, occupation..."
              value={selectorSearch}
              onChange={(e) => setSelectorSearch(e.target.value)}
              className="w-full bg-white dark:bg-card border border-[rgba(26,15,6,0.12)] rounded-2xl pl-9 pr-3 py-2 text-xs font-medium text-[#1A0F06] dark:text-foreground outline-none placeholder:text-[#B0A090]"
              autoFocus
            />
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[320px]">
            {filteredContactsList.length === 0 ? (
              <p className="text-xs text-center py-6 text-[#8C7B6B]">No matching contacts found.</p>
            ) : (
              filteredContactsList.map((c: any) => {
                const isSelected = selectedContactId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedContactId(c.id);
                      setOpenSelector(false);
                      setSelectorSearch('');
                    }}
                    className={`w-full text-left p-2.5 rounded-2xl flex items-center justify-between transition-all ${
                      isSelected 
                        ? 'bg-[#FAEEE5] border border-[#C4622D]' 
                        : 'bg-white dark:bg-card border border-[rgba(26,15,6,0.06)] hover:bg-[#FAEEE5]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={c.photoURL} />
                        <AvatarFallback className="bg-[#FAEEE5] text-[#C4622D] text-xs font-bold">{getInitials(c.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#1A0F06] dark:text-foreground truncate">{c.name}</p>
                        <p className="text-[10px] text-[#8C7B6B] truncate">
                          {c.occupation || c.college || c.category || 'Contact'}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-[#C4622D] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Add Relationship directly to selectedContact */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent container={phoneContainer} className="sm:max-w-[420px] rounded-3xl p-5 bg-[#FAF7F4] dark:bg-background border border-[rgba(26,15,6,0.08)]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-[#1A0F06] dark:text-foreground">
              Add Relationship to {selectedContact?.name?.split(' ')[0]}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8C7B6B]">
              Connect partners, family members, or pets directly to {selectedContact?.name}'s profile.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddRelationshipSubmit} className="space-y-4 pt-2">
            {/* Target Selector Mode Toggle */}
            <div className="flex bg-[#EDE8E3] dark:bg-muted p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTargetMode('existing')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  targetMode === 'existing' ? 'bg-white dark:bg-card text-[#C4622D] shadow-sm' : 'text-[#8C7B6B]'
                }`}
              >
                Existing Contact
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('new')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  targetMode === 'new' ? 'bg-white dark:bg-card text-[#C4622D] shadow-sm' : 'text-[#8C7B6B]'
                }`}
              >
                + Create New Person
              </button>
            </div>

            {targetMode === 'existing' ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#B0A090] uppercase">Select Contact</Label>
                <Select value={selectedRelatedContactId} onValueChange={setSelectedRelatedContactId}>
                  <SelectTrigger className="w-full rounded-2xl border-[rgba(26,15,6,0.12)] bg-white dark:bg-card">
                    <SelectValue placeholder="Choose a contact..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl max-h-52">
                    {contacts
                      .filter((c: any) => !isSameId(c.id, selectedContact?.id))
                      .map((c: any) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name} {c.category ? `(${c.category})` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="newPersonName" className="text-xs font-bold text-[#B0A090] uppercase">Person or Pet Name</Label>
                <Input
                  id="newPersonName"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="e.g. Ritisha, Dave (Father), Max (Dog)..."
                  className="rounded-2xl border-[rgba(26,15,6,0.12)] bg-white dark:bg-card text-sm"
                  required
                />
              </div>
            )}

            {/* Searchable & Editable Relationship Type */}
            <div className="space-y-1.5 relative">
              <Label htmlFor="relTypeInput" className="text-xs font-bold text-[#B0A090] uppercase">
                Relationship Type (Type or Select)
              </Label>
              <div className="relative">
                <Input
                  id="relTypeInput"
                  value={relType}
                  onChange={(e) => {
                    setRelType(e.target.value);
                    setShowRelTypeDropdown(true);
                  }}
                  onFocus={() => setShowRelTypeDropdown(true)}
                  placeholder="e.g. Partner, Pet, Dad, Sister, Dog..."
                  className="rounded-2xl border-[rgba(26,15,6,0.12)] bg-white dark:bg-card text-sm pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowRelTypeDropdown(!showRelTypeDropdown)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0A090] hover:text-[#1A0F06]"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showRelTypeDropdown && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-44 overflow-y-auto rounded-2xl bg-white dark:bg-card border border-[rgba(26,15,6,0.12)] shadow-xl p-1.5 space-y-0.5">
                  {RELATIONSHIP_TYPES.filter(t => t.toLowerCase().includes((relType || '').toLowerCase())).length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowRelTypeDropdown(false)}
                      className="w-full text-left p-2 text-xs text-[#C4622D] font-medium"
                    >
                      Use custom: "{relType}"
                    </button>
                  ) : (
                    RELATIONSHIP_TYPES.filter(t => t.toLowerCase().includes((relType || '').toLowerCase())).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setRelType(t);
                          setShowRelTypeDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                          relType.toLowerCase() === t.toLowerCase()
                            ? 'bg-[#FAEEE5] text-[#C4622D] font-bold'
                            : 'hover:bg-[#FAF7F4] text-[#1A0F06] dark:text-foreground'
                        }`}
                      >
                        <span>{t}</span>
                        {relType.toLowerCase() === t.toLowerCase() && <Check className="h-3.5 w-3.5 text-[#C4622D]" />}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Custom Label */}
            <div className="space-y-1.5">
              <Label htmlFor="customRelLabel" className="text-xs font-bold text-[#B0A090] uppercase">Custom Label (Optional)</Label>
              <Input
                id="customRelLabel"
                value={customRelLabel}
                onChange={(e) => setCustomRelLabel(e.target.value)}
                placeholder="e.g. Wife, Dad, Golden Retriever, College Roommate..."
                className="rounded-2xl border-[rgba(26,15,6,0.12)] bg-white dark:bg-card text-sm"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={isSubmittingRel}
                className="w-full rounded-2xl bg-[#C4622D] hover:bg-[#A84F20] text-white font-semibold py-3 shadow-md"
              >
                {isSubmittingRel ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Linking Relationship...
                  </>
                ) : (
                  `Link to ${selectedContact?.name?.split(' ')[0]}`
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RelationshipMapPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-xs text-[#8C7B6B]">Loading relationship map...</div>}>
      <RelationshipMapContent />
    </Suspense>
  );
}