
-- helper: updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE,
  avatar_url TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'C++',
  dsa_level TEXT NOT NULL DEFAULT 'Beginner',
  target_role TEXT NOT NULL DEFAULT 'Software Engineer',
  target_companies TEXT[] NOT NULL DEFAULT '{}',
  daily_target INT NOT NULL DEFAULT 3,
  interview_date DATE,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL DEFAULT 'dark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FRIENDSHIPS
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_friendships_req ON public.friendships(requester_id);
CREATE INDEX idx_friendships_add ON public.friendships(addressee_id);
CREATE TRIGGER trg_friendships_updated BEFORE UPDATE ON public.friendships FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.are_friends(a UUID, b UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
      AND ((f.requester_id = a AND f.addressee_id = b) OR (f.requester_id = b AND f.addressee_id = a))
  );
$$;

CREATE POLICY "profiles readable by self and friends" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.are_friends(auth.uid(), id));
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "friendships visible to participants" ON public.friendships FOR SELECT TO authenticated
USING (requester_id = auth.uid() OR addressee_id = auth.uid());
CREATE POLICY "friendships create own" ON public.friendships FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());
CREATE POLICY "friendships update participants" ON public.friendships FOR UPDATE TO authenticated
USING (requester_id = auth.uid() OR addressee_id = auth.uid());
CREATE POLICY "friendships delete participants" ON public.friendships FOR DELETE TO authenticated
USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- username lookup for friend requests (limited fields)
CREATE OR REPLACE FUNCTION public.find_user_by_username(uname TEXT)
RETURNS TABLE (id UUID, name TEXT, username TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.username FROM public.profiles p
  WHERE lower(p.username) = lower(uname) AND p.id <> auth.uid() LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.find_user_by_username(TEXT) TO authenticated;

-- PROBLEMS (shared library)
CREATE TABLE public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users ON DELETE SET NULL,
  title TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'Other',
  url TEXT,
  difficulty TEXT NOT NULL DEFAULT 'Easy' CHECK (difficulty IN ('Easy','Medium','Hard')),
  topic TEXT NOT NULL DEFAULT 'Arrays',
  subtopic TEXT,
  pattern TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  estimated_time INT NOT NULL DEFAULT 30,
  description TEXT,
  is_seed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.problems TO authenticated;
GRANT ALL ON public.problems TO service_role;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_problems_topic ON public.problems(topic);
CREATE INDEX idx_problems_difficulty ON public.problems(difficulty);
CREATE INDEX idx_problems_pattern ON public.problems(pattern);
CREATE INDEX idx_problems_created_by ON public.problems(created_by);
CREATE TRIGGER trg_problems_updated BEFORE UPDATE ON public.problems FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "problems readable" ON public.problems FOR SELECT TO authenticated USING (true);
CREATE POLICY "problems insert own" ON public.problems FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "problems update own" ON public.problems FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "problems delete own" ON public.problems FOR DELETE TO authenticated USING (created_by = auth.uid());

-- ATTEMPTS
CREATE TABLE public.problem_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems ON DELETE CASCADE,
  outcome TEXT NOT NULL DEFAULT 'solved_independently'
    CHECK (outcome IN ('solved_independently','solved_with_hint','solved_after_solution','failed')),
  is_resolve BOOLEAN NOT NULL DEFAULT false,
  time_taken_min INT NOT NULL DEFAULT 0,
  attempts_count INT NOT NULL DEFAULT 1,
  confidence INT NOT NULL DEFAULT 3 CHECK (confidence BETWEEN 1 AND 5),
  difficulty_felt INT NOT NULL DEFAULT 3 CHECK (difficulty_felt BETWEEN 1 AND 5),
  hints_used INT NOT NULL DEFAULT 0,
  key_idea TEXT,
  mistake_note TEXT,
  time_complexity TEXT,
  space_complexity TEXT,
  can_resolve_tomorrow BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  solved_on DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.problem_attempts TO authenticated;
GRANT ALL ON public.problem_attempts TO service_role;
ALTER TABLE public.problem_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_attempts_user_date ON public.problem_attempts(user_id, solved_on);
CREATE INDEX idx_attempts_problem ON public.problem_attempts(problem_id);
CREATE POLICY "attempts own all" ON public.problem_attempts FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "attempts friend read" ON public.problem_attempts FOR SELECT TO authenticated
USING (public.are_friends(auth.uid(), user_id));

-- USER PROBLEM STATE (mastery)
CREATE TABLE public.user_problem_state (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems ON DELETE CASCADE,
  mastery TEXT NOT NULL DEFAULT 'attempted'
    CHECK (mastery IN ('unseen','attempted','solved','understood','resolved','mastered')),
  last_confidence INT,
  total_attempts INT NOT NULL DEFAULT 0,
  solved_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, problem_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_problem_state TO authenticated;
GRANT ALL ON public.user_problem_state TO service_role;
ALTER TABLE public.user_problem_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ups own all" ON public.user_problem_state FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "ups friend read" ON public.user_problem_state FOR SELECT TO authenticated
USING (public.are_friends(auth.uid(), user_id));

-- REVIEWS
CREATE TABLE public.problem_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems ON DELETE CASCADE,
  due_date DATE NOT NULL,
  interval_index INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','skipped')),
  completed_at TIMESTAMPTZ,
  easier BOOLEAN,
  remembered_approach BOOLEAN,
  time_taken_min INT,
  confidence_now INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.problem_reviews TO authenticated;
GRANT ALL ON public.problem_reviews TO service_role;
ALTER TABLE public.problem_reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reviews_user_due ON public.problem_reviews(user_id, due_date, status);
CREATE POLICY "reviews own all" ON public.problem_reviews FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- MISTAKES
CREATE TABLE public.mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  attempt_id UUID REFERENCES public.problem_attempts ON DELETE CASCADE,
  problem_id UUID REFERENCES public.problems ON DELETE CASCADE,
  category TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mistakes TO authenticated;
GRANT ALL ON public.mistakes TO service_role;
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_mistakes_user ON public.mistakes(user_id, created_at DESC);
CREATE POLICY "mistakes own all" ON public.mistakes FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- DAILY MISSIONS
CREATE TABLE public.daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  mission_date DATE NOT NULL,
  target INT NOT NULL DEFAULT 3,
  completed_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_missions TO authenticated;
GRANT ALL ON public.daily_missions TO service_role;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions own all" ON public.daily_missions FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "missions friend read" ON public.daily_missions FOR SELECT TO authenticated
USING (public.are_friends(auth.uid(), user_id));

CREATE TABLE public.daily_mission_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.daily_missions ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems ON DELETE CASCADE,
  slot INT NOT NULL DEFAULT 1,
  completed BOOLEAN NOT NULL DEFAULT false,
  is_review BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_mission_items TO authenticated;
GRANT ALL ON public.daily_mission_items TO service_role;
ALTER TABLE public.daily_mission_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_mission_items_mission ON public.daily_mission_items(mission_id);
CREATE POLICY "mission items own all" ON public.daily_mission_items FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "mission items friend read" ON public.daily_mission_items FOR SELECT TO authenticated
USING (public.are_friends(auth.uid(), user_id));

-- ROADMAP
CREATE TABLE public.roadmap_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_order INT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  topics TEXT[] NOT NULL DEFAULT '{}',
  checklist TEXT[] NOT NULL DEFAULT '{}'
);
GRANT SELECT ON public.roadmap_phases TO authenticated;
GRANT ALL ON public.roadmap_phases TO service_role;
ALTER TABLE public.roadmap_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roadmap readable" ON public.roadmap_phases FOR SELECT TO authenticated USING (true);

CREATE TABLE public.user_phase_progress (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES public.roadmap_phases ON DELETE CASCADE,
  checked TEXT[] NOT NULL DEFAULT '{}',
  started BOOLEAN NOT NULL DEFAULT false,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, phase_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_phase_progress TO authenticated;
GRANT ALL ON public.user_phase_progress TO service_role;
ALTER TABLE public.user_phase_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "phase progress own all" ON public.user_phase_progress FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ACHIEVEMENTS
CREATE TABLE public.achievements (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'award',
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements readable" ON public.achievements FOR SELECT TO authenticated USING (true);

CREATE TABLE public.user_achievements (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  code TEXT NOT NULL REFERENCES public.achievements ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user achievements own all" ON public.user_achievements FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user achievements friend read" ON public.user_achievements FOR SELECT TO authenticated
USING (public.are_friends(auth.uid(), user_id));

-- MOCK OA
CREATE TABLE public.mock_oas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  duration_min INT NOT NULL,
  difficulty_mode TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  time_used_min INT,
  score INT,
  solved_count INT NOT NULL DEFAULT 0,
  total_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_oas TO authenticated;
GRANT ALL ON public.mock_oas TO service_role;
ALTER TABLE public.mock_oas ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_mock_user ON public.mock_oas(user_id, started_at DESC);
CREATE POLICY "mock own all" ON public.mock_oas FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "mock friend read" ON public.mock_oas FOR SELECT TO authenticated
USING (public.are_friends(auth.uid(), user_id));

CREATE TABLE public.mock_oa_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_id UUID NOT NULL REFERENCES public.mock_oas ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems ON DELETE CASCADE,
  solved BOOLEAN NOT NULL DEFAULT false,
  flagged BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 1
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_oa_problems TO authenticated;
GRANT ALL ON public.mock_oa_problems TO service_role;
ALTER TABLE public.mock_oa_problems ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_mock_problems_mock ON public.mock_oa_problems(mock_id);
CREATE POLICY "mock problems own all" ON public.mock_oa_problems FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ACTIVITY LOG + NUDGES/REACTIONS
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activity_user ON public.activity_logs(user_id, created_at DESC);
CREATE POLICY "activity own all" ON public.activity_logs FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "activity friend read" ON public.activity_logs FOR SELECT TO authenticated
USING (public.are_friends(auth.uid(), user_id));

CREATE TABLE public.duo_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('reaction','nudge')),
  payload TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.duo_signals TO authenticated;
GRANT ALL ON public.duo_signals TO service_role;
ALTER TABLE public.duo_signals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_signals_to ON public.duo_signals(to_user, created_at DESC);
CREATE POLICY "signals send" ON public.duo_signals FOR INSERT TO authenticated
WITH CHECK (from_user = auth.uid() AND public.are_friends(auth.uid(), to_user));
CREATE POLICY "signals read" ON public.duo_signals FOR SELECT TO authenticated
USING (from_user = auth.uid() OR to_user = auth.uid());
