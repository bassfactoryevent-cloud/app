-- Create page_views table for web analytics
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  pathname TEXT NOT NULL,
  referrer TEXT,
  source TEXT DEFAULT 'direct',
  country TEXT DEFAULT 'Colombia',
  country_code TEXT DEFAULT 'CO',
  city TEXT DEFAULT 'Bogotá',
  region TEXT,
  device_type TEXT DEFAULT 'mobile',
  browser TEXT DEFAULT 'chrome',
  os TEXT DEFAULT 'android',
  session_id TEXT,
  user_id UUID,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_source ON public.page_views (source);
CREATE INDEX IF NOT EXISTS idx_page_views_pathname ON public.page_views (pathname);
CREATE INDEX IF NOT EXISTS idx_page_views_city ON public.page_views (city);
CREATE INDEX IF NOT EXISTS idx_page_views_device ON public.page_views (device_type);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'page_views' AND policyname = 'Allow public insert on page_views'
  ) THEN
    CREATE POLICY "Allow public insert on page_views"
      ON public.page_views FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'page_views' AND policyname = 'Allow admin read on page_views'
  ) THEN
    CREATE POLICY "Allow admin read on page_views"
      ON public.page_views FOR SELECT
      TO authenticated, service_role
      USING (true);
  END IF;
END
$$;
