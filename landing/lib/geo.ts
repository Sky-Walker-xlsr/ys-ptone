import type { Language } from '@/locales/types';

const DACH = new Set(['DE', 'AT', 'CH', 'LI', 'LU']);  // LI = Liechtenstein, LU = Luxemburg

/**
 * Erkennt die bevorzugte Sprache anhand des Cloudflare CF-IPCountry Headers.
 * Muss in einem Server Component oder Route Handler aufgerufen werden.
 * Gibt 'de' für DACH-Länder, sonst 'en' zurück.
 */
export async function detectLanguage(headersList: Headers): Promise<Language> {
  const country = headersList.get('cf-ipcountry') ?? '';
  return DACH.has(country.toUpperCase()) ? 'de' : 'en';
}
