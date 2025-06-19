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
import { CalendarIcon, University, Users, UploadCloud, MapPin, Home } from "lucide-react"; 
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format as formatDateFn } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect } from 'react'; 
import { useNavigation } from "react-day-picker";

export const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
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

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i).toLocaleString(undefined, { month: "long" })
  );
  const years = [];
  for (let y = 1900; y <= new Date().getFullYear(); y++) years.push(y);
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
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
        name: '',
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
        ...defaultValues, 
      },
  });

  useEffect(() => {
    if (defaultValues) {
      const resetValues: ContactFormValues = {
        name: defaultValues.name || '',
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
      };
      form.reset(resetValues);
    }
  }, [defaultValues, form.reset]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? "Edit Contact" : "Add New Contact"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (isEditMode ? "Saving..." : "Adding...") : (isEditMode ? "Save Changes" : "Add Contact")}
            </Button>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
