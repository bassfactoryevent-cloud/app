-- Permite que los posts no tengan autor temporalmente para el desarrollo del Blog UI sin Auth
ALTER TABLE posts ALTER COLUMN author_id DROP NOT NULL;
