CREATE TABLE public.shared_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  share_date DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'utc')::date),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_user, to_user, problem_id, share_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_problems TO authenticated;
GRANT ALL ON public.shared_problems TO service_role;
ALTER TABLE public.shared_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared read participants" ON public.shared_problems FOR SELECT TO authenticated USING (from_user = auth.uid() OR to_user = auth.uid());
CREATE POLICY "shared insert own" ON public.shared_problems FOR INSERT TO authenticated WITH CHECK (from_user = auth.uid() AND public.are_friends(auth.uid(), to_user));
CREATE POLICY "shared update participants" ON public.shared_problems FOR UPDATE TO authenticated USING (from_user = auth.uid() OR to_user = auth.uid());
CREATE POLICY "shared delete sender" ON public.shared_problems FOR DELETE TO authenticated USING (from_user = auth.uid());
CREATE INDEX idx_shared_to ON public.shared_problems(to_user, share_date DESC);
CREATE INDEX idx_shared_from ON public.shared_problems(from_user, share_date DESC);

CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'C++',
  code TEXT NOT NULL DEFAULT '',
  intuition TEXT,
  approach TEXT,
  time_complexity TEXT,
  space_complexity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions own all" ON public.submissions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "submissions friend read" ON public.submissions FOR SELECT TO authenticated USING (public.are_friends(auth.uid(), user_id));
CREATE INDEX idx_submissions_problem ON public.submissions(problem_id, created_at DESC);
CREATE INDEX idx_submissions_user ON public.submissions(user_id, created_at DESC);
CREATE TRIGGER trg_submissions_updated BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discussions TO authenticated;
GRANT ALL ON public.discussions TO service_role;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discussions own all" ON public.discussions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "discussions friend read" ON public.discussions FOR SELECT TO authenticated USING (public.are_friends(auth.uid(), user_id));
CREATE INDEX idx_discussions_problem ON public.discussions(problem_id, created_at DESC);