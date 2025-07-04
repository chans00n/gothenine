'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RichTextEditor } from './rich-text-editor'
import { dailyNotesService } from '@/lib/services/daily-notes'
import { toast } from '@/lib/toast'
import { 
  FileText, 
  Save, 
  Tag, 
  Calendar,
  Star,
  StarOff,
  Download,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DailyNotesProps {
  challengeId: string
  date?: Date
  className?: string
}

export function DailyNotes({ 
  challengeId, 
  date = new Date(),
  className 
}: DailyNotesProps) {
  const [content, setContent] = useState('')
  const [contentJson, setContentJson] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [noteId, setNoteId] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const dateStr = date.toISOString().split('T')[0]

  // Load existing note
  useEffect(() => {
    loadNote()
  }, [challengeId, dateStr])

  const loadNote = async () => {
    setIsLoading(true)
    try {
      const note = await dailyNotesService.getNoteByDate(challengeId, dateStr)
      if (note) {
        setNoteId(note.id)
        setContent(note.content)
        setContentJson(note.content_json)
        setTitle(note.title || '')
        setTags(note.tags || [])
        setIsFavorite(note.is_favorite)
        setLastSaved(new Date(note.updated_at))
      }
    } catch (error) {
      console.error('Error loading note:', error)
      toast.error('Failed to load note')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Note content cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      const result = await dailyNotesService.saveNote(challengeId, dateStr, {
        title,
        content,
        content_json: contentJson,
        tags
      })

      if (result) {
        setNoteId(result.id)
        setLastSaved(new Date(result.updated_at))
        toast.success('Note saved successfully')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error('Failed to save note')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleToggleFavorite = async () => {
    if (!noteId) return

    const success = await dailyNotesService.toggleFavorite(noteId)
    if (success) {
      setIsFavorite(!isFavorite)
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
    }
  }

  const handleExport = async () => {
    try {
      const markdown = await dailyNotesService.exportNotes(challengeId)
      
      // Create download
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '75hard-notes.md'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Notes exported successfully')
    } catch (error) {
      console.error('Error exporting notes:', error)
      toast.error('Failed to export notes')
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Daily Notes
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              {date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              disabled={!noteId}
            >
              {isFavorite ? (
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              title="Export all notes"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="note-title">Title (optional)</Label>
          <Input
            id="note-title"
            placeholder="Today's reflection..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Editor */}
        <div className="space-y-2">
          <Label>Content</Label>
          <RichTextEditor
            content={content}
            onChange={(html, json) => {
              setContent(html)
              setContentJson(json)
            }}
            placeholder="Write about your day, challenges, victories, and reflections..."
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="note-tags">Tags</Label>
          <div className="flex gap-2">
            <Input
              id="note-tags"
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            />
            <Button type="button" variant="secondary" onClick={handleAddTag}>
              <Tag className="h-4 w-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            {lastSaved && (
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}