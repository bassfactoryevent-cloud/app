-- Insert the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-media', 'blog-media', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Everyone can view images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'blog-media');

-- Policy: Authenticated users (admin) can insert images
-- Note: Since we are bypassing auth locally for dev, we might need a looser policy for inserts during dev
-- But in Supabase, anonymous users cannot insert to storage unless explicitly allowed.
-- For local development without auth, we allow inserts from anon role.
CREATE POLICY "Anon Insert Access" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'blog-media');

CREATE POLICY "Anon Update Access"
ON storage.objects FOR UPDATE
USING (bucket_id = 'blog-media');

CREATE POLICY "Anon Delete Access"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-media');
