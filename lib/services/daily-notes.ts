import { createClient } from '@/lib/supabase/client'
import { queueOfflineAction } from './sync-service'
import { formatDateForDB, getUserTimezone, getTodayInTimezone } from '@/lib/utils/timezone'

interface DailyNote {
  id: string
  challenge_id: string
  date: string
  title?: string
  content: string
  content_json?: any
  tags?: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
}

interface NoteCreateData {
  title?: string
  content: string
  content_json?: any
  tags?: string[]
}

export class DailyNotesService {
  private static instance: DailyNotesService
  private supabase = createClient()
  
  private constructor() {}

  static getInstance(): DailyNotesService {
    if (!DailyNotesService.instance) {
      DailyNotesService.instance = new DailyNotesService()
    }
    return DailyNotesService.instance
  }

  // Get or create today's note
  async getTodayNote(challengeId: string): Promise<DailyNote | null> {
    const timezone = await getUserTimezone()
    const today = getTodayInTimezone(timezone)
    const dateStr = formatDateForDB(today)

    return this.getNoteByDate(challengeId, dateStr)
  }

  // Get note by date (alias for getNoteByDate)
  async getNote(challengeId: string, date: Date): Promise<DailyNote | null> {
    const dateStr = formatDateForDB(date)
    return this.getNoteByDate(challengeId, dateStr)
  }

  // Get note by specific date
  async getNoteByDate(challengeId: string, date: string): Promise<DailyNote | null> {
    try {
      // Date should already be in YYYY-MM-DD format
      // If it includes time, extract just the date part
      const dateOnly = date.includes('T') ? date.split('T')[0] : date
      
      const { data, error } = await this.supabase
        .from('daily_notes')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('date', dateOnly)
        .maybeSingle()

      if (error) {
        // PGRST116 means no rows found, which is expected
        if (error.code !== 'PGRST116') {
          console.error('Error fetching note:', error)
        }
        return null
      }

      return data
    } catch (error) {
      console.error('Error getting note:', error)
      return null
    }
  }

  // Create or update note
  async saveNote(
    challengeId: string,
    date: string,
    noteData: NoteCreateData
  ): Promise<DailyNote | null> {
    try {
      // Date should already be in YYYY-MM-DD format
      // If it includes time, extract just the date part
      const dateOnly = date.includes('T') ? date.split('T')[0] : date
      
      // Check if note exists
      const existing = await this.getNoteByDate(challengeId, dateOnly)

      if (existing) {
        // Update existing note
        const updateData = {
          ...noteData,
          updated_at: new Date().toISOString()
        }

        const { data, error } = await this.supabase
          .from('daily_notes')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating note:', error)
          
          // Queue for offline sync
          queueOfflineAction(
            'daily_notes',
            'update',
            'daily_notes',
            { id: existing.id, ...updateData }
          )
          
          // Return updated object for UI consistency
          return {
            ...existing,
            ...updateData
          }
        }

        return data
      } else {
        // Create new note
        const createData = {
          challenge_id: challengeId,
          date: dateOnly,
          ...noteData,
          is_favorite: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data, error } = await this.supabase
          .from('daily_notes')
          .insert(createData)
          .select()
          .single()

        if (error) {
          console.error('Error creating note:', error)
          
          // Queue for offline sync
          queueOfflineAction(
            'daily_notes',
            'create',
            'daily_notes',
            createData
          )
          
          // Return temporary object for UI consistency
          return {
            id: crypto.randomUUID(),
            ...createData
          }
        }

        return data
      }
    } catch (error) {
      console.error('Error saving note:', error)
      return null
    }
  }

  // Get notes history
  async getNoteHistory(
    challengeId: string,
    limit: number = 30
  ): Promise<DailyNote[]> {
    try {
      const { data, error } = await this.supabase
        .from('daily_notes')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('date', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching note history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error getting note history:', error)
      return []
    }
  }

  // Search notes
  async searchNotes(
    challengeId: string,
    searchTerm: string
  ): Promise<DailyNote[]> {
    try {
      const { data, error } = await this.supabase
        .from('daily_notes')
        .select('*')
        .eq('challenge_id', challengeId)
        .textSearch('content', searchTerm)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error searching notes:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error searching notes:', error)
      return []
    }
  }

  // Toggle favorite
  async toggleFavorite(noteId: string): Promise<boolean> {
    try {
      // Get current state
      const { data: note } = await this.supabase
        .from('daily_notes')
        .select('is_favorite')
        .eq('id', noteId)
        .single()

      if (!note) return false

      // Update favorite status
      const updateData = { is_favorite: !note.is_favorite }
      
      const { error } = await this.supabase
        .from('daily_notes')
        .update(updateData)
        .eq('id', noteId)

      if (error) {
        console.error('Error toggling favorite:', error)
        
        // Queue for offline sync
        queueOfflineAction(
          'daily_notes',
          'update',
          'daily_notes',
          { id: noteId, ...updateData }
        )
      }

      return !error
    } catch (error) {
      console.error('Error toggling favorite:', error)
      return false
    }
  }

  // Export notes
  async exportNotes(challengeId: string): Promise<string> {
    const notes = await this.getNoteHistory(challengeId, 75) // Get all 75 days

    // Create markdown export
    let markdown = '# 75 Hard Challenge Notes\n\n'
    
    notes.forEach(note => {
      const date = new Date(note.date)
      markdown += `## ${date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}\n\n`
      
      if (note.title) {
        markdown += `### ${note.title}\n\n`
      }
      
      markdown += `${note.content}\n\n`
      
      if (note.tags && note.tags.length > 0) {
        markdown += `Tags: ${note.tags.join(', ')}\n\n`
      }
      
      markdown += '---\n\n'
    })

    return markdown
  }

}

// Export singleton instance
export const dailyNotesService = DailyNotesService.getInstance()