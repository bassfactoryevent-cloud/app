-- Create Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Genres table
CREATE TABLE genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Expand posts table
ALTER TABLE posts ADD COLUMN excerpt TEXT;
ALTER TABLE posts ADD COLUMN meta_title TEXT;
ALTER TABLE posts ADD COLUMN meta_description TEXT;

-- Create Post-Tags junction table
CREATE TABLE post_tags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (post_id, tag_id)
);

-- Create Post-Genres junction table
CREATE TABLE post_genres (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    genre_id UUID REFERENCES genres(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (post_id, genre_id)
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_genres ENABLE ROW LEVEL SECURITY;

-- Policies for tags and genres (viewable by everyone, managed by admins)
CREATE POLICY "Tags are viewable by everyone." ON tags FOR SELECT USING (true);
CREATE POLICY "Genres are viewable by everyone." ON genres FOR SELECT USING (true);
CREATE POLICY "Post tags are viewable by everyone." ON post_tags FOR SELECT USING (true);
CREATE POLICY "Post genres are viewable by everyone." ON post_genres FOR SELECT USING (true);

-- Allow admins to manage taxonomies and relations
CREATE POLICY "Admins can manage tags" ON tags FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage genres" ON genres FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage post_tags" ON post_tags FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage post_genres" ON post_genres FOR ALL USING (public.is_admin());
