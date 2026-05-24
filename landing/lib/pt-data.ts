import { createClient } from '@/lib/supabase/client';

export type PT = {
  id:              string;
  name:            string;
  slug:            string;
  location:        string | null;
  specializations: string[];
  languages:       string[];
  yearsExp:        number | null;
  shortBio:        string | null;
  longBio:         string | null;
  initials:        string;
  color:           string;
  certifications:  string[];
  availability:    string | null;
  priceFrom:       string | null;
  focusAreas:      { title: string; desc: string }[];
};

function toInitials(name: string): string {
  return name.split(' ').map(p => p[0] ?? '').join('').toUpperCase().slice(0, 2);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPT(row: any): PT {
  const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const name =
    prof?.display_name ||
    `${prof?.first_name ?? ''} ${prof?.last_name ?? ''}`.trim() ||
    'Unknown';
  return {
    id:              row.id,
    name,
    slug:            row.slug ?? row.id,
    location:        row.location ?? null,
    specializations: row.specializations ?? [],
    languages:       row.languages ?? [],
    yearsExp:        row.years_experience ?? null,
    shortBio:        row.short_bio ?? null,
    longBio:         row.long_bio ?? null,
    initials:        toInitials(name),
    color:           row.color ?? '#7c6aff',
    certifications:  row.certifications ?? [],
    availability:    row.availability ?? null,
    priceFrom:       row.price_from ?? null,
    focusAreas:      row.focus_areas ?? [],
  };
}

const PT_SELECT = `
  id, slug, short_bio, long_bio, location, languages, years_experience,
  certifications, specializations, availability, price_from, focus_areas, color,
  profiles(display_name, first_name, last_name)
`;

export async function fetchPublicPTs(): Promise<PT[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('pt_profiles')
    .select(PT_SELECT)
    .eq('is_public', true)
    .order('created_at');
  return (data ?? []).map(rowToPT);
}

export async function fetchPTBySlug(slug: string): Promise<PT | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('pt_profiles')
    .select(PT_SELECT)
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();
  return data ? rowToPT(data) : null;
}
