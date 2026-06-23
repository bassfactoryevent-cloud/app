-- Agregar campos de slug e imagen a la tabla DJs
ALTER TABLE public.djs ADD COLUMN slug TEXT UNIQUE;
ALTER TABLE public.djs ADD COLUMN image_url TEXT;

-- Script para migrar slugs para los djs que ya existen en caso de haber
UPDATE public.djs 
SET slug = LOWER(REGEXP_REPLACE(stage_name, '[^a-zA-Z0-9]+', '-', 'g'));

-- Ahora sí forzamos NOT NULL
ALTER TABLE public.djs ALTER COLUMN slug SET NOT NULL;
