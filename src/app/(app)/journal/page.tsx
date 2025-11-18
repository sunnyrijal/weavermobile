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
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { VoiceMemoryInputModal } from '@/components/memory/VoiceMemoryInputModal';

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
  'Happy': { icon: Smile, color: 'bg-green-100 text-green-800', bgColor: 'bg-green-50' },
  'Sad': { icon: Frown, color: 'bg-blue-100 text-blue-800', bgColor: 'bg-blue-50' },
  'Energetic': { icon: TrendingUp, color: 'bg-orange-100 text-orange-800', bgColor: 'bg-orange-50' },
  'Grateful': { icon: Heart, color: 'bg-pink-100 text-pink-800', bgColor: 'bg-pink-50' },
  'Neutral': { icon: Meh, color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-50' }
};

export default function JournalPage() {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);
  const [showMemoryModal, setShowMemoryModal] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/journal?ownerId=${currentUser.uid}`)
      .then(res => res.json())
      .then(data => {
        setEntries(data.entries || []);
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
    
    if (!confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }
    
    setDeletingEntry(entryId);
    try {
      const response = await fetch(`/api/journal?id=${entryId}&ownerId=${currentUser.uid}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setEntries(prev => prev.filter(entry => entry._id !== entryId));
        if (selectedEntry?._id === entryId) {
          setSelectedEntry(null);
        }
      } else {
        const error = await response.json();
        alert(`Failed to delete entry: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete journal entry');
    } finally {
      setDeletingEntry(null);
    }
  };

  const moodStats = getMoodStats();
  const filteredEntries = getFilteredEntries();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            My Journal
          </h1>
          <Button 
            onClick={() => setShowMemoryModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Entry
          </Button>
        </div>
        <p className="text-muted-foreground">Reflect on your thoughts and experiences</p>
      </div>

      {/* Mood Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Mood Overview</h2>
        <div className="grid grid-cols-5 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
          {Object.entries(moodConfig).map(([mood, config]) => {
            const count = moodStats[mood] || 0;
            const Icon = config.icon;
            return (
              <Card key={mood} className={`${config.bgColor} hover:shadow-md transition-shadow cursor-pointer`}>
                <CardContent className="p-2 md:p-4 text-center">
                  <Icon className={`h-4 w-4 md:h-6 md:w-6 mx-auto mb-0.5 md:mb-2 ${config.color}`} />
                  <p className="text-[10px] md:text-sm font-medium leading-tight">{mood}</p>
                  <p className="text-base md:text-2xl font-bold">{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Journal Entries */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Entries</h2>
          <Badge variant="secondary">{filteredEntries.length} entries</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="contact-updates" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Updates
            </TabsTrigger>
            <TabsTrigger value="new-contacts" className="flex items-center gap-1">
              <Plus className="h-3 w-3" />
              New
            </TabsTrigger>
            {Object.keys(moodConfig).map(mood => (
              <TabsTrigger key={mood} value={mood} className="flex items-center gap-1">
                {(() => {
                  const Icon = moodConfig[mood as keyof typeof moodConfig].icon;
                  return <Icon className="h-3 w-3" />;
                })()}
                {mood}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  {activeTab === 'all' ? 'No journal entries yet.' : `No ${activeTab.toLowerCase()} entries.`}
                </p>
                <p className="text-sm text-muted-foreground">Start writing to see your entries here.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                                 {filteredEntries.map((entry) => {
                   const mood = entry.mood || 'Neutral';
                   const moodConfigForEntry = moodConfig[mood as keyof typeof moodConfig];
                   const Icon = moodConfigForEntry.icon;
                   
                   return (
                     <Card 
                       key={entry._id || entry.id} 
                       className={`${moodConfigForEntry.bgColor} hover:shadow-lg transition-all duration-200 border-0`}
                     >
                       <CardHeader className="pb-3">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <Icon className={`h-5 w-5 ${moodConfigForEntry.color}`} />
                             <Badge variant="outline" className={moodConfigForEntry.color}>
                               {mood}
                             </Badge>
                             {entry.category && entry.category !== 'General Memory' && (
                               <Badge variant="secondary" className="text-xs">
                                 {entry.category === 'Contact Update' ? 'Update' : 'New Contact'}
                               </Badge>
                             )}
                           </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(entry.timestamp), 'MMM dd, yyyy')}
                            <Clock className="h-3 w-3" />
                            {format(new Date(entry.timestamp), 'HH:mm')}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div 
                            className="prose prose-sm max-w-none cursor-pointer"
                            onClick={() => setSelectedEntry(entry)}
                          >
                            <p className="text-sm leading-relaxed">
                              {entry.summary || entry.originalContent || entry.content || ''}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {entry.linkedContactIds && entry.linkedContactIds.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>{entry.linkedContactIds.length} contact{entry.linkedContactIds.length !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                              {entry.tags && entry.tags.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  <span>{entry.tags.join(', ')}</span>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEntry(entry._id);
                              }}
                              disabled={deletingEntry === entry._id}
                            >
                              {deletingEntry === entry._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Entry Detail Modal */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEntry && (() => {
                const mood = selectedEntry.mood || 'Neutral';
                const config = moodConfig[mood as keyof typeof moodConfig];
                const Icon = config.icon;
                return (
                  <>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                    Journal Entry
                  </>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={(() => {
                    const mood = selectedEntry.mood || 'Neutral';
                    return moodConfig[mood as keyof typeof moodConfig].color;
                  })()}>
                    {selectedEntry.mood || 'Neutral'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(selectedEntry.timestamp), 'MMMM dd, yyyy \'at\' HH:mm')}
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedEntry.originalContent || selectedEntry.content || selectedEntry.summary || ''}
                </div>
              </div>
              
              {(selectedEntry.tags?.length || selectedEntry.linkedContactIds?.length) && (
                <div className="space-y-2 pt-4 border-t">
                  {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Tags:</span>
                      <div className="flex gap-1">
                        {selectedEntry.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedEntry.linkedContactIds && selectedEntry.linkedContactIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Linked Contacts:</span>
                      <div className="flex gap-1">
                        {selectedEntry.linkedContactIds.map(id => (
                          <Badge key={id} variant="outline" className="text-xs">
                            {id}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
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