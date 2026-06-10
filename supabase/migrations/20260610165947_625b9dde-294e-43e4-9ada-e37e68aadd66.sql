
CREATE TABLE public.extension_site_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'none',
  contrast_boost INTEGER NOT NULL DEFAULT 0,
  font_size INTEGER NOT NULL DEFAULT 100,
  line_height INTEGER NOT NULL DEFAULT 100,
  readable_font BOOLEAN NOT NULL DEFAULT false,
  high_readability BOOLEAN NOT NULL DEFAULT false,
  focus_enhance BOOLEAN NOT NULL DEFAULT true,
  link_underline BOOLEAN NOT NULL DEFAULT true,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, hostname)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.extension_site_profiles TO authenticated;
GRANT ALL ON public.extension_site_profiles TO service_role;
ALTER TABLE public.extension_site_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own extension profiles" ON public.extension_site_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own extension profiles" ON public.extension_site_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own extension profiles" ON public.extension_site_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own extension profiles" ON public.extension_site_profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_extension_site_profiles_updated_at
  BEFORE UPDATE ON public.extension_site_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_extension_site_profiles_user ON public.extension_site_profiles(user_id);

CREATE TABLE public.extension_global_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  polymorph_ai BOOLEAN NOT NULL DEFAULT true,
  global_override BOOLEAN NOT NULL DEFAULT false,
  global_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.extension_global_settings TO authenticated;
GRANT ALL ON public.extension_global_settings TO service_role;
ALTER TABLE public.extension_global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own extension global" ON public.extension_global_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_extension_global_settings_updated_at
  BEFORE UPDATE ON public.extension_global_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
