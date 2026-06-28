-- Add humanities domain and update domain descriptions
-- Run this in Supabase SQL Editor

-- Insert humanities domain if it doesn't exist
INSERT INTO public.domains (name, description, icon)
VALUES (
  'Humanities',
  'Literature, history, and arts',
  'BookOpen'
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- Update existing domains with icon names (for UI consistency)
UPDATE public.domains SET icon = 'Briefcase' WHERE name = 'Business';
UPDATE public.domains SET icon = 'Wrench' WHERE name = 'Engineering';
UPDATE public.domains SET icon = 'Scale' WHERE name = 'Law';
UPDATE public.domains SET icon = 'Stethoscope' WHERE name = 'Medical';
UPDATE public.domains SET icon = 'Flask' WHERE name = 'Science';
UPDATE public.domains SET icon = 'Laptop' WHERE name = 'Technology' OR name = 'Computer Science';

-- Update domain descriptions to match
UPDATE public.domains SET description = 'Business strategy and management' WHERE name = 'Business';
UPDATE public.domains SET description = 'Engineering principles and problem-solving' WHERE name = 'Engineering';
UPDATE public.domains SET description = 'Legal studies and case law' WHERE name = 'Law';
UPDATE public.domains SET description = 'Medical education and clinical studies' WHERE name = 'Medical';
UPDATE public.domains SET description = 'Natural sciences and research' WHERE name = 'Science';
UPDATE public.domains SET description = 'Computer science and technology' WHERE name IN ('Technology', 'Computer Science');

-- Verify all domains
SELECT name, description, icon FROM public.domains ORDER BY name;
