-- Enable storage policies for ads and sponsors buckets
-- Created to allow public viewing and client access while server upload is active

-- Policies for ads bucket
CREATE POLICY "Public Access Ads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'ads');

CREATE POLICY "Anon Insert Access Ads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'ads');

CREATE POLICY "Anon Update Access Ads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ads');

CREATE POLICY "Anon Delete Access Ads"
ON storage.objects FOR DELETE
USING (bucket_id = 'ads');

----------------------------------------

-- Policies for sponsors bucket
CREATE POLICY "Public Access Sponsors" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'sponsors');

CREATE POLICY "Anon Insert Access Sponsors" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'sponsors');

CREATE POLICY "Anon Update Access Sponsors"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sponsors');

CREATE POLICY "Anon Delete Access Sponsors"
ON storage.objects FOR DELETE
USING (bucket_id = 'sponsors');
