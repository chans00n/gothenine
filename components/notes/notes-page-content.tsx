'use client'

import { useState, useEffect } from 'react'
import { DailyNotes } from '@/components/notes/daily-notes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { dailyNotesService } from '@/lib/services/daily-notes'
import { 
  FileText, 
  Search, 
  Calendar,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NotesPageContentProps {
  challengeId: string
}

interface NoteHistory {
  id: string
  date: string
  title?: string
  content: string
  tags?: string[]
  is_favorite: boolean
}

export function NotesPageContent({ challengeId }: NotesPageContentProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [noteHistory, setNoteHistory] = useState<NoteHistory[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    loadNoteHistory()
  }, [challengeId])

  const loadNoteHistory = async () => {
    const history = await dailyNotesService.getNoteHistory(challengeId, 30)
    setNoteHistory(history)
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadNoteHistory()
      return
    }

    setIsSearching(true)
    const results = await dailyNotesService.searchNotes(challengeId, searchTerm)
    setNoteHistory(results)
    setIsSearching(false)
  }

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    
    // Don't go beyond today
    if (newDate > new Date()) {
      return
    }
    
    setSelectedDate(newDate)
  }

  const filteredHistory = showFavoritesOnly 
    ? noteHistory.filter(note => note.is_favorite)
    : noteHistory

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const noteDate = new Date(date)
    noteDate.setHours(0, 0, 0, 0)
    
    if (noteDate.getTime() === today.getTime()) return 'Today'
    if (noteDate.getTime() === today.getTime() - 86400000) return 'Yesterday'
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <div className="container max-w-4xl px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Daily Notes</h1>
        <p className="text-muted-foreground">
          Record your thoughts, reflections, and progress throughout your journey.
        </p>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDateChange(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-center">
          <div className="text-lg font-medium">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedDate.toLocaleDateString() === new Date().toLocaleDateString() 
              ? 'Today' 
              : (() => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const selected = new Date(selectedDate)
                  selected.setHours(0, 0, 0, 0)
                  const days = Math.floor((today.getTime() - selected.getTime()) / (1000 * 60 * 60 * 24))
                  return `${days} days ago`
                })()
            }
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDateChange(1)}
          disabled={selectedDate.toDateString() === new Date().toDateString()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Note Editor */}
      <DailyNotes 
        challengeId={challengeId} 
        date={selectedDate}
        key={selectedDate.toISOString()} // Force remount on date change
      />

      {/* Search and History */}
      <Card>
        <CardHeader>
          <CardTitle>Note History</CardTitle>
          <CardDescription>
            Search and browse your previous notes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button 
              variant="secondary"
              onClick={handleSearch}
              disabled={isSearching}
            >
              Search
            </Button>
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="icon"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star className={cn(
                "h-4 w-4",
                showFavoritesOnly && "fill-current"
              )} />
            </Button>
          </div>

          {/* History List */}
          <div className="space-y-2">
            <AnimatePresence>
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {showFavoritesOnly 
                    ? "No favorite notes yet" 
                    : searchTerm 
                    ? "No notes found matching your search" 
                    : "No notes written yet"
                  }
                </div>
              ) : (
                filteredHistory.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors",
                      "hover:bg-muted/50"
                    )}
                    onClick={() => {
                      const noteDate = new Date(note.date)
                      noteDate.setHours(12) // Set to noon to avoid timezone issues
                      setSelectedDate(noteDate)
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatDate(note.date)}
                          </span>
                          {note.is_favorite && (
                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                          )}
                        </div>
                        {note.title && (
                          <h4 className="font-medium mt-1">{note.title}</h4>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {note.content.replace(/<[^>]*>/g, '')} {/* Strip HTML */}
                        </p>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {note.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {note.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{note.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}