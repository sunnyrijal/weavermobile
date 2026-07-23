"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { List, LayoutGrid, Search, PlusCircle, Users, Loader2, MoreVertical, Trash2, Eye } from "lucide-react";
import type { Contact, ContactViewMode } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useContactsContext } from '@/contexts/ContactsContext';
import { ContactDeleteModal } from '@/components/contacts/ContactDeleteModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const PASTEL_BG_COLORS = ["#FAEEE5", "#E2EDD6", "#E5E0F5", "#DDE6F0", "#F5EDD8", "#F0DDED"];
const PASTEL_TEXT_COLORS = ["#C4622D", "#4A7A28", "#5A2BA8", "#2B5FA5", "#A07B2B", "#A02B5F"];

const CATEGORY_DOT_COLORS: Record<string, string> = {
  Family: "bg-amber-400",
  Friend: "bg-emerald-500",
  Colleague: "bg-[#C4622D]",
  Professional: "bg-sky-500",
  Partner: "bg-purple-500",
};

const getCategoryDot = (category?: string) => {
  if (!category || !CATEGORY_DOT_COLORS[category]) {
    return "bg-emerald-500";
  }
  return CATEGORY_DOT_COLORS[category];
};

const getAvatarStyle = (index: number) => {
  const i = Math.abs(index) % PASTEL_BG_COLORS.length;
  return { bg: PASTEL_BG_COLORS[i], text: PASTEL_TEXT_COLORS[i] };
};

const ContactCardItem = ({ contact, index, onContactDeleted }: { contact: Contact; index: number; onContactDeleted: () => void }) => {
  const { contacts } = useContactsContext();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const contactName = contact?.name || 'Contact';
  const initials = contactName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'NN';
  const avatarStyle = getAvatarStyle(index);
  const dotColor = getCategoryDot(contact?.category);

  // Determine if secondary relationship (contact of contact or pet owner)
  let relationshipLabel = null;
  if (contact.category === 'Partner' || contact.category === 'Family' || contact.category === 'Pet') {
    for (const c of contacts) {
      if (c.id === contact.id) continue;
      const rel = c.relationships?.find((r: any) => r.relatedContactId === contact.id);
      if (rel) {
        const typeLabel = rel.customLabel || rel.type || 'Pet';
        const firstName = c.name.split(' ')[0];
        relationshipLabel = `${firstName}'s ${typeLabel}`;
        break;
      }
    }
  }

  return (
    <>
      <Link 
        href={`/contacts/${contact.id}`} 
        className="block bg-white dark:bg-card rounded-2xl border border-[rgba(26,15,6,0.08)] shadow-sm hover:border-[#C4622D] hover:shadow-md transition-all p-3.5 flex flex-col justify-between group h-full text-left relative cursor-pointer"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="relative">
            {contact.photoURL ? (
              <Image 
                src={contact.photoURL} 
                alt={contact.name}
                width={44}
                height={44}
                className="rounded-full object-cover w-11 h-11"
              />
            ) : (
              <div 
                className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
                style={{ background: avatarStyle.bg, color: avatarStyle.text }}
              >
                {initials}
              </div>
            )}
            <span 
              className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-card ${dotColor}`}
              title={`Category: ${contact.category || 'Friend'}`}
            />
          </div>
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#B0A090] hover:text-[#1A0F06] hover:bg-[#EDE8E3]">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem asChild>
                  <Link href={`/contacts/${contact.id}`}>View Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/contacts/${contact.id}/edit`}>Edit Contact</Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex-1 space-y-0.5 mb-2">
          <p className="font-semibold text-sm text-[#1A0F06] dark:text-foreground line-clamp-1 group-hover:text-[#C4622D] transition-colors">
            {contact.name}
          </p>
          <p className="text-xs text-[#8C7B6B] dark:text-muted-foreground line-clamp-1">
            {contact.occupation || contact.college || contact.category || 'Contact'}
            {contact.company && !contact.occupation?.includes(contact.company) ? ` · ${contact.company}` : ''}
          </p>
          {(contact.currentLocation || contact.hometown) && (
            <p className="text-[11px] text-[#B0A090] truncate">
              📍 {contact.currentLocation || contact.hometown}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[rgba(26,15,6,0.06)]">
          <div className="flex items-center gap-1.5 text-xs text-[#8C7B6B]" title={relationshipLabel || contact.category || 'Friend'}>
            <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
            <span className="text-[11px] font-medium text-[#5A4535] dark:text-foreground">{relationshipLabel || contact.category || 'Friend'}</span>
          </div>
        </div>
      </Link>
      
      <ContactDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        contact={contact}
        onContactDeleted={onContactDeleted}
      />
    </>
  );
};

const ContactListItem = ({ contact, index, onContactDeleted }: { contact: Contact; index: number; onContactDeleted: () => void }) => {
  const { contacts } = useContactsContext();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const initials = contact.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const avatarStyle = getAvatarStyle(index);
  const dotColor = getCategoryDot(contact.category);

  // Determine if secondary relationship (contact of contact or pet owner)
  let relationshipLabel = null;
  if (contact.category === 'Partner' || contact.category === 'Family' || contact.category === 'Pet') {
    for (const c of contacts) {
      if (c.id === contact.id) continue;
      const rel = c.relationships?.find((r: any) => r.relatedContactId === contact.id);
      if (rel) {
        const typeLabel = rel.customLabel || rel.type || 'Pet';
        const firstName = c.name.split(' ')[0];
        relationshipLabel = `${firstName}'s ${typeLabel}`;
        break;
      }
    }
  }

  return (
    <>
      <li className="bg-white dark:bg-card rounded-2xl border border-[rgba(26,15,6,0.08)] shadow-sm hover:border-[#C4622D] hover:shadow-md transition-all group">
        <Link href={`/contacts/${contact.id}`} className="flex items-center justify-between py-3 px-4 w-full cursor-pointer">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              {contact.photoURL ? (
                <Image 
                  src={contact.photoURL} 
                  alt={contact.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover w-10 h-10"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs shrink-0"
                  style={{ background: avatarStyle.bg, color: avatarStyle.text }}
                >
                  {initials}
                </div>
              )}
              <span 
                className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-card ${dotColor}`}
                title={`Category: ${contact.category || 'Friend'}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-[#1A0F06] dark:text-foreground truncate group-hover:text-[#C4622D] transition-colors">{contact.name}</p>
              <p className="text-xs text-[#8C7B6B] dark:text-muted-foreground truncate">
                {contact.occupation || contact.college || contact.category || 'N/A'}
                {contact.company && !contact.occupation?.includes(contact.company) ? ` · ${contact.company}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span 
              className={`w-2.5 h-2.5 rounded-full ${dotColor}`} 
              title={relationshipLabel || contact.category || 'Friend'} 
            />
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#B0A090] hover:text-[#1A0F06] hover:bg-[#EDE8E3]">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem asChild>
                    <Link href={`/contacts/${contact.id}`}>View Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/contacts/${contact.id}/edit`}>Edit Contact</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Contact
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Link>
      </li>
      
      <ContactDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        contact={contact}
        onContactDeleted={onContactDeleted}
      />
    </>
  );
};

function ContactsPageContent() {
  const searchParams = useSearchParams();
  const initialSearchQuery = searchParams.get('search') || '';
  
  const { contacts, isLoading, error, currentContext, activeCompanyTab } = useContactsContext() as any;
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [viewMode, setViewMode] = useState<ContactViewMode>('grid');
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get('focus') === 'search') {
      searchInputRef.current?.focus();
    }
  }, [searchParams]);

  useEffect(() => {
    const query = searchParams.get('search');
    if (query && query !== searchTerm) {
      setSearchTerm(query);
    }
  }, [searchParams, searchTerm]);

  const contextFilteredContacts = contacts.filter((contact: any) => {
    if (currentContext === 'personal') {
      return !contact.isCompanyContact;
    } else {
      if (activeCompanyTab === 'shared') {
        return contact.isCompanyContact && contact.companyContextType === 'shared';
      } else {
        return contact.isCompanyContact && contact.companyContextType === 'private';
      }
    }
  });

  const filteredContacts = contextFilteredContacts.filter((contact: any) => {
    if (!contact) return false;
    const searchTermLower = (searchTerm || '').toLowerCase();
    const nameStr = contact.name || '';

    const matchesSearch = 
        nameStr.toLowerCase().includes(searchTermLower) ||
        (contact.nickname && typeof contact.nickname === 'string' && contact.nickname.toLowerCase().includes(searchTermLower)) ||
        (contact.tags && Array.isArray(contact.tags) && contact.tags.join(' ').toLowerCase().includes(searchTermLower)) ||
        (contact.hometown && typeof contact.hometown === 'string' && contact.hometown.toLowerCase().includes(searchTermLower)) ||
        (contact.currentLocation && typeof contact.currentLocation === 'string' && contact.currentLocation.toLowerCase().includes(searchTermLower)) ||
        (contact.occupation && typeof contact.occupation === 'string' && contact.occupation.toLowerCase().includes(searchTermLower)) ||
        (contact.company && typeof contact.company === 'string' && contact.company.toLowerCase().includes(searchTermLower)) ||
        (contact.college && typeof contact.college === 'string' && contact.college.toLowerCase().includes(searchTermLower)) ||
        (contact.email && typeof contact.email === 'string' && contact.email.toLowerCase().includes(searchTermLower));

    // Determine if secondary relationship (contact of contact)
    let isSecondary = false;
    for (const c of contacts) {
      if (c.id === contact.id) continue;
      const rel = c.relationships?.some((r: any) => r.relatedContactId === contact.id);
      if (rel) {
        isSecondary = true;
        break;
      }
    }

    // If it's a pet, only show it if "Pet" is the selected filter
    const isPet = contact.category === 'Pet';
    if (isPet && activeFilter !== "Pet") {
      return false;
    }

    const matchesCategory = activeFilter === "All" || (contact.category && contact.category === activeFilter);
    return matchesSearch && matchesCategory;
  });
  
  const filterCategories = [
    { name: "All", dot: null },
    { name: "Family", dot: "bg-amber-400" },
    { name: "Friend", dot: "bg-emerald-500" },
    { name: "Colleague", dot: "bg-[#C4622D]" },
    { name: "Professional", dot: "bg-sky-500" },
    { name: "Partner", dot: "bg-purple-500" },
    { name: "Pet", dot: "bg-emerald-500" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#FAF7F4] dark:bg-background px-4 sm:px-6 pt-2 pb-8 space-y-4 max-w-xl mx-auto w-full">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#B0A090] tracking-wider uppercase font-sans">DIRECTORY</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A0F06] dark:text-foreground">
            Contacts Search
          </h1>
        </div>
        <Button asChild className="rounded-2xl bg-[#C4622D] hover:bg-[#A84F20] text-white shadow-md">
          <Link href="/contacts/new">
            <PlusCircle className="mr-1.5 h-4 w-4" /> Add
          </Link>
        </Button>
      </div>

      {/* Search Bar & View Mode Toggle */}
      <div className="bg-white dark:bg-card rounded-2xl border border-[rgba(26,15,6,0.08)] shadow-sm p-3 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B0A090]" />
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search contacts, company, tags..."
            className="w-full bg-transparent pl-9 pr-3 py-1.5 text-sm text-[#1A0F06] dark:text-foreground outline-none placeholder:text-[#B0A090]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-[#EDE8E3] dark:bg-muted p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-card text-[#C4622D] shadow-sm font-semibold' : 'text-[#8C7B6B]'}`}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-card text-[#C4622D] shadow-sm font-semibold' : 'text-[#8C7B6B]'}`}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Category Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar shrink-0 py-1.5 w-full">
        {filterCategories.map(cat => {
          const isActive = activeFilter === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setActiveFilter(cat.name)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isActive 
                  ? 'bg-[#C4622D] text-white shadow-md font-bold' 
                  : 'bg-white dark:bg-card text-[#5A4535] border border-[rgba(26,15,6,0.1)] hover:bg-[#FAEEE5]'
              }`}
            >
              {cat.dot && <span className={`w-2 h-2 rounded-full ${cat.dot} ${isActive ? 'ring-1 ring-white' : ''}`} />}
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Results Count & Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8 text-[#8C7B6B]">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-[#C4622D]" />
          <span className="text-sm font-medium">Loading contacts...</span>
        </div>
      )}

      {error && (
        <div className="text-destructive p-3 bg-destructive/10 rounded-xl text-xs">
          Error loading contacts: {error}
        </div>
      )}

      {/* Grid or List Display */}
      {!isLoading && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredContacts.map((contact: any, idx: number) => (
                <ContactCardItem 
                  key={contact.id || `contact-${idx}`} 
                  contact={contact} 
                  index={idx}
                  onContactDeleted={() => {}}
                />
              ))}
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {filteredContacts.map((contact: any, idx: number) => (
                <ContactListItem 
                  key={contact.id || `contact-${idx}`} 
                  contact={contact} 
                  index={idx}
                  onContactDeleted={() => {}}
                />
              ))}
            </ul>
          )}

          {filteredContacts.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-card rounded-2xl border border-[rgba(26,15,6,0.08)] p-6">
              <Users className="mx-auto h-10 w-10 text-[#B0A090] mb-3" />
              <p className="text-base font-semibold text-[#1A0F06] dark:text-foreground">No contacts found</p>
              <p className="text-xs text-[#8C7B6B] mt-1">Try adjusting your search query or category filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-xs text-[#8C7B6B]">Loading contacts...</div>}>
      <ContactsPageContent />
    </Suspense>
  );
}

