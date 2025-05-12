
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
import { CalendarIcon, University, Users } from "lucide-react"; 
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format as formatDateFn } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect } from 'react'; // Added useEffect

export const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  occupation: z.string().optional(),
  company: z.string().optional(),
  college: z.string().optional(), 
  category: z.enum(["Family", "Friend", "Colleague", "Professional", "Partner", "Other", "Pet", ""]).optional(),
  ownerRelationshipLabel: z.string().optional().describe("Your specific relationship to this contact, e.g., Host Mom, Mentor, Childhood Friend."),
  locationDetails: z.string().optional(),
  birthday: z.date().optional().nullable(),
  photoURL: z.string().url({ message: "Invalid URL for photo." }).optional().or(z.literal('')),
  tags: z.string().optional(), 
});


interface ContactFormProps {
  onSubmit: (values: ContactFormValues) => Promise<void>;
  defaultValues?: Partial<ContactFormValues>;
  isEditMode?: boolean;
  isLoading?: boolean;
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
        locationDetails: '',
        birthday: null,
        photoURL: '',
        tags: '',
        ...defaultValues, 
      },
  });

  useEffect(() => {
    if (defaultValues) {
      const resetValues = {
        name: '',
        email: '',
        phone: '',
        occupation: '',
        company: '',
        college: '',
        category: '',
        ownerRelationshipLabel: '',
        locationDetails: '',
        birthday: null,
        photoURL: '',
        tags: '',
        ...defaultValues,
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

            <FormField
              control={form.control}
              name="locationDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., San Francisco, CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
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
