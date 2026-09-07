CREATE TABLE IF NOT EXISTS monuments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  architectural_style TEXT,
  built_century TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  state TEXT,
  district TEXT,
  locality TEXT,
  circle TEXT,
  street_view_id TEXT
);

ALTER TABLE monuments ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE monuments ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE monuments ADD COLUMN IF NOT EXISTS locality TEXT;
ALTER TABLE monuments ADD COLUMN IF NOT EXISTS circle TEXT;

CREATE TABLE IF NOT EXISTS monument_logistics (
  monument_id UUID PRIMARY KEY REFERENCES monuments(id) ON DELETE CASCADE,
  opening_time TEXT DEFAULT '06:00',
  closing_time TEXT DEFAULT '18:00',
  closed_days TEXT DEFAULT 'None',
  ticket_indian INTEGER DEFAULT 50,
  ticket_foreigner INTEGER DEFAULT 600,
  ticket_saarc INTEGER DEFAULT 50,
  ticket_student INTEGER DEFAULT 0,
  camera_fee INTEGER DEFAULT 0,
  booking_url TEXT DEFAULT 'https://asi.payumoney.com/'
);

ALTER TABLE monument_logistics ADD COLUMN IF NOT EXISTS ticket_student INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS saved_monuments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monument_id UUID NOT NULL REFERENCES monuments(id) ON DELETE CASCADE,
  visited BOOLEAN DEFAULT false,
  saved_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, monument_id)
);

ALTER TABLE saved_monuments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN   
  CREATE POLICY "Users can view their own saves" ON saved_monuments FOR SELECT USING (auth.uid() = user_id);   
  CREATE POLICY "Users can insert their own saves" ON saved_monuments FOR INSERT WITH CHECK (auth.uid() = user_id);   
  CREATE POLICY "Users can update their own saves" ON saved_monuments FOR UPDATE USING (auth.uid() = user_id);   
  CREATE POLICY "Users can delete their own saves" ON saved_monuments FOR DELETE USING (auth.uid() = user_id); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE monuments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monument_logistics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Public read access to monuments" ON monuments FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public insert access to monuments" ON monuments FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public update access to monuments" ON monuments FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public read access to monument_logistics" ON monument_logistics FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public insert access to monument_logistics" ON monument_logistics FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public update access to monument_logistics" ON monument_logistics FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON monuments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monument_logistics TO anon, authenticated;
