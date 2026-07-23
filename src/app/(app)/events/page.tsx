"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Gift, Heart, Sparkles, MessageCircle, 
  Search, Filter, Clock, MapPin, Cake, PartyPopper, ChevronRight,
  Lightbulb, BookOpen, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useContactsContext } from '@/contexts/ContactsContext';
import { useMemories } from '@/hooks/useMemories';
import { parseISO, differenceInDays, setYear, getYear, isPast, addYears, format as formatDateFn } from 'date-fns';

interface UpcomingEventItem {
  id: string;
  contactId: string;
  contactName: string;
  contactPhoto?: string;
  category?: string;
  eventType: 'birthday' | 'anniversary' | 'trip' | 'event';
  title: string;
  date: Date;
  dateDisplay: string;
  daysRemaining: number;
  subtext?: string;
  giftIdeas: string[];
  messageSuggestions: string[];
  pastMemories: string[];
}

export default function UpcomingEventsPage() {
  const router = useRouter();
  const { contacts, currentContext, companyName } = useContactsContext();
  const { memories, fetchMemories } = useMemories();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'birthday' | 'anniversary' | 'trip' | 'soon'>('all');

  const handleAddToCalendar = (event: UpcomingEventItem) => {
    const startDate = new Date(event.date);
    const endDate = new Date(event.date);
    endDate.setHours(startDate.getHours() + 1);

    const formatDateForICS = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Memore//Calendar Event//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}-${Date.now()}@memore`,
      `DTSTAMP:${formatDateForICS(new Date())}`,
      `DTSTART:${formatDateForICS(startDate)}`,
      `DTEND:${formatDateForICS(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:Add gifts/notes: ${event.giftIdeas.join(', ')}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  // Context-filtered contacts
  const contextFilteredContacts = useMemo(() => {
    if (currentContext === 'personal') {
      return contacts.filter((c: any) => !c.isCompanyContact);
    } else {
      return contacts.filter((c: any) => c.isCompanyContact);
    }
  }, [contacts, currentContext]);

  // Compute all upcoming events from contacts and notable events
  const calculatedEvents = useMemo(() => {
    const today = new Date();
    const list: UpcomingEventItem[] = [];

    contextFilteredContacts.forEach((contact: any) => {
      // 1. Check Birthday
      if (contact.birthday) {
        try {
          const birthDate = parseISO(contact.birthday);
          if (!isNaN(birthDate.getTime())) {
            const birthDateThisYear = setYear(birthDate, getYear(today));
            let nextBirthdayDate = birthDateThisYear;
            if (isPast(nextBirthdayDate) && differenceInDays(nextBirthdayDate, today) !== 0) {
              nextBirthdayDate = addYears(birthDateThisYear, 1);
            }
            const daysRemaining = differenceInDays(nextBirthdayDate, today);
            if (daysRemaining >= 0 && daysRemaining <= 90) {
              // Extract past memories for this contact
              const contactMems = memories
                .filter(m => m.contactId === contact.id || (m.contactIds && m.contactIds.includes(contact.id)))
                .map(m => m.content);

              list.push({
                id: `birthday-${contact.id}`,
                contactId: contact.id,
                contactName: contact.name,
                contactPhoto: contact.photoURL,
                category: contact.category || 'Friend',
                eventType: 'birthday',
                title: `${contact.name}'s Birthday`,
                date: nextBirthdayDate,
                dateDisplay: formatDateFn(nextBirthdayDate, 'EEEE, MMMM d'),
                daysRemaining,
                subtext: daysRemaining === 0 ? 'Today!' : daysRemaining === 1 ? 'Tomorrow' : `In ${daysRemaining} days`,
                giftIdeas: [
                  `Handwritten card or letter`,
                  `Coffee & favorite dessert treat`,
                  `Special personalized gift based on past notes`
                ],
                messageSuggestions: [
                  `"Happy Birthday ${contact.name.split(' ')[0]}! Wishing you an incredible year ahead 🎉"`,
                  `"Hope your birthday is filled with everything you love! Thinking of you today 🎂"`
                ],
                pastMemories: contactMems.length > 0 ? contactMems.slice(0, 2) : [
                  contact.notes ? `Note: ${contact.notes}` : `No past memory logs recorded yet.`
                ]
              });
            }
          }
        } catch (e) {
          console.warn('Error parsing birthday date:', e);
        }
      }

      // 2. Check Notable Events (Anniversaries, Trips, Milestones)
      if (contact.notableEvents && Array.isArray(contact.notableEvents)) {
        contact.notableEvents.forEach((ev: any) => {
          if (!ev.date) return;
          try {
            const evDate = parseISO(ev.date);
            if (isNaN(evDate.getTime())) return;

            let nextEvDate = evDate;
            const isAnniversary = ev.title.toLowerCase().includes('anniversary');
            const isRelationshipAnniversary = isAnniversary && 
              (contact.category === 'Partner' || ev.title.toLowerCase().includes('chandra') || ev.title.toLowerCase().includes('partner'));
            
            if (isAnniversary) {
              const thisYearDate = setYear(evDate, getYear(today));
              nextEvDate = thisYearDate;
              if (isPast(nextEvDate) && differenceInDays(nextEvDate, today) !== 0) {
                nextEvDate = addYears(thisYearDate, 1);
              }
            }

            const daysRemaining = differenceInDays(nextEvDate, today);
            if (daysRemaining >= 0 && daysRemaining <= 90) {
              const contactMems = memories
                .filter(m => m.contactId === contact.id || (m.contactIds && m.contactIds.includes(contact.id)))
                .map(m => m.content);

              const evType = isRelationshipAnniversary ? 'relationship_anniversary' : isAnniversary ? 'general_anniversary' : ev.title.toLowerCase().includes('trip') || ev.title.toLowerCase().includes('flight') ? 'trip' : 'event';

              list.push({
                id: `event-${ev.id || Math.random()}-${contact.id}`,
                contactId: contact.id,
                contactName: contact.name,
                contactPhoto: contact.photoURL,
                category: contact.category || 'Friend',
                eventType: evType,
                title: ev.title,
                date: nextEvDate,
                dateDisplay: formatDateFn(nextEvDate, 'EEEE, MMMM d'),
                daysRemaining,
                subtext: daysRemaining === 0 ? 'Today!' : daysRemaining === 1 ? 'Tomorrow' : `In ${daysRemaining} days`,
                giftIdeas: isAnniversary ? [
                  `Flowers or dinner reservation`,
                  `Framed photo memory`
                ] : [
                  `Send a quick travel check-in message`,
                  `Recommend local spots or coffee shops`
                ],
                messageSuggestions: [
                  `"Happy ${ev.title}! Wishing you both a beautiful day 🥂"`,
                  `"Have a safe & wonderful trip ${contact.name.split(' ')[0]}! Can't wait to hear all about it ✈️"`
                ],
                pastMemories: contactMems.length > 0 ? contactMems.slice(0, 2) : [
                  contact.notes ? `Note: ${contact.notes}` : `Event logged for ${contact.name}`
                ]
              });
            }
          } catch (err) {
            console.warn('Error parsing notable event date:', err);
          }
        });
      }
    });

    // Sort by days remaining ascending
    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [contextFilteredContacts, memories]);

  // Filter events based on search & active filter pill
  const filteredEvents = useMemo(() => {
    return calculatedEvents.filter(ev => {
      const matchesSearch = ev.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            ev.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      if (activeFilter === 'birthday') return ev.eventType === 'birthday';
      if (activeFilter === 'anniversary') return ev.eventType === 'anniversary';
      if (activeFilter === 'trip') return ev.eventType === 'trip' || ev.eventType === 'event';
      if (activeFilter === 'soon') return ev.daysRemaining <= 7;
      return true;
    });
  }, [calculatedEvents, searchTerm, activeFilter]);

  return (
    <div className="flex flex-col min-h-full bg-[#FAF7F4] dark:bg-background px-4 sm:px-6 pt-2 pb-32 space-y-5 max-w-xl mx-auto w-full overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between py-1">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()} 
          className="rounded-2xl border-[rgba(26,15,6,0.12)] bg-white dark:bg-card text-xs font-semibold text-[#1A0F06] dark:text-foreground h-9 px-3 shadow-sm hover:bg-[#FAEEE5]"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5 text-[#C4622D]" /> Back
        </Button>
        <span className="text-xs font-bold text-[#B0A090] uppercase tracking-wider">
          {filteredEvents.length} {filteredEvents.length === 1 ? 'Event' : 'Events'}
        </span>
      </div>

      <div>
        <h1 className="font-serif text-2xl font-bold text-[#1A0F06] dark:text-foreground">
          Upcoming Events
        </h1>
        <p className="text-xs text-[#8C7B6B] dark:text-muted-foreground mt-0.5">
          Recalled past memories, gift ideas, and celebration plans
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B0A090]" />
        <Input 
          placeholder="Search by contact or event..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-2xl border-[rgba(26,15,6,0.12)] bg-white dark:bg-card text-sm h-10 shadow-sm focus:border-[#C4622D]"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { key: 'all', label: 'All Events' },
          { key: 'soon', label: '⚡ Next 7 Days' },
          { key: 'birthday', label: '🎂 Birthdays' },
          { key: 'anniversary', label: '💛 Anniversaries' },
          { key: 'trip', label: '✈️ Trips & Milestones' },
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              activeFilter === filter.key
                ? 'bg-[#C4622D] text-white border-[#C4622D] shadow-sm'
                : 'bg-white dark:bg-card text-[#5A4535] dark:text-muted-foreground border-[rgba(26,15,6,0.12)] hover:border-[#C4622D]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-card rounded-3xl border border-[rgba(26,15,6,0.08)] shadow-sm p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAEEE5] text-[#C4622D] flex items-center justify-center mx-auto text-xl">
            📅
          </div>
          <p className="text-sm font-semibold text-[#1A0F06] dark:text-foreground">No upcoming events found</p>
          <p className="text-xs text-[#8C7B6B] max-w-xs mx-auto">
            Add birthdays, anniversaries, or notable dates to your contacts to see intelligent reminders & gift ideas here!
          </p>
          <Button 
            onClick={() => router.push('/contacts/new')} 
            className="rounded-2xl bg-[#C4622D] text-white hover:bg-[#A84F20] text-xs font-semibold px-4 h-9 shadow-sm"
          >
            Add New Event / Contact
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map(event => (
            <div 
              key={event.id}
              className="bg-white dark:bg-card rounded-3xl border border-[rgba(26,15,6,0.08)] shadow-sm p-4 sm:p-5 space-y-4 transition-all hover:border-[rgba(196,98,45,0.4)]"
            >
              {/* Event Top Line */}
              <div className="flex items-start justify-between gap-3">
                {event.eventType === 'relationship_anniversary' ? (
                  <div className="flex flex-col">
                    <h3 className="font-bold text-base text-[#1A0F06] dark:text-foreground flex items-center gap-1.5">
                      💛 Chandra & {event.contactName}'s Anniversary
                    </h3>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0 w-11 h-11">
                      {event.contactPhoto ? (
                        <Image 
                          src={event.contactPhoto} 
                          alt={event.contactName} 
                          width={44} 
                          height={44} 
                          className="rounded-full object-cover w-11 h-11 border border-[rgba(26,15,6,0.08)] shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#FAEEE5] text-[#C4622D] font-bold text-sm flex items-center justify-center border border-[rgba(26,15,6,0.08)] shrink-0">
                          {event.contactName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/contacts/${event.contactId}`}
                          className="font-bold text-base text-[#1A0F06] dark:text-foreground hover:text-[#C4622D] transition-colors"
                        >
                          {event.contactName}
                        </Link>
                        <Badge variant="outline" className="rounded-xl text-[10px] px-2 py-0.5 border-[rgba(26,15,6,0.12)] text-[#5A4535] bg-[#FAF7F4]">
                          {event.category}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-[#C4622D] flex items-center gap-1.5 mt-0.5">
                        {event.eventType === 'birthday' ? '🎂' : event.eventType === 'anniversary' ? '💛' : '✈️'} {event.title}
                      </p>
                    </div>
                  </div>
                )}

                <Badge className={`rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap border-0 ${
                  event.daysRemaining <= 3 
                    ? 'bg-[#FAEEE5] text-[#C4622D]' 
                    : 'bg-[#FAF7F4] dark:bg-muted text-[#5A4535] dark:text-foreground'
                }`}>
                  {event.subtext}
                </Badge>
              </div>

              <div className="text-xs text-[#8C7B6B] flex items-center gap-1.5 bg-[#FAF7F4] dark:bg-muted/40 px-3 py-1.5 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-[#C4622D]" />
                <span>{event.dateDisplay}</span>
              </div>

              {/* Past Memories Recalled Section */}
              <div className="bg-[#FAF7F4] dark:bg-muted/30 rounded-2xl p-3.5 space-y-2 border border-[rgba(26,15,6,0.05)]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A0F06] dark:text-foreground">
                  <BookOpen className="w-3.5 h-3.5 text-[#C4622D]" />
                  <span>Recalled Past Context & Memories</span>
                </div>
                <div className="space-y-1.5">
                  {event.pastMemories.map((mem, idx) => (
                    <p key={idx} className="text-xs text-[#5A4535] dark:text-muted-foreground bg-white dark:bg-card p-2.5 rounded-xl border border-[rgba(26,15,6,0.06)] leading-relaxed">
                      💭 {mem}
                    </p>
                  ))}
                </div>
              </div>

              {/* AI Suggested Ideas (Gifts & Messages) in Collapsible Details */}
              <details className="group border border-[rgba(26,15,6,0.08)] rounded-2xl bg-[#FAF7F4] dark:bg-muted/20">
                <summary className="list-none flex items-center justify-between p-3 cursor-pointer select-none">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#1A0F06] dark:text-foreground">
                    <Lightbulb className="w-3.5 h-3.5 text-[#C4622D]" />
                    Suggested Ideas & Actions
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#8C7B6B] transition-transform group-open:rotate-90" />
                </summary>
                <div className="p-3 pt-0 space-y-2 border-t border-[rgba(26,15,6,0.05)] bg-white dark:bg-card rounded-b-2xl">
                  <div className="grid grid-cols-1 gap-2">
                    {event.giftIdeas.map((gift, gIdx) => (
                      <div key={gIdx} className="flex items-center gap-2 text-xs text-[#1A0F06] dark:text-foreground bg-[#FAF7F4] dark:bg-muted/40 p-2.5 rounded-xl border border-[rgba(26,15,6,0.05)]">
                        <Gift className="w-3.5 h-3.5 text-[#C4622D] shrink-0" />
                        <span>{gift}</span>
                      </div>
                    ))}
                    {event.messageSuggestions.map((msg, mIdx) => (
                      <div key={mIdx} className="flex items-center gap-2 text-xs text-[#5A4535] dark:text-muted-foreground bg-[#FAF7F4] dark:bg-muted/40 p-2.5 rounded-xl border border-[rgba(26,15,6,0.05)] italic">
                        <MessageCircle className="w-3.5 h-3.5 text-[#C4622D] shrink-0" />
                        <span>{msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </details>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-[rgba(26,15,6,0.08)] gap-2">
                <Link 
                  href={`/contacts/${event.contactId}`}
                  className="text-xs font-semibold text-[#C4622D] hover:underline flex items-center shrink-0"
                >
                  View Full Profile <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
                <div className="flex items-center gap-1.5">
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddToCalendar(event)}
                    className="rounded-2xl border-[rgba(26,15,6,0.12)] text-xs font-semibold text-[#1A0F06] dark:text-foreground h-8 px-2.5 hover:bg-[#FAEEE5] flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#C4622D]" /> Add to Calendar
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/contacts/${event.contactId}`)}
                    className="rounded-2xl border-[rgba(26,15,6,0.12)] text-xs font-semibold text-[#1A0F06] dark:text-foreground h-8 px-2.5 hover:bg-[#FAEEE5]"
                  >
                    Message / Note
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
