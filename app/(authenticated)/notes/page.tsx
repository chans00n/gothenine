import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotesPageContent } from '@/components/notes/notes-page-content'

export default async function NotesPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get active challenge
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // If no active challenge, create one
  if (!challenge) {
    const { data: newChallenge, error: createError } = await supabase
      .from('challenges')
      .insert({
        user_id: user.id,
        start_date: new Date().toISOString(),
        challenge_type: '75hard',
        is_active: true
      })
      .select()
      .single()

    if (createError || !newChallenge) {
      redirect('/dashboard')
    }

    return <NotesPageContent challengeId={newChallenge.id} />
  }

  return <NotesPageContent challengeId={challenge.id} />
}