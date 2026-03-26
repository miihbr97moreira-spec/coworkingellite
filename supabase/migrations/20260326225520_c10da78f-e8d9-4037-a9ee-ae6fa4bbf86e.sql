ALTER TABLE public.generated_pages 
ADD COLUMN IF NOT EXISTS meta_pixel_id text DEFAULT '',
ADD COLUMN IF NOT EXISTS ga_id text DEFAULT '';