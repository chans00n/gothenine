-- Create walk_history table
CREATE TABLE IF NOT EXISTS public.walk_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  duration integer NOT NULL, -- Duration in seconds
  distance numeric(10,2), -- Distance in miles/km (user preference)
  distance_unit varchar(10) DEFAULT 'miles' CHECK (distance_unit IN ('miles', 'km')),
  walk_type varchar(20) DEFAULT 'outdoor' CHECK (walk_type IN ('outdoor', 'indoor')),
  notes text,
  completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX idx_walk_history_challenge_id ON public.walk_history(challenge_id);
CREATE INDEX idx_walk_history_completed_at ON public.walk_history(completed_at);

-- Enable RLS
ALTER TABLE public.walk_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own walk history" ON public.walk_history
  FOR SELECT USING (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own walk history" ON public.walk_history
  FOR INSERT WITH CHECK (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own walk history" ON public.walk_history
  FOR UPDATE USING (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own walk history" ON public.walk_history
  FOR DELETE USING (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON TABLE public.walk_history IS 'Stores walk/run history with duration and distance for challenges';