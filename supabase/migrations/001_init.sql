-- ============================================
-- BugFix - Veritabanı Migration
-- ============================================

-- 1. TEAMS
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  avatar_color TEXT NOT NULL,
  total_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ROUNDS
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  buggy_code TEXT NOT NULL,
  language TEXT DEFAULT 'javascript',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SUBMISSIONS
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  submitted_code TEXT NOT NULL,
  ai_score INT,
  ai_feedback JSONB,
  final_score INT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, round_id)
);

-- 4. EVENTS
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- teams
CREATE POLICY "teams_select" ON teams FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "teams_insert" ON teams FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "teams_update" ON teams FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "teams_delete" ON teams FOR DELETE TO service_role USING (true);

-- rounds
CREATE POLICY "rounds_select" ON rounds FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "rounds_insert" ON rounds FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "rounds_update" ON rounds FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "rounds_delete" ON rounds FOR DELETE TO service_role USING (true);

-- submissions
CREATE POLICY "submissions_select" ON submissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "submissions_insert" ON submissions FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "submissions_update" ON submissions FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "submissions_delete" ON submissions FOR DELETE TO service_role USING (true);

-- events
CREATE POLICY "events_select" ON events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "events_insert" ON events FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "events_update" ON events FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "events_delete" ON events FOR DELETE TO service_role USING (true);

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
