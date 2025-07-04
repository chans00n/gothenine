-- Create daily_notes table
CREATE TABLE IF NOT EXISTS public.daily_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  date date NOT NULL,
  title varchar(255),
  content text NOT NULL,
  content_json jsonb, -- For rich text editor format (optional)
  tags text[], -- Array of tags for searching
  is_favorite boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create unique constraint for one main note per day per challenge
CREATE UNIQUE INDEX idx_daily_notes_unique ON public.daily_notes(challenge_id, date);

-- Create indexes for faster queries
CREATE INDEX idx_daily_notes_challenge_id ON public.daily_notes(challenge_id);
CREATE INDEX idx_daily_notes_date ON public.daily_notes(date);
CREATE INDEX idx_daily_notes_tags ON public.daily_notes USING gin(tags);
CREATE INDEX idx_daily_notes_content_search ON public.daily_notes USING gin(to_tsvector('english', content));

-- Enable RLS
ALTER TABLE public.daily_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notes" ON public.daily_notes
  FOR SELECT USING (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own notes" ON public.daily_notes
  FOR INSERT WITH CHECK (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notes" ON public.daily_notes
  FOR UPDATE USING (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own notes" ON public.daily_notes
  FOR DELETE USING (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_daily_notes_updated_at BEFORE UPDATE ON public.daily_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.daily_notes IS 'Stores daily notes and reflections for challenges';