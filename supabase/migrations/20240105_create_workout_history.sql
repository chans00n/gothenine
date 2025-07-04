-- Create workout_history table
CREATE TABLE IF NOT EXISTS public.workout_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  duration integer NOT NULL, -- Duration in seconds
  completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_workout_history_challenge_id ON public.workout_history(challenge_id);
CREATE INDEX idx_workout_history_completed_at ON public.workout_history(completed_at);

-- Enable RLS
ALTER TABLE public.workout_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own workout history" ON public.workout_history
  FOR SELECT USING (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own workout history" ON public.workout_history
  FOR INSERT WITH CHECK (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own workout history" ON public.workout_history
  FOR UPDATE USING (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own workout history" ON public.workout_history
  FOR DELETE USING (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON TABLE public.workout_history IS 'Stores workout duration history for challenges';