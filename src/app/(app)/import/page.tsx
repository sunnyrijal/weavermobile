
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { ImportedContactPreview } from "@/lib/types";
import { UploadCloud, Smartphone, Loader2 } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, useMemo, Suspense } from "react";

const importSources = [
  { id: "google", name: "Google Contacts", icon: UploadCloud, color: "text-blue-500" },
  { id: "phone", name: "Phone Contacts", icon: Smartphone, color: "text-green-500" },
];

// Fetch contacts from Google or device
const fetchImportableContacts = async (source: string, contacts?: any[]): Promise<ImportedContactPreview[]> => {
  if (source === "phone" && contacts) {
    // Transform device contacts to preview format
    return contacts.map((contact, i) => ({
      sourceId: `device_contact_${i + 1}`,
      name: contact.name?.[0] || 'Unknown',
      email: contact.email?.[0] || '',
      phone: contact.tel?.[0] || '',
      photoURL: contact.icon?.[0] || undefined,
      details: contact.address?.[0] || '',
    }));
  }
  
  if (source === "google") {
    // In production, this would call the Google import API
    // For now, return empty array - user will need to complete OAuth flow
    return [];
  }
  
  return [];
};


function ImportPageContent() {
  const searchParams = useSearchParams();
  const initialSource = searchParams.get('source');
  
  const [selectedSource, setSelectedSource] = useState<string | null>(initialSource);
  const [isLoading, setIsLoading] = useState(false);
  const [importableContacts, setImportableContacts] = useState<ImportedContactPreview[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Record<string, boolean>>({});
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const currentSourceDetails = useMemo(() => importSources.find(s => s.id === selectedSource), [selectedSource]);

  useEffect(() => {
    if (initialSource) {
      handleSourceSelect(initialSource);
    }
  }, [initialSource]);

  const handleDeviceImport = async () => {
    const props = ['name', 'email', 'tel', 'address', 'icon'];
    const opts = { multiple: true };
    
    try {
      // @ts-ignore - navigator.contacts is not in standard TypeScript types
      if (!navigator.contacts || !navigator.contacts.select) {
        toast({ 
          title: "Not Supported", 
          description: "Contact Picker API is not available in this browser. Please use Chrome on Android or a supported browser.", 
          variant: "destructive" 
        });
        return;
      }
      
      // @ts-ignore
      const contacts = await navigator.contacts.select(props, opts);
      
      if (contacts && contacts.length > 0) {
        setSelectedSource("phone");
        setIsLoading(true);
        const previewContacts = await fetchImportableContacts("phone", contacts);
        setImportableContacts(previewContacts);
        setSelectedContacts(previewContacts.reduce((acc, c) => ({ ...acc, [c.sourceId]: true }), {}));
        setIsLoading(false);
        toast({ 
          title: `Selected ${previewContacts.length} contacts`, 
          description: "Review and select contacts to import." 
        });
      }
    } catch (ex: any) {
      console.error('Error selecting contacts:', ex);
      if (ex.name === 'AbortError' || ex.name === 'NotSupportedError') {
        toast({ 
          title: "Not Supported", 
          description: "Contact Picker API is not available. Please use Chrome on Android or try importing from Google Contacts instead.", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Error", 
          description: ex.message || "Failed to access device contacts.", 
          variant: "destructive" 
        });
      }
    }
  };

  const handleGoogleImport = async () => {
    setSelectedSource("google");
    setIsLoading(true);
    setImportableContacts([]);
    setSelectedContacts({});
    
    try {
      // Redirect to Google OAuth or trigger OAuth flow
      // For now, we'll show a message that this needs to be implemented
      toast({ 
        title: "Google Import", 
        description: "Redirecting to Google to authorize contact access..." 
      });
      
      // In production, redirect to OAuth endpoint
      // window.location.href = `/api/contacts/import/google/auth?ownerId=${currentUser?.uid}`;
      
      // For now, simulate fetching (in production, this would happen after OAuth callback)
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ 
        title: "Google Import", 
        description: "Please complete the OAuth flow to import contacts from Google.", 
        variant: "default" 
      });
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      setSelectedSource(null);
    }
    setIsLoading(false);
  };

  const handleSourceSelect = async (sourceId: string) => {
    if (sourceId === "phone") {
      await handleDeviceImport();
    } else if (sourceId === "google") {
      await handleGoogleImport();
    }
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setSelectedContacts(importableContacts.reduce((acc, c) => ({ ...acc, [c.sourceId]: checked }), {}));
  };

  const handleImportSelected = async () => {
    const contactsToImport = importableContacts.filter(c => selectedContacts[c.sourceId]);
    if (contactsToImport.length === 0) {
      toast({ title: "No contacts selected", description: "Please select at least one contact to import.", variant: "destructive" });
      return;
    }
    
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      // Get ownerId from auth context or localStorage
      const ownerId = localStorage.getItem('userId') || 'user1'; // TODO: Get from auth context
      
      const importEndpoint = selectedSource === "phone" 
        ? "/api/contacts/import/device"
        : "/api/contacts/import/google";
      
      const response = await fetch(importEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts: contactsToImport,
          ownerId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to import contacts');
      }
      
      const result = await response.json();
      
      // Update progress
      setImportProgress(100);
      
      toast({ 
        title: "Import Complete!", 
        description: `Successfully imported ${result.contacts?.length || contactsToImport.length} contacts.` 
      });
      
      // Clear and reset
      setIsImporting(false);
      setImportableContacts([]);
      setSelectedContacts({});
      setSelectedSource(null);
      
      // Optionally redirect to contacts page
      // router.push('/contacts');
    } catch (error) {
      console.error('Import error:', error);
      toast({ 
        title: "Import Failed", 
        description: (error as Error).message || "Failed to import contacts. Please try again.", 
        variant: "destructive" 
      });
      setIsImporting(false);
    }
  };
  
  const numSelected = Object.values(selectedContacts).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><UploadCloud className="text-primary"/> Find Friends</CardTitle>
          <CardDescription>Import contacts from your Google account or device address book.</CardDescription>
        </CardHeader>
        {!selectedSource && (
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {importSources.map(source => (
                <Button 
                    key={source.id} 
                    variant="outline" 
                    className="flex flex-col h-32 items-center justify-center gap-2 p-4 hover:bg-accent/50 hover:border-accent transition-all duration-200 ease-in-out transform hover:scale-105"
                    onClick={() => handleSourceSelect(source.id)}
                    disabled={isLoading}
                >
                    <source.icon className={`h-10 w-10 ${source.color}`} />
                    <span className="text-center text-sm sm:text-base">{source.name}</span>
                </Button>
                ))}
            </CardContent>
        )}
      </Card>


      {isLoading && selectedSource && (
        <Card className="shadow-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Connecting to {currentSourceDetails?.name}...</p>
            <p className="text-muted-foreground">Please wait while we fetch your contacts.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && selectedSource && importableContacts.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <CardTitle>Review Contacts from {currentSourceDetails?.name}</CardTitle>
                    <CardDescription>Select the contacts you wish to import.</CardDescription>
                </div>
                <Button variant="ghost" onClick={() => { setSelectedSource(null); setImportableContacts([]); }} className="w-full sm:w-auto">Change Source</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-2 mb-4 p-3 bg-muted/50 rounded-md">
              <div className="flex items-center space-x-2">
                <Checkbox 
                    id="select-all" 
                    checked={numSelected === importableContacts.length && importableContacts.length > 0}
                    onCheckedChange={(checked) => handleToggleSelectAll(Boolean(checked))}
                />
                <Label htmlFor="select-all" className="text-sm font-medium">
                    Select All ({numSelected} / {importableContacts.length} selected)
                </Label>
              </div>
              <Button onClick={handleImportSelected} disabled={isImporting || numSelected === 0} className="w-full sm:w-auto">
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import Selected
              </Button>
            </div>

            {isImporting && <Progress value={importProgress} className="w-full mb-4" />}
            
            <ul className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {importableContacts.map(contact => (
                <li key={contact.sourceId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                        id={contact.sourceId} 
                        checked={selectedContacts[contact.sourceId] || false}
                        onCheckedChange={(checked) => setSelectedContacts(prev => ({ ...prev, [contact.sourceId]: Boolean(checked)}))}
                    />
                    <Label htmlFor={contact.sourceId} className="flex items-center gap-3 cursor-pointer">
                        {contact.photoURL && (
                          <Image 
                              src={contact.photoURL} 
                              alt={contact.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                              data-ai-hint="person avatar"
                          />
                        )}
                        {!contact.photoURL && (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                            <p className="font-medium text-sm sm:text-base">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.email || contact.phone || contact.details || 'No contact info'}</p>
                        </div>
                    </Label>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="border-t pt-4">
             <p className="text-xs text-muted-foreground">
                Smart tagging will be applied during import. Duplicate contacts will be automatically detected and merged.
             </p>
          </CardFooter>
        </Card>
      )}
      {!isLoading && selectedSource && importableContacts.length === 0 && !isImporting && (
         <Card className="shadow-md">
            <CardContent className="p-6 text-center">
                <p className="text-lg font-medium">No contacts found in {currentSourceDetails?.name}.</p>
                <p className="text-muted-foreground mb-4">Or, there might have been an issue fetching them.</p>
                <Button onClick={() => { setSelectedSource(null); }} className="w-full sm:w-auto" >Try Another Source</Button>
            </CardContent>
         </Card>
      )}
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ImportPageContent />
    </Suspense>
  );
}

