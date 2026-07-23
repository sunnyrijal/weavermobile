"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useContactsContext } from "@/contexts/ContactsContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Edit3, 
  Mail, 
  UserCircle2, 
  Heart, 
  Briefcase, 
  UploadCloud, 
  Check, 
  Users, 
  Lock,
  Building,
  Info,
  Trash2,
  FileText,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  CalendarDays,
  MapPin,
  Sparkles,
  School
} from "lucide-react";
import Link from 'next/link';
import { parseISO, setYear, getYear, isPast, differenceInDays, addYears } from 'date-fns';

// Mock imported CSV contacts for triage
const MOCK_IMPORT_CONTACTS = [
  { name: "Jadon Kittelson", occupation: "Computer Science Student", company: "Mankato University", hometown: "Faribault, Minnesota", email: "jadon.kittelson@example.com" },
  { name: "Sarah Williams", occupation: "Product Lead", company: "Figma", email: "sarah.williams@figma.com" },
  { name: "Debbie Kittelson", occupation: "Gustavus Alumni / Realtor", company: "Edina Realty", hometown: "Faribault, Minnesota" }
];

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    currentContext, 
    setCurrentContext, 
    joinedCompany, 
    setJoinedCompany, 
    companyName, 
    setCompanyName, 
    contacts,
    addContact
  } = useContactsContext();

  const [companyCode, setCompanyCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [journalCount, setJournalCount] = useState(0);

  // Triage state
  const [isImporting, setIsImporting] = useState(false);
  const [importedFileName, setImportedFileName] = useState("");
  const [importContactsList, setImportContactsList] = useState<any[]>([]);
  const [triageIndex, setTriageIndex] = useState(0);

  // Offboarding / Export state
  const [isOffboardingOpen, setIsOffboardingOpen] = useState(false);
  const [offboardingStep, setOffboardingStep] = useState(1);
  const [exportChoice, setExportChoice] = useState<'export' | 'delete'>('export');
  
  useEffect(() => {
    const fetchJournalCount = async () => {
      try {
        const ownerId = currentUser?.uid || 'user1';
        const res = await fetch(`/api/journal?ownerId=${ownerId}`);
        if (res.ok) {
          const data = await res.json();
          setJournalCount(data.entries?.length || 0);
        }
      } catch (err) {
        console.error("Error fetching journal count in profile:", err);
      }
    };
    fetchJournalCount();
  }, [currentUser]);

  // Context-filtered contacts
  const contextFilteredContacts = useMemo(() => {
    if (currentContext === 'personal') {
      return contacts.filter((c: any) => !c.isCompanyContact);
    } else {
      const activeTab = (typeof window !== 'undefined' ? localStorage.getItem('memore_company_tab') : 'shared') || 'shared';
      if (activeTab === 'shared') {
        return contacts.filter((c: any) => c.isCompanyContact && c.companyContextType === 'shared');
      } else {
        return contacts.filter((c: any) => c.isCompanyContact && c.companyContextType === 'private');
      }
    }
  }, [contacts, currentContext]);

  // Helper functions for upcoming events calculation
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const upcomingThresholdDays = 30;
    let events: any[] = [];

    contextFilteredContacts.forEach(contact => {
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
            if (daysRemaining >= 0 && daysRemaining <= upcomingThresholdDays) {
              events.push({ id: `birthday-${contact.id}`, daysRemaining });
            }
          }
        } catch (e) {}
      }

      contact.notableEvents?.forEach((event: any) => {
        try {
          const eventDate = parseISO(event.date);
          if (!isNaN(eventDate.getTime())) {
            let nextEventDate = eventDate;
            if (event.title.toLowerCase().includes("anniversary")) {
              const eventThisYear = setYear(eventDate, getYear(today));
              nextEventDate = eventThisYear;
              if (isPast(nextEventDate) && differenceInDays(nextEventDate, today) !== 0) {
                nextEventDate = addYears(eventThisYear, 1);
              }
            } else if (isPast(eventDate)) {
              return;
            }

            const validTypes = ['birthday', 'anniversary', 'meeting', 'event'];
            const isValidType = validTypes.some(type => event.title.toLowerCase().includes(type));
            if (!isValidType) return;
            if (/major|alumni|currently|studies|descriptor/i.test(event.title)) return;

            const daysRemaining = differenceInDays(nextEventDate, today);
            if (daysRemaining >= 0 && daysRemaining <= upcomingThresholdDays) {
              events.push({ id: `event-${event.id}`, daysRemaining });
            }
          }
        } catch (e) {}
      });
    });

    return events;
  }, [contextFilteredContacts]);

  const contactsNearYou = useMemo(() => {
    return contextFilteredContacts.filter(c => c.currentLocation && c.currentLocation.trim().length > 0);
  }, [contextFilteredContacts]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "NN";
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  };

  const handleJoinCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyCode.trim()) return;

    setIsJoining(true);
    setTimeout(() => {
      setJoinedCompany(true);
      setCompanyName(companyCode.toUpperCase() === "FIGMA" ? "Figma" : "Acme Corp");
      setCurrentContext("company");
      setIsJoining(false);
      setCompanyCode("");
      toast({
        title: "Joined Workspace!",
        description: `Successfully joined ${companyCode.toUpperCase() === "FIGMA" ? "Figma" : "Acme Corp"}. Operating in Company context.`
      });
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerTriage(file.name);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      triggerTriage(file.name);
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file.",
        variant: "destructive"
      });
    }
  };

  const triggerTriage = (filename: string) => {
    setImportedFileName(filename);
    setImportContactsList(MOCK_IMPORT_CONTACTS);
    setTriageIndex(0);
    setIsImporting(true);
  };

  const handleTriageAction = async (action: 'add' | 'skip') => {
    const contact = importContactsList[triageIndex];
    if (action === 'add') {
      await addContact({
        name: contact.name,
        occupation: contact.occupation,
        company: contact.company,
        email: contact.email,
        hometown: contact.hometown,
        category: currentContext === 'company' ? 'Professional' : 'Friend',
        isCompanyContact: currentContext === 'company',
        companyContextType: currentContext === 'company' ? 'shared' : undefined,
        lastUpdatedBy: currentContext === 'company' ? 'Jordan' : undefined,
        tags: ["CSV Import", contact.company || "LinkedIn"].filter(Boolean)
      });
      toast({
        title: "Contact Added",
        description: `${contact.name} has been added to your Memore.`
      });
    }

    if (triageIndex < importContactsList.length - 1) {
      setTriageIndex(prev => prev + 1);
    } else {
      setIsImporting(false);
      setImportContactsList([]);
      toast({
        title: "Triage Complete!",
        description: "Successfully processed LinkedIn network CSV."
      });
    }
  };

  const triggerLeaveCompany = () => {
    setOffboardingStep(1);
    setIsOffboardingOpen(true);
  };

  const handleConfirmLeave = () => {
    if (exportChoice === 'export') {
      const privateContacts = contacts.filter(c => c.isCompanyContact && c.companyContextType === 'private');
      privateContacts.forEach(contact => {
        addContact({
          ...contact,
          isCompanyContact: false,
          companyContextType: undefined,
          tags: [...contact.tags, "Exported From Figma"]
        });
      });
      
      toast({
        title: "Export Success",
        description: `${privateContacts.length} private contacts migrated to your Personal Memore.`
      });
    }
    setOffboardingStep(2);
  };

  const finalizeLeaveCompany = () => {
    setIsOffboardingOpen(false);
    setJoinedCompany(false);
    toast({
      title: "Left Company Workspace",
      description: "Successfully left the company workspace. Context reverted to Personal."
    });
  };

  const privateContactsCount = contacts.filter(c => c.isCompanyContact && c.companyContextType === 'private').length;

  return (
    <div className="flex flex-col min-h-full bg-[#FAF7F4] dark:bg-background px-4 sm:px-6 pt-3 pb-32 space-y-5 max-w-xl mx-auto w-full overflow-y-auto">
      {/* Offboarding Modal */}
      {isOffboardingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-card rounded-3xl p-5 max-w-md w-full border border-[rgba(26,15,6,0.08)] shadow-xl space-y-4">
            {offboardingStep === 1 ? (
              <>
                <div className="flex items-center gap-2 text-rose-500 font-bold text-lg">
                  <AlertTriangle className="h-5 w-5" />
                  Leave Figma Workspace?
                </div>
                <p className="text-xs text-[#8C7B6B]">
                  You have <span className="font-bold text-[#1A0F06]">{privateContactsCount} private contacts</span> scoped to Figma. Choose how to handle them:
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setExportChoice('export')}
                    className={`w-full p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-colors ${
                      exportChoice === 'export' ? 'border-[#C4622D] bg-[#FAEEE5]' : 'border-[rgba(26,15,6,0.08)] bg-white'
                    }`}
                  >
                    <input type="radio" checked={exportChoice === 'export'} onChange={() => setExportChoice('export')} className="mt-1 accent-[#C4622D]" />
                    <div>
                      <p className="text-xs font-bold text-[#1A0F06]">Migrate to Personal Account (Recommended)</p>
                      <p className="text-[11px] text-[#8C7B6B]">Move all private contacts to your main personal dashboard.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportChoice('delete')}
                    className={`w-full p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-colors ${
                      exportChoice === 'delete' ? 'border-rose-500 bg-rose-50' : 'border-[rgba(26,15,6,0.08)] bg-white'
                    }`}
                  >
                    <input type="radio" checked={exportChoice === 'delete'} onChange={() => setExportChoice('delete')} className="mt-1 accent-rose-500" />
                    <div>
                      <p className="text-xs font-bold text-rose-600">Delete Private Notes</p>
                      <p className="text-[11px] text-rose-500/80">Wipe all private contacts and notes scoped to this company.</p>
                    </div>
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsOffboardingOpen(false)} className="rounded-2xl text-xs">Cancel</Button>
                  <Button 
                    size="sm"
                    onClick={handleConfirmLeave}
                    className={`rounded-2xl text-xs font-semibold text-white ${exportChoice === 'export' ? 'bg-[#C4622D] hover:bg-[#A84F20]' : 'bg-rose-600 hover:bg-rose-700'}`}
                  >
                    Confirm & Leave
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-3 py-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-[#1A0F06]">Migrated Successfully!</h3>
                <p className="text-xs text-[#8C7B6B]">
                  Your private contacts have been moved into your Personal workspace.
                </p>
                <Button className="w-full rounded-2xl bg-[#C4622D] text-white hover:bg-[#A84F20] text-xs font-semibold h-9" onClick={finalizeLeaveCompany}>
                  Continue into Personal Context
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSV Triage Modal */}
      {isImporting && importContactsList.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-card rounded-3xl p-5 max-w-md w-full border border-[rgba(26,15,6,0.08)] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-sm text-[#1A0F06] flex items-center gap-1.5">
                <UploadCloud className="h-4 w-4 text-[#C4622D]" /> Triaging CSV Imports
              </span>
              <Badge className="rounded-full bg-[#FAEEE5] text-[#C4622D] text-[10px] font-bold">
                {triageIndex + 1} of {importContactsList.length}
              </Badge>
            </div>
            <div className="bg-[#FAF7F4] rounded-2xl p-3.5 space-y-1.5 border border-[rgba(26,15,6,0.06)]">
              <p className="font-bold text-sm text-[#1A0F06]">{importContactsList[triageIndex].name}</p>
              {importContactsList[triageIndex].occupation && (
                <p className="text-xs text-[#5A4535]">{importContactsList[triageIndex].occupation} {importContactsList[triageIndex].company ? `at ${importContactsList[triageIndex].company}` : ''}</p>
              )}
              {importContactsList[triageIndex].hometown && (
                <p className="text-[11px] text-[#8C7B6B]">Hometown: {importContactsList[triageIndex].hometown}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleTriageAction('skip')} className="flex-1 rounded-2xl text-xs">Skip</Button>
              <Button size="sm" onClick={() => handleTriageAction('add')} className="flex-1 rounded-2xl bg-[#C4622D] text-white hover:bg-[#A84F20] text-xs font-semibold">Add Contact</Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Profile Header */}
      <div className="bg-white dark:bg-card rounded-3xl border border-[rgba(26,15,6,0.08)] shadow-sm p-5 text-center flex flex-col items-center space-y-3">
        <Avatar className="w-20 h-20 border-2 border-[#C4622D] shadow-sm">
          <AvatarImage src={currentUser?.photoURL || ""} alt={currentUser?.displayName || "User"} />
          <AvatarFallback className="text-xl font-bold bg-[#FAEEE5] text-[#C4622D]">
            {getInitials(currentUser?.displayName)}
          </AvatarFallback>
        </Avatar>

        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A0F06] dark:text-foreground">
            {currentUser?.displayName || "User Profile"}
          </h1>
          <p className="text-xs text-[#8C7B6B] dark:text-muted-foreground mt-0.5">
            {currentUser?.email || "dev@networknest.com"}
          </p>
        </div>

        {/* Context Switcher Segmented Control */}
        <div className="flex bg-[#FAF7F4] dark:bg-muted p-1 rounded-2xl border border-[rgba(26,15,6,0.08)] w-full max-w-sm">
          <button
            type="button"
            onClick={() => {
              setCurrentContext('personal');
              toast({ title: "Personal Context Active", description: "Showing personal connections." });
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
              currentContext === 'personal'
                ? 'bg-white dark:bg-card text-[#C4622D] shadow-sm'
                : 'text-[#8C7B6B] hover:text-[#1A0F06]'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${currentContext === 'personal' ? 'text-[#C4622D] fill-[#C4622D]' : 'text-[#8C7B6B]'}`} />
            Personal
          </button>
          <button
            type="button"
            onClick={() => {
              if (!joinedCompany) {
                toast({
                  title: "Join Workspace First",
                  description: "Please enter a corporate invite code below.",
                  variant: "destructive"
                });
                return;
              }
              setCurrentContext('company');
              toast({ title: "Company Context Active", description: `Operating in ${companyName} workspace.` });
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
              currentContext === 'company'
                ? 'bg-white dark:bg-card text-[#C4622D] shadow-sm'
                : 'text-[#8C7B6B] hover:text-[#1A0F06]'
            }`}
          >
            <Briefcase className={`h-3.5 w-3.5 ${currentContext === 'company' ? 'text-[#C4622D]' : 'text-[#8C7B6B]'}`} />
            Company ({joinedCompany ? companyName : 'Join'})
          </button>
        </div>
      </div>

      {/* Unified Quick Metrics Bar */}
      <div className="bg-white dark:bg-card rounded-3xl border border-[rgba(26,15,6,0.08)] shadow-sm p-4 flex justify-between items-center text-center">
        <Link href="/contacts" className="flex-1 py-1 group border-r border-[rgba(26,15,6,0.06)] last:border-0">
          <Users className="h-4 w-4 mx-auto mb-1 text-[#C4622D]" />
          <p className="text-base font-extrabold text-[#1A0F06] dark:text-foreground leading-none">{contextFilteredContacts.length}</p>
          <p className="text-[9px] font-bold text-[#B0A090] uppercase tracking-wider mt-1 group-hover:text-[#C4622D] transition-colors">Contacts</p>
        </Link>

        <Link href="/journal" className="flex-1 py-1 group border-r border-[rgba(26,15,6,0.06)] last:border-0">
          <FileText className="h-4 w-4 mx-auto mb-1 text-[#C4622D]" />
          <p className="text-base font-extrabold text-[#1A0F06] dark:text-foreground leading-none">{journalCount}</p>
          <p className="text-[9px] font-bold text-[#B0A090] uppercase tracking-wider mt-1 group-hover:text-[#C4622D] transition-colors">Entries</p>
        </Link>

        <Link href="/events" className="flex-1 py-1 group border-r border-[rgba(26,15,6,0.06)] last:border-0">
          <CalendarDays className="h-4 w-4 mx-auto mb-1 text-[#C4622D]" />
          <p className="text-base font-extrabold text-[#1A0F06] dark:text-foreground leading-none">{upcomingEvents.length}</p>
          <p className="text-[9px] font-bold text-[#B0A090] uppercase tracking-wider mt-1 group-hover:text-[#C4622D] transition-colors">Events</p>
        </Link>

        <Link href="/realmap" className="flex-1 py-1 group last:border-0">
          <MapPin className="h-4 w-4 mx-auto mb-1 text-[#C4622D]" />
          <p className="text-base font-extrabold text-[#1A0F06] dark:text-foreground leading-none">{contactsNearYou.length}</p>
          <p className="text-[9px] font-bold text-[#B0A090] uppercase tracking-wider mt-1 group-hover:text-[#C4622D] transition-colors">Near You</p>
        </Link>
      </div>

      {/* Account Details Card */}
      <div className="bg-white dark:bg-card rounded-3xl border border-[rgba(26,15,6,0.08)] shadow-sm p-5 space-y-4">
        <span className="text-[11px] font-bold text-[#B0A090] uppercase tracking-wider font-sans block">
          ACCOUNT DETAILS
        </span>
        
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-[#B0A090] uppercase tracking-wider">Display Name</Label>
            <Input value={currentUser?.displayName || "User Name"} readOnly className="rounded-2xl border-[rgba(26,15,6,0.12)] bg-[#FAF7F4] text-sm h-10 px-3.5" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-[#B0A090] uppercase tracking-wider">Email Address</Label>
            <Input type="email" value={currentUser?.email || "user@example.com"} readOnly className="rounded-2xl border-[rgba(26,15,6,0.12)] bg-[#FAF7F4] text-sm h-10 px-3.5" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold text-[#B0A090] uppercase tracking-wider">School / Organization</Label>
            <Input value={currentUser?.education?.college || "Mankato University"} readOnly className="rounded-2xl border-[rgba(26,15,6,0.12)] bg-[#FAF7F4] text-sm h-10 px-3.5" />
          </div>
        </div>
      </div>

      {/* LinkedIn CSV Import Section */}
      <div className="bg-white dark:bg-card rounded-3xl border border-[rgba(26,15,6,0.08)] shadow-sm p-5 space-y-3">
        <span className="text-[11px] font-bold text-[#B0A090] uppercase tracking-wider font-sans flex items-center gap-1.5">
          <UploadCloud className="h-3.5 w-3.5 text-[#C4622D]" /> IMPORT LINKEDIN CONTACTS
        </span>
        <p className="text-xs text-[#8C7B6B]">
          Batch import & triage exported contacts from LinkedIn or CSV files.
        </p>

        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[rgba(26,15,6,0.12)] rounded-2xl p-6 text-center cursor-pointer bg-[#FAF7F4] hover:bg-[#FAEEE5] transition-colors flex flex-col items-center justify-center space-y-2"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept=".csv"
            className="hidden" 
          />
          <div className="h-10 w-10 rounded-full bg-[#FAEEE5] text-[#C4622D] flex items-center justify-center">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="font-bold text-xs text-[#1A0F06]">Drag & drop LinkedIn CSV file here</p>
          <p className="text-[11px] text-[#8C7B6B]">Or click to browse from computer</p>
        </div>
      </div>

      {/* Company Org Workspace Management */}
      <div className="bg-white dark:bg-card rounded-3xl border border-[rgba(26,15,6,0.08)] shadow-sm p-5 space-y-3">
        <span className="text-[11px] font-bold text-[#B0A090] uppercase tracking-wider font-sans flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5 text-[#C4622D]" /> WORKSPACE ORGANIZATION
        </span>

        {!joinedCompany ? (
          <form onSubmit={handleJoinCompany} className="space-y-3">
            <div className="bg-[#FAEEE5] rounded-2xl p-3.5 text-xs space-y-2 border border-[rgba(196,98,45,0.2)]">
              <p className="font-bold text-[#C4622D] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Domain Detected: Figma Workspace
              </p>
              <p className="text-[#5A4535]">
                Your email domain allows auto-joining Figma Workspace.
              </p>
              <Button 
                type="button" 
                size="sm"
                onClick={() => {
                  setCompanyCode("Figma");
                  setJoinedCompany(true);
                  setCompanyName("Figma");
                  setCurrentContext("company");
                  toast({ title: "Workspace Active!", description: "Joined Figma Workspace." });
                }}
                className="rounded-2xl bg-[#C4622D] text-white hover:bg-[#A84F20] text-xs font-semibold h-8 px-3"
              >
                Quick Join Figma Workspace
              </Button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#B0A090] uppercase tracking-wider">Corporate Invite Code</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter code (e.g. FIGMA)"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  className="rounded-2xl border-[rgba(26,15,6,0.12)] bg-[#FAF7F4] text-sm h-10 px-3.5"
                />
                <Button type="submit" disabled={isJoining} className="rounded-2xl bg-[#C4622D] text-white hover:bg-[#A84F20] text-xs font-semibold px-4 h-10">
                  {isJoining ? "Joining..." : "Join"}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F4] border border-[rgba(26,15,6,0.08)]">
              <div>
                <h4 className="font-bold text-sm text-[#1A0F06]">{companyName} Workspace</h4>
                <p className="text-xs text-[#8C7B6B]">Shared directory active</p>
              </div>
              <Button variant="outline" size="sm" onClick={triggerLeaveCompany} className="rounded-2xl text-xs text-rose-600 border-rose-200 hover:bg-rose-50">
                Leave
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
