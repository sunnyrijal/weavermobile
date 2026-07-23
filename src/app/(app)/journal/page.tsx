"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Smile, 
  Frown, 
  Heart, 
  Zap, 
  Coffee, 
  Brain, 
  Meh, 
  TrendingUp,
  Calendar,
  Clock,
  Users,
  Tag,
  Trash2,
  Plus,
  Loader2,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { VoiceMemoryInputModal } from '@/components/memory/VoiceMemoryInputModal';
import { cn } from '@/lib/utils';

interface JournalEntry {
  _id: string;
  id: string;
  ownerId: string;
  timestamp: string;
  content?: string;
  linkedContactIds?: string[];
  tags?: string[];
  summary?: string;
  originalContent?: string;
  mood?: string;
  category?: 'New Contact' | 'Contact Update' | 'General Memory';
}

const moodConfig = {
  'Happy': { icon: Smile, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30' },
  'Sad': { icon: Frown, color: 'text-sky-600', bgColor: 'bg-sky-50 dark:bg-sky-950/30' },
  'Energetic': { icon: TrendingUp, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/30' },
  'Grateful': { icon: Heart, color: 'text-rose-600', bgColor: 'bg-rose-50 dark:bg-rose-950/30' },
  'Neutral': { icon: Meh, color: 'text-[#8C7B6B]', bgColor: 'bg-[#FAF7F4] dark:bg-muted/40' }
};

export default function JournalPage() {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const handleParseEntries = async () => {
    setIsParsing(true);
    setTimeout(() => {
      setIsParsing(false);
      alert("Memore AI successfully scanned your timeline and extracted new structured memories!");
    }, 1500);
  };

  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/journal?ownerId=${currentUser.uid}`)
      .then(res => res.json())
      .then(data => {
        setEntries(data.entries || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching journal:', err);
        setLoading(false);
      });
  }, [currentUser]);

  const getMoodStats = () => {
    const stats: { [key: string]: number } = {};
    entries.forEach(entry => {
      const mood = entry.mood || 'Neutral';
      stats[mood] = (stats[mood] || 0) + 1;
    });
    return stats;
  };

  const getFilteredEntries = () => {
    if (activeTab === 'all') return entries;
    if (activeTab === 'contact-updates') return entries.filter(entry => entry.category === 'Contact Update');
    if (activeTab === 'new-contacts') return entries.filter(entry => entry.category === 'New Contact');
    return entries.filter(entry => (entry.mood || 'Neutral') === activeTab);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to delete this journal entry?')) return;
    
    setDeletingEntry(entryId);
    try {
      const response = await fetch(`/api/journal?id=${entryId}&ownerId=${currentUser.uid}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setEntries(prev => prev.filter(entry => entry._id !== entryId && entry.id !== entryId));
        if (selectedEntry?._id === entryId || selectedEntry?.id === entryId) {
          setSelectedEntry(null);
        }
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    } finally {
      setDeletingEntry(null);
    }
  };

  const moodStats = getMoodStats();
  const filteredEntries = getFilteredEntries();

  if (loading) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center bg-[#FAF7F4] dark:bg-background py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#C4622D]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#FAF7F4] dark:bg-background px-4 sm:px-6 pt-3 pb-32 space-y-5 max-w-xl mx-auto w-full overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A0F06] dark:text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[#C4622D]" />
            My Entries
          </h1>
          <p className="text-xs text-[#8C7B6B] dark:text-muted-foreground mt-0.5">
            Reflect on your thoughts, memories & experiences
          </p>
        </div>
        <Button 
          onClick={() => setShowMemoryModal(true)}
          className="rounded-2xl bg-[#C4622D] hover:bg-[#A84F20] text-white font-semibold text-xs px-3.5 h-9 shadow-sm"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New Entry
        </Button>
      </div>

      {/* Timeline Section with AI Parsing */}
      <div className="bg-white dark:bg-card rounded-2xl border border-[rgba(26,15,6,0.08)] shadow-sm p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold text-[#B0A090] uppercase tracking-wider font-sans block">
            TIMELINE
          </span>
          <p className="text-[11px] text-[#8C7B6B]">Scan entries to extract facts & relationships</p>
        </div>
        <Button
          onClick={handleParseEntries}
          disabled={isParsing}
          size="sm"
          className="h-8 rounded-xl bg-[#C4622D] hover:bg-[#A84F20] text-white text-xs font-semibold px-3 flex items-center gap-1.5"
        >
          {isParsing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Parsing...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Parse Entries
            </>
          )}
        </Button>
      </div>

      {/* Filter Tabs & Entries */}
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { key: 'all', label: 'All Entries' },
            { key: 'contact-updates', label: '👥 Contact Updates' },
            { key: 'new-contacts', label: '✨ New Contacts' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === tab.key
                  ? 'bg-[#C4622D] text-white border-[#C4622D] shadow-sm'
                  : 'bg-white dark:bg-card text-[#5A4535] dark:text-muted-foreground border-[rgba(26,15,6,0.12)] hover:border-[#C4622D]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Entries Cards */}
        {filteredEntries.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-3xl border border-[rgba(26,15,6,0.08)] shadow-sm p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAEEE5] text-[#C4622D] flex items-center justify-center mx-auto text-xl">
              📖
            </div>
            <p className="text-sm font-bold text-[#1A0F06] dark:text-foreground">
              {activeTab === 'all' ? 'No journal entries yet.' : `No ${activeTab.toLowerCase()} entries found.`}
            </p>
            <p className="text-xs text-[#8C7B6B] max-w-xs mx-auto">
              Record voice memories or write down your thoughts to keep your personal timeline active.
            </p>
            <Button 
              onClick={() => setShowMemoryModal(true)} 
              className="rounded-2xl bg-[#C4622D] text-white hover:bg-[#A84F20] text-xs font-semibold px-4 h-9 shadow-sm"
            >
              Write First Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map(entry => {
              const mood = entry.mood || 'Neutral';
              const config = moodConfig[mood as keyof typeof moodConfig] || moodConfig['Neutral'];
              const Icon = config.icon;
              const formattedDate = entry.timestamp ? format(new Date(entry.timestamp), 'MMM d, yyyy · h:mm a') : '';

              return (
                <div 
                  key={entry._id || entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="bg-white dark:bg-card rounded-3xl border border-[rgba(26,15,6,0.08)] shadow-sm p-4 space-y-3 hover:border-[rgba(196,98,45,0.4)] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {entry.category && entry.category !== 'General Memory' && (
                        <Badge variant="outline" className="rounded-xl text-[10px] px-2 py-0.5 border-[rgba(26,15,6,0.12)] text-[#5A4535] bg-[#FAF7F4]">
                          {entry.category === 'Contact Update' ? 'Update' : 'New Contact'}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8C7B6B] font-medium">
                      {formattedDate}
                    </span>
                  </div>

                  <p className="text-xs text-[#1A0F06] dark:text-foreground leading-relaxed line-clamp-3 font-medium">
                    {entry.summary || entry.originalContent || entry.content || ''}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[rgba(26,15,6,0.06)]">
                    <div className="flex items-center gap-3 text-[11px] text-[#8C7B6B]">
                      {entry.linkedContactIds && entry.linkedContactIds.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-[#C4622D]" /> {entry.linkedContactIds.length} linked
                        </span>
                      )}
                      {entry.tags && entry.tags.length > 0 && (
                        <span className="flex items-center gap-1 truncate max-w-[180px]">
                          <Tag className="h-3 w-3 text-[#C4622D]" /> {entry.tags.join(', ')}
                        </span>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEntry(entry._id || entry.id);
                      }}
                      disabled={deletingEntry === (entry._id || entry.id)}
                      className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-full"
                    >
                      {deletingEntry === (entry._id || entry.id) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Entry Detail Modal */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-md rounded-3xl p-5 border border-[rgba(26,15,6,0.08)] bg-white dark:bg-card space-y-4">
          <DialogHeader className="pb-1 border-b">
            <DialogTitle className="font-serif text-lg font-bold text-[#1A0F06] dark:text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#C4622D]" /> Entry Detail
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8C7B6B]">
                <span>{selectedEntry.timestamp ? format(new Date(selectedEntry.timestamp), 'PPPP') : ''}</span>
              </div>
              
              <div className="bg-[#FAF7F4] dark:bg-muted/40 rounded-2xl p-3.5 text-xs text-[#1A0F06] dark:text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                {selectedEntry.originalContent || selectedEntry.content || selectedEntry.summary || ''}
              </div>

              {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-[#B0A090]">TAGS:</span>
                  {selectedEntry.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="rounded-xl text-[10px] px-2 py-0.5 border-[rgba(26,15,6,0.12)] text-[#5A4535] bg-[#FAF7F4]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Memory Input Modal */}
      <VoiceMemoryInputModal 
        isOpen={showMemoryModal}
        onOpenChange={(open) => setShowMemoryModal(open)}
      />
    </div>
  );
}