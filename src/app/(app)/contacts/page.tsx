"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, LayoutGrid, Search, PlusCircle, Users, Loader2, MoreVertical, Trash2 } from "lucide-react";
import type { Contact, ContactViewMode } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useContacts } from '@/hooks/useContacts';
import { ContactDeleteModal } from '@/components/contacts/ContactDeleteModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const ContactCardItem = ({ contact, onContactDeleted, selectedContactIds, setSelectedContactIds }: { contact: Contact; onContactDeleted: () => void }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  return (
    <>
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col group">
        <CardHeader className="p-0 relative">
          <Image 
            src={contact.photoURL || `https://picsum.photos/seed/${contact.id}/400/250`} 
            alt={contact.name}
            width={400}
            height={250}
            className="object-cover w-full h-32 sm:h-40"
            data-ai-hint="person portrait"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/contacts/${contact.id}`}>View Details</Link>
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
        </CardHeader>
        <CardContent className="p-3 sm:p-4 flex-1">
          <CardTitle className="text-base sm:text-lg mb-1 line-clamp-1">{contact.name}</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground mb-2">{contact.category || 'N/A'}</CardDescription>
          {contact.occupation && <p className="text-xs text-muted-foreground truncate">{contact.occupation}{contact.company ? ` at ${contact.company}` : ''}</p>}
          {contact.college && !contact.occupation && <p className="text-xs text-muted-foreground truncate">{contact.college}</p>}
          {contact.currentLocation && <p className="text-xs text-muted-foreground truncate">{contact.currentLocation}</p>}
          {!contact.currentLocation && contact.hometown && <p className="text-xs text-muted-foreground truncate">From: {contact.hometown}</p>}
        </CardContent>
        <CardFooter className="p-3 sm:p-4 pt-0 mt-auto">
          <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm" asChild>
            <Link href={`/contacts/${contact.id}`}>View Details</Link>
          </Button>
        </CardFooter>
      </Card>
      
      <ContactDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        contact={contact}
        onContactDeleted={onContactDeleted}
      />
    </>
  );
};

const ContactListItem = ({ contact, onContactDeleted, selectedContactIds, setSelectedContactIds }: { contact: Contact; onContactDeleted: () => void }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  return (
    <>
      <li className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors duration-150 group">
        <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3 flex-1">
          <Image 
            src={contact.photoURL || `https://picsum.photos/seed/${contact.id}/40/40`} 
            alt={contact.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
            data-ai-hint="person avatar"
          />
          <div>
            <p className="font-medium">{contact.name}</p>
            <p className="text-sm text-muted-foreground">{contact.occupation || contact.college || contact.category || 'N/A'}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedContactIds.includes(contact.id)}
            onChange={e => {
              setSelectedContactIds(ids =>
                e.target.checked
                  ? [...ids, contact.id]
                  : ids.filter(id => id !== contact.id)
              );
            }}
            className="mr-2"
            aria-label={`Select contact ${contact.name}`}
          />
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/contacts/${contact.id}`}>View</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/contacts/${contact.id}`}>View Details</Link>
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
  
  const { contacts, isLoading, error, deleteContact } = useContacts();
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [viewMode, setViewMode] = useState<ContactViewMode>('grid');
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const { toast } = useToast();
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  useEffect(() => {
    // Update searchTerm if the query parameter changes after initial load
    const query = searchParams.get('search');
    if (query && query !== searchTerm) {
      setSearchTerm(query);
    }
  }, [searchParams, searchTerm]);


  const filteredContacts = contacts.filter(contact => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
        contact.name.toLowerCase().includes(searchTermLower) ||
        (contact.nickname && contact.nickname.toLowerCase().includes(searchTermLower)) ||
        (contact.tags && contact.tags.join(' ').toLowerCase().includes(searchTermLower)) ||
        (contact.hometown && contact.hometown.toLowerCase().includes(searchTermLower)) ||
        (contact.currentLocation && contact.currentLocation.toLowerCase().includes(searchTermLower)) ||
        (contact.occupation && contact.occupation.toLowerCase().includes(searchTermLower)) ||
        (contact.company && contact.company.toLowerCase().includes(searchTermLower)) ||
        (contact.college && contact.college.toLowerCase().includes(searchTermLower)) ||
        (contact.email && contact.email.toLowerCase().includes(searchTermLower));

    // Filter logic: show only main contacts with matching category
    const isMainContact = !contact.relationships || contact.relationships.length === 0;
    const matchesCategory = activeFilter === "All" || (contact.category && contact.category === activeFilter);
    const matchesFilter = isMainContact && matchesCategory;
    
    return matchesSearch && matchesFilter;
  });
  
  const filterCategories = ["All", "Family", "Friend", "Colleague", "Professional", "Partner"];

  const handleContactDeleted = () => {
    // The ContactDeleteModal will handle the deletion and show success message
    // We just need to refresh the contacts list
    // The useContacts hook will automatically update the list
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Your Contacts</CardTitle>
              <CardDescription>Browse, search, and manage your network connections.</CardDescription>
            </div>
            <Button asChild className="w-full sm:w-auto">
                <Link href="/contacts/new"><PlusCircle className="mr-2 h-4 w-4" /> Add New Contact</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="relative flex-grow w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input 
                    type="search" 
                    placeholder="Search contacts, tags, company, college..." 
                    className="pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                </div>
                <div className="flex items-center gap-1 sm:gap-2 self-center sm:self-auto">
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => setViewMode('list')} aria-label="List view">
                    <List className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => setViewMode('grid')} aria-label="Grid view">
                    <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                </div>
            </div>
            {isLoading && (
              <div className="flex justify-center items-center mt-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading contacts...</span>
              </div>
            )}
            {error && (
              <div className="text-destructive mt-4 p-2 bg-destructive/10 rounded-md">
                Error loading contacts: {error}
              </div>
            )}
        </CardContent>
      </Card>
      
      <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-4">
          {filterCategories.map(category => (
            <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeFilter}>
           {viewMode === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              {filteredContacts.map((contact, index) => (
                <ContactCardItem 
                  key={contact.id || `contact-${index}`} 
                  contact={contact} 
                  onContactDeleted={handleContactDeleted}
                  selectedContactIds={selectedContactIds}
                  setSelectedContactIds={setSelectedContactIds}
                />
              ))}
            </div>
          )}
          {viewMode === 'list' && (
            <Card className="shadow-md">
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {filteredContacts.map((contact, index) => (
                    <ContactListItem 
                      key={contact.id || `contact-${index}`} 
                      contact={contact} 
                      onContactDeleted={handleContactDeleted}
                      selectedContactIds={selectedContactIds}
                      setSelectedContactIds={setSelectedContactIds}
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {filteredContacts.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No contacts found.</p>
              <p>Try adjusting your search or filters, or add a new contact.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactsPageContent />
    </Suspense>
  );
}

