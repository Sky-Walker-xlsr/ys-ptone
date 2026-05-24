-- 013_pt_profile_extras.sql
-- Adds display columns to pt_profiles (already in schema.sql for fresh installs)
-- and seeds Yannick Salm's placeholder data.

-- ── Columns (safe to run on existing DB) ─────────────────────────────────────

ALTER TABLE public.pt_profiles
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS price_from   text,
  ADD COLUMN IF NOT EXISTS focus_areas  jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS color        text  NOT NULL DEFAULT '#7c6aff';

-- ── Seed: Yannick Salm ────────────────────────────────────────────────────────

UPDATE public.profiles
SET display_name = 'Yannick Salm', first_name = 'Yannick', last_name = 'Salm', role = 'pt'
WHERE id = '4dc84afd-5775-43c3-a796-c180fa07dd40';

INSERT INTO public.pt_profiles (
  id, slug, short_bio, long_bio, location, languages, years_experience,
  certifications, specializations, is_public, availability, price_from, focus_areas, color
) VALUES (
  '4dc84afd-5775-43c3-a796-c180fa07dd40',
  'yannick-salm',
  'Zertifizierter Personal Trainer mit Fokus auf nachhaltige Körpertransformation und individuelle Betreuung.',
  'Als zertifizierter Personal Trainer mit 6 Jahren Erfahrung habe ich über 150 Klienten auf ihrem Weg zu nachhaltiger Körpertransformation begleitet. Mein Ansatz verbindet evidenzbasiertes Training mit praxisnaher Ernährungsberatung – individuell auf dich abgestimmt, ohne unrealistische Versprechen. Ich glaube daran, dass der grösste Fortschritt entsteht, wenn Training zum festen Bestandteil deines Alltags wird.',
  'Zürich, CH',
  ARRAY['DE', 'EN'],
  6,
  ARRAY['Swiss PT Zertifizierung', 'Ernährungsberatung IHK', 'Kettlebell Coach SFG'],
  ARRAY['Muskelaufbau', 'Gewichtsabnahme', 'Ernährungsberatung'],
  true,
  'Mo–Fr, 6:00–20:00',
  'ab CHF 85/h',
  '[
    {"title":"Muskelaufbau",       "desc":"Strukturiertes Hypertrophie-Training mit progressiver Überlastung und optimierter Nährstoffversorgung."},
    {"title":"Gewichtsabnahme",    "desc":"Nachhaltiges Kaloriendefizit kombiniert mit Krafttraining zum Erhalt der Muskelmasse."},
    {"title":"Ernährungsberatung", "desc":"Individuelle Makro-Planung, Meal-Prep-Strategien und alltagstaugliche Essensroutinen."}
  ]'::jsonb,
  '#7c6aff'
)
ON CONFLICT (id) DO UPDATE SET
  slug             = EXCLUDED.slug,
  short_bio        = EXCLUDED.short_bio,
  long_bio         = EXCLUDED.long_bio,
  location         = EXCLUDED.location,
  languages        = EXCLUDED.languages,
  years_experience = EXCLUDED.years_experience,
  certifications   = EXCLUDED.certifications,
  specializations  = EXCLUDED.specializations,
  is_public        = EXCLUDED.is_public,
  availability     = EXCLUDED.availability,
  price_from       = EXCLUDED.price_from,
  focus_areas      = EXCLUDED.focus_areas,
  color            = EXCLUDED.color,
  updated_at       = now();
