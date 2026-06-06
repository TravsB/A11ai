
CREATE TABLE public.studio_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  url text NOT NULL,
  vision_profile text,
  contrast_level numeric,
  font_scale numeric,
  link_highlight boolean,
  dyslexia boolean,
  daltonize boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_bookmarks TO authenticated;
GRANT ALL ON public.studio_bookmarks TO service_role;

ALTER TABLE public.studio_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bookmarks" ON public.studio_bookmarks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own bookmarks" ON public.studio_bookmarks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bookmarks" ON public.studio_bookmarks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own bookmarks" ON public.studio_bookmarks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_studio_bookmarks_updated_at
  BEFORE UPDATE ON public.studio_bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX studio_bookmarks_user_id_idx ON public.studio_bookmarks(user_id, created_at DESC);
