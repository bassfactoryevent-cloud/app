-- Insert the events bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Everyone can view events images
CREATE POLICY "Public Access Events" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'events');

-- Policy: Anon insert events
CREATE POLICY "Anon Insert Access Events" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'events');

-- Policy: Anon update events
CREATE POLICY "Anon Update Access Events"
ON storage.objects FOR UPDATE
USING (bucket_id = 'events');

-- Policy: Anon delete events
CREATE POLICY "Anon Delete Access Events"
ON storage.objects FOR DELETE
USING (bucket_id = 'events');

----------------------------------------

-- Insert the djs bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('djs', 'djs', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Everyone can view djs images
CREATE POLICY "Public Access DJs" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'djs');

-- Policy: Anon insert djs
CREATE POLICY "Anon Insert Access DJs" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'djs');

-- Policy: Anon update djs
CREATE POLICY "Anon Update Access DJs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'djs');

-- Policy: Anon delete djs
CREATE POLICY "Anon Delete Access DJs"
ON storage.objects FOR DELETE
USING (bucket_id = 'djs');

----------------------------------------

-- Insert the merch bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('merch', 'merch', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Everyone can view merch images
CREATE POLICY "Public Access Merch" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'merch');

-- Policy: Anon insert merch
CREATE POLICY "Anon Insert Access Merch" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'merch');

-- Policy: Anon update merch
CREATE POLICY "Anon Update Access Merch"
ON storage.objects FOR UPDATE
USING (bucket_id = 'merch');

-- Policy: Anon delete merch
CREATE POLICY "Anon Delete Access Merch"
ON storage.objects FOR DELETE
USING (bucket_id = 'merch');
