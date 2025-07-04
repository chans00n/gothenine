-- Create water_intake table
CREATE TABLE IF NOT EXISTS public.water_intake (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  date date NOT NULL,
  amount integer NOT NULL DEFAULT 0, -- Amount in ounces
  goal integer NOT NULL DEFAULT 128, -- Daily goal in ounces (1 gallon = 128 oz)
  unit varchar(10) DEFAULT 'oz' CHECK (unit IN ('oz', 'ml', 'cups', 'liters')),
  intake_log jsonb DEFAULT '[]'::jsonb, -- Array of intake entries with timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create unique constraint for one entry per day per challenge
CREATE UNIQUE INDEX idx_water_intake_unique ON public.water_intake(challenge_id, date);

-- Create indexes for faster queries
CREATE INDEX idx_water_intake_challenge_id ON public.water_intake(challenge_id);
CREATE INDEX idx_water_intake_date ON public.water_intake(date);

-- Enable RLS
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own water intake" ON public.water_intake
  FOR SELECT USING (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own water intake" ON public.water_intake
  FOR INSERT WITH CHECK (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own water intake" ON public.water_intake
  FOR UPDATE USING (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own water intake" ON public.water_intake
  FOR DELETE USING (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_water_intake_updated_at BEFORE UPDATE ON public.water_intake
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.water_intake IS 'Tracks daily water intake with hourly log entries';