"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Heart, ShoppingBag, Star, Clock, MessageSquare, X, Sparkles, TrendingUp } from "lucide-react";
import { format } from 'date-fns';
import type { Contact } from '@/lib/types';

interface DisplayEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Birthday' | 'Anniversary' | 'Notable Event';
  icon: React.ElementType;
  daysRemaining: number;
  contactId?: string;
}

interface EventGiftSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: DisplayEvent | null;
  contact: Contact | null;
}

// Enhanced: Generate gift suggestions with reasons
const generateGiftSuggestionsWithReasons = (contact: Contact, eventType: string): Array<{suggestion: string, reason: string}> => {
  const suggestions: Array<{suggestion: string, reason: string}> = [];
  const notes = contact.notes?.toLowerCase() || "";

  // Example: Use notes to personalize reasons
  if (eventType === 'Birthday') {
    suggestions.push({
      suggestion: 'Personalized photo book with memories',
      reason: 'She loves to travel and create memories, so a photo book would be meaningful.'
    });
    suggestions.push({
      suggestion: 'Gourmet food basket with their favorite treats',
      reason: 'A thoughtful treat for someone who enjoys new experiences.'
    });
    if (notes.includes('kayak') || notes.includes('sail')) {
      suggestions.push({
        suggestion: 'Kayaking or sailing experience',
        reason: 'She enjoys kayaking and sailing, so an outdoor adventure would be perfect.'
      });
    }
    if (notes.includes('run')) {
      suggestions.push({
        suggestion: 'Entry to a local fun run or running gear',
        reason: 'She wants to go running together, so running gear or an event entry would be appreciated.'
      });
    }
    suggestions.push({
      suggestion: 'Experience gift (spa day, concert tickets)',
      reason: 'She values experiences, and last year she mentioned wanting to go to a concert.'
    });
    suggestions.push({
      suggestion: 'Charitable donation in their name',
      reason: 'If she volunteers or supports causes, a donation in her name would be meaningful.'
    });
  } else if (eventType === 'Anniversary') {
    suggestions.push({
      suggestion: 'Romantic dinner at their favorite restaurant',
      reason: 'A classic way to celebrate a special milestone.'
    });
    suggestions.push({
      suggestion: 'Personalized jewelry with meaningful engraving',
      reason: 'A keepsake to commemorate the occasion.'
    });
    suggestions.push({
      suggestion: 'Weekend getaway package',
      reason: 'She likes to go on vacation, so a getaway would be a wonderful surprise.'
    });
  }

  // Add a local experience if location is available
  if (contact.currentLocation) {
    suggestions.push({
      suggestion: `Local experience in ${contact.currentLocation}`,
      reason: `She enjoys exploring new places, so something in ${contact.currentLocation} would be fun.`
    });
  }

  // Limit to 5-6 suggestions
  return suggestions.slice(0, 6);
};

// Mock past gifts data
const getPastGifts = (contactId: string): Array<{id: string, gift: string, date: string, rating: number}> => {
  return [
    { id: '1', gift: 'Personalized coffee mug', date: '2024-01-15', rating: 5 },
    { id: '2', gift: 'Book: "The Art of Living"', date: '2023-12-10', rating: 4 },
    { id: '3', gift: 'Handmade scarf', date: '2023-11-20', rating: 5 },
  ];
};

// Mock interaction summary
const getInteractionSummary = (contact: Contact): string => {
  const interactions = [
    'Met for coffee last month - discussed their new job',
    'Attended their birthday party in December',
    'Helped them move apartments in November',
    'Regular text conversations about shared interests'
  ];
  
  return interactions.join('. ');
};

// Helper to generate a summary explanation
const generateSummaryExplanation = (contact: Contact, eventType: string): string => {
  // In a real app, this would use AI and real notes/bio
  let base = `Based on past notes and bio of ${contact.name}, here is what they may like for their ${eventType.toLowerCase()}.`;
  if (contact.notes?.toLowerCase().includes('coffee')) {
    base += ` They love coffee, so coffee-related gifts are a great choice.`;
  }
  if (contact.notes?.toLowerCase().includes('book')) {
    base += ` They enjoy reading, so books or personalized photo books are meaningful.`;
  }
  // Add more logic as needed
  return base;
};

export function EventGiftSuggestionModal({ isOpen, onClose, event, contact }: EventGiftSuggestionModalProps) {
  console.log('Modal props:', { isOpen, event: event?.title, contact: contact?.name });
  
  const [giftSuggestions, setGiftSuggestions] = useState<Array<{suggestion: string, reason: string}>>([]);
  const [pastGifts, setPastGifts] = useState<Array<{id: string, gift: string, date: string, rating: number}>>([]);
  const [interactionSummary, setInteractionSummary] = useState<string>('');
  const [summaryExplanation, setSummaryExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && event && contact) {
      setIsLoading(true);
      
      // Simulate AI processing
      setTimeout(() => {
        setGiftSuggestions(generateGiftSuggestionsWithReasons(contact, event.type));
        setPastGifts(getPastGifts(contact.id));
        setInteractionSummary(getInteractionSummary(contact));
        setSummaryExplanation(generateSummaryExplanation(contact, event.type));
        setIsLoading(false);
      }, 1000);
    }
  }, [isOpen, event, contact]);

  if (!event || !contact) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-background/95 backdrop-blur-sm border-2 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <event.icon className="h-5 w-5 text-primary" />
              Gift Suggestions for {event.title}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* AI Summary Explanation */}
        <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-primary/10 shadow">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="font-semibold text-base">Why these suggestions?</span>
          </div>
          <p className="text-sm text-muted-foreground">{summaryExplanation}</p>
        </div>

        <div className="space-y-6">
          {/* Event Info */}
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <event.icon className="h-6 w-6 text-primary" />
                {event.title}
              </CardTitle>
              <CardDescription className="text-base">
                {format(event.date, 'MMMM do, yyyy')} • {event.daysRemaining} days away
              </CardDescription>
            </CardHeader>
          </Card>

          {/* AI Gift Suggestions */}
          <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-6 w-6 text-accent" />
                AI-Powered Gift Suggestions
              </CardTitle>
              <CardDescription className="text-base">
                Personalized recommendations based on {contact.name}'s interests and your relationship
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Generating personalized suggestions...
                </div>
              ) : (
                <div className="space-y-3">
                  {giftSuggestions.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                      <Gift className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.suggestion}</p>
                        <p className="text-xs text-muted-foreground mt-1 italic">{item.reason}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        Find
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Gifts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Past Gifts
              </CardTitle>
              <CardDescription>
                Gifts you've given to {contact.name} in the past
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastGifts.map((gift) => (
                  <div key={gift.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{gift.gift}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(gift.date), 'MMM do, yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < gift.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interaction Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Recent Interactions
              </CardTitle>
              <CardDescription>
                Summary of your recent interactions with {contact.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {interactionSummary}
              </p>
            </CardContent>
          </Card>

          {/* Ads Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Sponsored Suggestions
              </CardTitle>
              <CardDescription>
                Handpicked recommendations from our partners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">Sponsored</Badge>
                    <span className="text-xs text-muted-foreground">Amazon</span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">Premium Coffee Subscription</h4>
                  <p className="text-xs text-muted-foreground mb-2">Perfect for coffee lovers</p>
                  <Button size="sm" className="w-full">
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    View Deal
                  </Button>
                </div>
                
                <div className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">Sponsored</Badge>
                    <span className="text-xs text-muted-foreground">Etsy</span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">Personalized Jewelry</h4>
                  <p className="text-xs text-muted-foreground mb-2">Handcrafted with love</p>
                  <Button size="sm" className="w-full">
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    View Deal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
            <Button className="flex-1">
              <Gift className="h-4 w-4 mr-2" />
              Save to Wishlist
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 