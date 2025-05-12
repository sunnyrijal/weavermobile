"use client";
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, LayoutGrid, Search, PlusCircle, Users } from "lucide-react";
import type { Contact, ContactViewMode } from '@/lib/types';
import { mockContacts } from '@/lib/mockData';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const ContactCardItem = ({ contact }: { contact: Contact }) => (
  <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="p-0">
      <Image 
        src={contact.photoURL || `https://picsum.photos/seed/${contact.id}/400/250`} 
        alt={contact.name}
        width={400}
        height={250}
        className="object-cover w-full h-40"
        data-ai-hint="person portrait"
      />
    </CardHeader>
    <CardContent className="p-4">
      <CardTitle className="text-lg mb-1">{contact.name}</CardTitle>
      <CardDescription className="text-sm text-muted-foreground mb-2">{contact.category || 'N/A'}</CardDescription>
      {contact.occupation && <p className="text-xs text-muted-foreground truncate">{contact.occupation}{contact.company ? ` at ${contact.company}` : ''}</p>}
      {contact.college && !contact.occupation && <p className="text-xs text-muted-foreground truncate">Studied at {contact.college}</p>}
      {contact.currentLocation && <p className="text-xs text-muted-foreground truncate">{contact.currentLocation}</p>}
      {!contact.currentLocation && contact.hometown && <p className="text-xs text-muted-foreground truncate">From: {contact.hometown}</p>}
    </CardContent>
    <CardFooter className="p-4 pt-0">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/contacts/${contact.id}`}>View Details</Link>
      </Button>
    </CardFooter>
  </Card>
);

const ContactListItem = ({ contact }: { contact: Contact }) => (
 <li className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors duration-150">
    <div className="flex items-center gap-3">
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
    </div>
    <Button variant="ghost" size="sm" asChild>
      <Link href={`/contacts/${contact.id}`}>View</Link>
    </Button>
  </li>
);

export default function ContactsPage() {
  const searchParams = useSearchParams();
  const initialSearchQuery = searchParams.get('search') || '';
  
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [viewMode, setViewMode] = useState<ContactViewMode>('grid');
  const [activeFilter, setActiveFilter] = useState<string>("All");

  useEffect(() => {
    // Update searchTerm if the query parameter changes after initial load
    const query = searchParams.get('search');
    if (query && query !== searchTerm) {
      setSearchTerm(query);
    }
  }, [searchParams, searchTerm]);


  const filteredContacts = mockContacts.filter(contact => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
        contact.name.toLowerCase().includes(searchTermLower) ||
        (contact.tags && contact.tags.join(' ').toLowerCase().includes(searchTermLower)) ||
        (contact.hometown && contact.hometown.toLowerCase().includes(searchTermLower)) ||
        (contact.currentLocation && contact.currentLocation.toLowerCase().includes(searchTermLower)) ||
        (contact.occupation && contact.occupation.toLowerCase().includes(searchTermLower)) ||
        (contact.company && contact.company.toLowerCase().includes(searchTermLower)) ||
        (contact.college && contact.college.toLowerCase().includes(searchTermLower)) ||
        (contact.email && contact.email.toLowerCase().includes(searchTermLower));

    const matchesFilter = activeFilter === "All" || (contact.category && contact.category === activeFilter);
    return matchesSearch && matchesFilter;
  });
  
  const filterCategories = ["All", "Family", "Friend", "Colleague", "Professional", "Partner"];


  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Your Contacts</CardTitle>
              <CardDescription>Browse, search, and manage your network connections.</CardDescription>
            </div>
            <Button asChild>
                <Link href="/contacts/new"><PlusCircle className="mr-2 h-4 w-4" /> Add New Contact</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative flex-grow w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    type="search" 
                    placeholder="Search contacts, tags, company, college..." 
                    className="pl-10 pr-4 py-2.5 text-base md:text-sm w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                </div>
                <div className="flex items-center gap-2">
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} aria-label="List view">
                    <List className="h-5 w-5" />
                </Button>
                <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')} aria-label="Grid view">
                    <LayoutGrid className="h-5 w-5" />
                </Button>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-4">
          {filterCategories.map(category => (
            <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeFilter}>
           {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredContacts.map(contact => <ContactCardItem key={contact.id} contact={contact} />)}
            </div>
          )}
          {viewMode === 'list' && (
            <Card className="shadow-md">
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {filteredContacts.map(contact => <ContactListItem key={contact.id} contact={contact} />)}
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
