"use client";

import type { ContactFormValues } from "@/lib/types/forms";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, University, Users, UploadCloud, MapPin, Home, Plus, X } from "lucide-react"; 
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format as formatDateFn } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useState, useEffect } from 'react'; 
import { useNavigation } from "react-day-picker";

export const contactFormSchema = z.object({
  name: z.string().optional(), // Make name optional since we're using separate fields
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  preferredName: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  occupation: z.string().optional(),
  company: z.string().optional(),
  college: z.string().optional(), 
  category: z.enum(["Family", "Friend", "Colleague", "Professional", "Partner", "Other", "Pet", ""]).optional(),
  ownerRelationshipLabel: z.string().optional().describe("Your specific relationship to this contact, e.g., Host Mom, Mentor, Childhood Friend."),
  hometown: z.string().optional(),
  currentLocation: z.string().optional(),
  birthday: z.date().optional().nullable(),
  photoURL: z.string().url({ message: "Invalid URL for photo." }).optional().or(z.literal('')),
  photoFile: z.instanceof(File).optional().nullable().refine(
    (file) => !file || file.size <= 2 * 1024 * 1024, // Max 2MB
    `File size should be less than 2MB.`
  ).refine(
    (file) => !file || (file.type.startsWith("image/") && /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)),
    `Invalid file type. Please upload an image (jpg, jpeg, png, gif, webp).`
  ),
  tags: z.string().optional(), 
  gender: z.enum(["Male", "Female", "Other", ""]).optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Require at least firstName or lastName to be filled
  return (data.firstName && data.firstName.trim()) || (data.lastName && data.lastName.trim()) || (data.name && data.name.trim());
}, {
  message: "At least First Name or Last Name is required.",
  path: ["firstName"] // This will show the error on the firstName field
});


interface ContactFormProps {
  onSubmit: (values: ContactFormValues) => Promise<void>;
  defaultValues?: Partial<ContactFormValues>;
  isEditMode?: boolean;
  isLoading?: boolean;
}

// Custom Caption for Calendar (minimal, just dropdowns side by side)
function CalendarCaption({ displayMonth, className }) {
  const { goToMonth } = useNavigation();

  // Add state for years and months
  const [years, setYears] = useState<number[]>([]);
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    // Only run on client
    const now = new Date();
    const currentYear = now.getFullYear();
    const yearsArr: number[] = [];
    for (let y = 1900; y <= currentYear; y++) yearsArr.push(y);
    setYears(yearsArr);
    const monthsArr: string[] = [];
    for (let i = 0; i < 12; i++) {
      monthsArr.push(new Date(2000, i).toLocaleString(undefined, { month: "long" }));
    }
    setMonths(monthsArr);
  }, []);

  return (
    <div className={`flex items-center gap-2 justify-center mb-2 ${className || ""}`}>
      <label className="sr-only" htmlFor="month-select">Month</label>
      <select
        id="month-select"
        className="appearance-none border rounded-md px-3 py-2 pr-8 text-sm bg-white cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        value={displayMonth.getMonth()}
        onChange={e => goToMonth(new Date(displayMonth.getFullYear(), Number(e.target.value)))}
        aria-label="Select month"
      >
        {months.map((month, idx) => (
          <option key={month} value={idx}>{month}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor="year-select">Year</label>
      <select
        id="year-select"
        className="appearance-none border rounded-md px-3 py-2 pr-8 text-sm bg-white cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        value={displayMonth.getFullYear()}
        onChange={e => goToMonth(new Date(Number(e.target.value), displayMonth.getMonth()))}
        aria-label="Select year"
      >
        {years.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
  );
}

export function ContactForm({ onSubmit, defaultValues, isEditMode = false, isLoading = false }: ContactFormProps) {
  const [relationships, setRelationships] = useState<Array<{
    id: string;
    type: string;
    name: string;
    notes?: string;
  }>>([]);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
        name: '',
        firstName: '',
        middleName: '',
        lastName: '',
        preferredName: '',
        email: '',
        phone: '',
        occupation: '',
        company: '',
        college: '', 
        category: '',
        ownerRelationshipLabel: '',
        hometown: '',
        currentLocation: '',
        birthday: null,
        photoURL: '',
        photoFile: null,
        tags: '',
        gender: '',
        notes: '',
        ...defaultValues, 
      },
  });

  useEffect(() => {
    if (defaultValues) {
      const resetValues: ContactFormValues = {
        name: defaultValues.name || '',
        firstName: defaultValues.firstName || '',
        middleName: defaultValues.middleName || '',
        lastName: defaultValues.lastName || '',
        preferredName: defaultValues.preferredName || '',
        email: defaultValues.email || '',
        phone: defaultValues.phone || '',
        occupation: defaultValues.occupation || '',
        company: defaultValues.company || '',
        college: defaultValues.college || '',
        category: defaultValues.category || '',
        ownerRelationshipLabel: defaultValues.ownerRelationshipLabel || '',
        hometown: defaultValues.hometown || '',
        currentLocation: defaultValues.currentLocation || '',
        birthday: defaultValues.birthday instanceof Date ? defaultValues.birthday : null,
        photoURL: defaultValues.photoURL || '',
        photoFile: null, // File input should not be pre-filled with existing file objects for security/UX reasons
        tags: defaultValues.tags || '',
        gender: defaultValues.gender || '',
        notes: defaultValues.notes || '',
      };
      form.reset(resetValues);
    }
  }, [defaultValues, form.reset]);


  const handleFormSubmit = async (values: ContactFormValues) => {
    console.log('Form submitted with values:', values);
    console.log('Relationships:', relationships);
    
    // Convert relationships to the format expected by the API
    const relationshipsData = relationships
      .filter(r => r.name.trim()) // Only include relationships with names
      .map(r => ({
        name: r.name.trim(),
        type: r.type,
        customLabel: r.notes || '',
        notes: r.notes || ''
      }));

    console.log('Processed relationships:', relationshipsData);

    // Call the original onSubmit with the form values and relationships
    await onSubmit({
      ...values,
      relationships: relationshipsData
    } as any);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? "Edit Contact" : "Add New Contact"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter middle name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferredName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Nickname or preferred name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
               <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tech Solutions Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="college"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <University className="mr-2 h-4 w-4 text-muted-foreground" />
                    College / University
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., University of Example" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="hometown"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                      Hometown
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kritipur, Nepal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      Current Location
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., San Francisco, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Primary Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Friend">Friend</SelectItem>
                        <SelectItem value="Family">Family</SelectItem>
                        <SelectItem value="Colleague">Colleague</SelectItem>
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Partner">Partner</SelectItem>
                        <SelectItem value="Pet">Pet</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormDescription>The general category for this contact.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Birthday</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    formatDateFn(field.value, "PPP") 
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                month={field.value ?? undefined}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                                fromYear={1900}
                                toYear={new Date().getFullYear()}
                                components={{
                                  Caption: CalendarCaption
                                }}
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
              control={form.control}
              name="ownerRelationshipLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                     <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                     Your Relationship with Them
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., My Host Mom, Childhood Friend, Mentor" {...field} />
                  </FormControl>
                  <FormDescription>
                    Describe your specific connection to this person (optional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="photoURL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com/photo.jpg" {...field} />
                  </FormControl>
                  <FormDescription>
                    Link to an image for the contact's profile.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photoFile"
              render={({ field: { onChange, value, ...rest } }) => ( // Destructure onChange to handle file input
                <FormItem>
                  <FormLabel className="flex items-center">
                      <UploadCloud className="mr-2 h-4 w-4 text-muted-foreground" />
                      Upload Photo
                  </FormLabel>
                  <FormControl>
                    <Input 
                        type="file" 
                        accept="image/jpeg, image/png, image/gif, image/webp"
                        onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                        {...rest} 
                    />
                  </FormControl>
                  <FormDescription>
                    Or upload an image file (max 2MB: jpg, png, gif, webp). This will override the Photo URL if both are provided.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Used for gendered relationship terms (e.g., Daughter/Son).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., colleague, tech, design" {...field} />
                  </FormControl>
                  <FormDescription>
                    Comma-separated list of tags.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-medium">Relationships</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newRelationship = {
                      id: Date.now().toString(),
                      type: 'Family',
                      name: '',
                      notes: ''
                    };
                    setRelationships([...relationships, newRelationship]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Relationship
                </Button>
              </div>
              
              {relationships.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                  No relationships added yet. Click "Add Relationship" to get started.
                </div>
              )}
              
              {relationships.map((relationship, index) => (
                <div key={relationship.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Relationship {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRelationships(relationships.filter(r => r.id !== relationship.id));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={relationship.type}
                        onValueChange={(value) => {
                          const updated = [...relationships];
                          updated[index].type = value;
                          setRelationships(updated);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Family">Family</SelectItem>
                          <SelectItem value="Parent">Parent</SelectItem>
                          <SelectItem value="Child">Child</SelectItem>
                          <SelectItem value="Sibling">Sibling</SelectItem>
                          <SelectItem value="Partner">Partner</SelectItem>
                          <SelectItem value="Friend">Friend</SelectItem>
                          <SelectItem value="Colleague">Colleague</SelectItem>
                          <SelectItem value="Pet">Pet</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="Enter name"
                        value={relationship.name}
                        onChange={(e) => {
                          const updated = [...relationships];
                          updated[index].name = e.target.value;
                          setRelationships(updated);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      placeholder="Add details about this relationship..."
                      value={relationship.notes || ''}
                      onChange={(e) => {
                        const updated = [...relationships];
                        updated[index].notes = e.target.value;
                        setRelationships(updated);
                      }}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional notes about this contact..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Any additional information, memories, or details about this contact.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (isEditMode ? "Saving..." : "Adding...") : (isEditMode ? "Save Changes" : "Add Contact")}
            </Button>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
