# PTOne – Logik-Referenz 2: i18n · Themes · Auth-Redirects

---

## 1. INTERNATIONALISIERUNG (i18n)

### Entscheidung: Dateibasierte Übersetzungen (pro Seite)

Kein i18n-Framework (keine externe Library wie `next-i18next` oder `react-intl`).  
**Strategie:** Jede Seite/Feature hat eine eigene `*.strings.ts` Datei mit einem simplen Key-Value-Objekt pro Sprache.

**Warum:**

- Zero dependency, zero overhead
- Tree-shakeable (nur was gebraucht wird landet im Bundle)
- Einfach erweiterbar (neue Sprache = neues Key in der Datei)
- Vollständige TypeScript-Typsicherheit ohne Generator

---

### Dateistruktur

```
/pt/src/
└── locales/
    ├── index.ts             ← useTranslation Hook + LanguageContext
    ├── types.ts             ← Shared Types (Language, Strings)
    ├── dashboard.strings.ts
    ├── clients.strings.ts
    ├── journal.strings.ts
    ├── accounting.strings.ts
    ├── calendar.strings.ts
    ├── settings.strings.ts
    └── ...

/client/src/
└── locales/
    ├── index.ts
    ├── types.ts
    ├── dashboard.strings.ts
    ├── journal.strings.ts
    ├── workout.strings.ts
    └── ...

/landing/src/
└── locales/
    ├── index.ts
    ├── types.ts
    ├── home.strings.ts
    ├── pt-profile.strings.ts
    └── ...
```

---

### types.ts (geteilt, in jeder App gleich)

```typescript
export type Language = 'de' | 'en';

export type Strings<T extends Record<string, string>> = {
  [K in Language]: T;
};
```

---

### Beispiel: dashboard.strings.ts (PT App)

```typescript
import type { Strings } from './types';

const keys = {
  greeting:           '',
  clients:            '',
  activeClients:      '',
  upcomingAppointments: '',
  openInvoices:       '',
  thisMonth:          '',
  totalRevenue:       '',
} as const;

type DashboardStrings = typeof keys;

export const dashboard: Strings<DashboardStrings> = {
  de: {
    greeting:              'Guten Morgen',
    clients:               'Kunden',
    activeClients:         'Aktive Kunden',
    upcomingAppointments:  'Kommende Termine',
    openInvoices:          'Offene Rechnungen',
    thisMonth:             'Diesen Monat',
    totalRevenue:          'Gesamtumsatz',
  },
  en: {
    greeting:              'Good morning',
    clients:               'Clients',
    activeClients:         'Active clients',
    upcomingAppointments:  'Upcoming appointments',
    openInvoices:          'Open invoices',
    thisMonth:             'This month',
    totalRevenue:          'Total revenue',
  },
};
```

---

### index.ts – Context + Hook

```typescript
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { Language } from './types';

const STORAGE_KEY = 'ptone_language';

type LanguageContextType = {
  lang:      Language;
  setLang:   (l: Language) => void;
  t:         <T extends Record<string, string>>(strings: Record<Language, T>) => T;
};

const LanguageContext = createContext<LanguageContextType>({
  lang:    'de',
  setLang: () => {},
  t:       (s) => s.de,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('de');

  useEffect(() => {
    // 1. Priorität: User-Einstellung aus DB (profiles.coach_lang / client_settings.language)
    // 2. Priorität: localStorage
    // 3. Fallback: 'de'
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored === 'en' || stored === 'de') setLangState(stored);
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    // Auch in DB schreiben (fire & forget)
    // supabase.from('pt_settings' | 'client_settings').update({ language: l })
  };

  const t = <T extends Record<string, string>>(
    strings: Record<Language, T>
  ): T => strings[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);
```

---

### Verwendung in einer Komponente

```typescript
import { useTranslation } from '@/locales';
import { dashboard } from '@/locales/dashboard.strings';

export function DashboardHeader() {
  const { t, lang, setLang } = useTranslation();
  const s = t(dashboard);

  return (
    <div>
      <h1>{s.greeting}, Yannick</h1>
      <button onClick={() => setLang(lang === 'de' ? 'en' : 'de')}>
        {lang === 'de' ? 'EN' : 'DE'}
      </button>
    </div>
  );
}
```

---

### Sprache-Persistenz

| Priorität       | Quelle        | Tabelle                                           |
|-----------------|---------------|---------------------------------------------------|
| 1 (höchste)     | Supabase DB   | `pt_settings.language` / `client_settings.language` |
| 2               | localStorage  | `ptone_language`                                  |
| 3 (Fallback)    | Hardcoded     | `'de'`                                            |

Beim Login: DB-Wert laden → localStorage überschreiben.  
Beim Ändern: sofort localStorage + async DB-Update.

---

### Sprachumschalter – Position

- **PT App:** Header rechts oben (Icon + `DE | EN`)
- **Client App:** Header rechts oben
- **Landing Page:** Navbar rechts, persistent via localStorage (kein Login nötig)
- **Einstellungen:** Dropdown in User-Settings (PT + Client)

---

## 2. COLOR THEMES

### Konzept

Drei Ebenen:

1. **dark / light** → immer verfügbar, umschaltbar
2. **Zusatz-Themes** → Infrastruktur bereit, aber noch keine weiteren Themes definiert
3. **Gespeichert** in `profiles.color_scheme` (String) + `profiles.color_theme` ('dark' | 'light')

---

### Theme-System Architektur

```
/src/
└── styles/
    ├── themes/
    │   ├── index.ts         ← Theme Registry
    │   ├── dark.ts          ← Dark Theme Tokens
    │   ├── light.ts         ← Light Theme Tokens
    │   └── types.ts         ← ThemeToken Type
    ├── globals.css          ← CSS Custom Properties
    └── theme.tsx            ← ThemeProvider + useTheme Hook
```

---

### types.ts – Theme-Token Struktur

```typescript
export type ThemeId = 'dark' | 'light';
// Später erweiterbar: | 'obsidian' | 'forest' | 'ocean' | ...

export type ThemeTokens = {
  id:          ThemeId;
  label:       string;
  isDark:      boolean;
  colors: {
    // Hintergründe
    bgPrimary:    string;
    bgSecondary:  string;
    bgTertiary:   string;
    bgSidebar:    string;
    bgCard:       string;
    // Text
    textPrimary:  string;
    textMuted:    string;
    textSubtle:   string;
    // Brand
    accent:       string;
    accentMuted:  string;
    // Semantic
    success:      string;
    warning:      string;
    danger:       string;
    info:         string;
    // Border
    border:       string;
    borderStrong: string;
  };
};
```

---

### dark.ts

```typescript
import type { ThemeTokens } from './types';

export const darkTheme: ThemeTokens = {
  id:     'dark',
  label:  'Dark',
  isDark: true,
  colors: {
    bgPrimary:    '#0f0f10',
    bgSecondary:  '#1a1a1c',
    bgTertiary:   '#242427',
    bgSidebar:    '#141416',
    bgCard:       '#1e1e21',
    textPrimary:  '#f0f0f1',
    textMuted:    '#a0a0a8',
    textSubtle:   '#606068',
    accent:       '#7c6aff',
    accentMuted:  '#3d3580',
    success:      '#3ecf8e',
    warning:      '#f5a623',
    danger:       '#f04444',
    info:         '#4b9eff',
    border:       'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.16)',
  },
};
```

---

### light.ts

```typescript
import type { ThemeTokens } from './types';

export const lightTheme: ThemeTokens = {
  id:     'light',
  label:  'Light',
  isDark: false,
  colors: {
    bgPrimary:    '#ffffff',
    bgSecondary:  '#f5f5f7',
    bgTertiary:   '#ebebed',
    bgSidebar:    '#f9f9fa',
    bgCard:       '#ffffff',
    textPrimary:  '#0f0f10',
    textMuted:    '#6b6b72',
    textSubtle:   '#a8a8b0',
    accent:       '#5b4ecc',
    accentMuted:  '#ece9ff',
    success:      '#1a8a5a',
    warning:      '#c47d0a',
    danger:       '#cc2222',
    info:         '#1a6fd4',
    border:       'rgba(0,0,0,0.08)',
    borderStrong: 'rgba(0,0,0,0.16)',
  },
};
```

---

### index.ts – Theme Registry

```typescript
import { darkTheme }  from './dark';
import { lightTheme } from './light';
import type { ThemeTokens, ThemeId } from './types';

// Hier später weitere Themes eintragen:
// import { obsidianTheme } from './obsidian';
// import { forestTheme }   from './forest';

export const themes: Record<ThemeId, ThemeTokens> = {
  dark:  darkTheme,
  light: lightTheme,
  // obsidian: obsidianTheme,
  // forest:   forestTheme,
};

export const defaultTheme: ThemeId = 'dark';

export function getTheme(id: ThemeId | string): ThemeTokens {
  return themes[id as ThemeId] ?? themes[defaultTheme];
}

export * from './types';
```

---

### theme.tsx – ThemeProvider + CSS-Variables-Injection

```typescript
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getTheme, defaultTheme } from '@/styles/themes';
import type { ThemeId, ThemeTokens } from '@/styles/themes';

const STORAGE_KEY = 'ptone_theme';

type ThemeContextType = {
  theme:     ThemeTokens;
  themeId:   ThemeId;
  setTheme:  (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme:    getTheme(defaultTheme),
  themeId:  defaultTheme,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(defaultTheme);

  useEffect(() => {
    // 1. DB-Wert (wird nach Login geladen)
    // 2. localStorage
    // 3. Fallback: 'dark'
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (stored && getTheme(stored).id === stored) {
      setThemeIdState(stored);
    }
  }, []);

  // CSS Custom Properties auf :root setzen
  useEffect(() => {
    const t = getTheme(themeId);
    const root = document.documentElement;
    root.setAttribute('data-theme', themeId);
    root.style.setProperty('--bg-primary',    t.colors.bgPrimary);
    root.style.setProperty('--bg-secondary',  t.colors.bgSecondary);
    root.style.setProperty('--bg-tertiary',   t.colors.bgTertiary);
    root.style.setProperty('--bg-sidebar',    t.colors.bgSidebar);
    root.style.setProperty('--bg-card',       t.colors.bgCard);
    root.style.setProperty('--text-primary',  t.colors.textPrimary);
    root.style.setProperty('--text-muted',    t.colors.textMuted);
    root.style.setProperty('--text-subtle',   t.colors.textSubtle);
    root.style.setProperty('--accent',        t.colors.accent);
    root.style.setProperty('--accent-muted',  t.colors.accentMuted);
    root.style.setProperty('--success',       t.colors.success);
    root.style.setProperty('--warning',       t.colors.warning);
    root.style.setProperty('--danger',        t.colors.danger);
    root.style.setProperty('--info',          t.colors.info);
    root.style.setProperty('--border',        t.colors.border);
    root.style.setProperty('--border-strong', t.colors.borderStrong);
  }, [themeId]);

  const setTheme = (id: ThemeId) => {
    setThemeIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
    // DB sync (fire & forget)
    // supabase.from('profiles').update({ color_theme: id, color_scheme: id })
  };

  return (
    <ThemeContext.Provider value={{ theme: getTheme(themeId), themeId, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

---

### globals.css – Fallback-Defaults (Dark als Standard)

```css
:root {
  /* Dark als Standard – wird via JS überschrieben */
  --bg-primary:    #0f0f10;
  --bg-secondary:  #1a1a1c;
  --bg-tertiary:   #242427;
  --bg-sidebar:    #141416;
  --bg-card:       #1e1e21;
  --text-primary:  #f0f0f1;
  --text-muted:    #a0a0a8;
  --text-subtle:   #606068;
  --accent:        #7c6aff;
  --accent-muted:  #3d3580;
  --success:       #3ecf8e;
  --warning:       #f5a623;
  --danger:        #f04444;
  --info:          #4b9eff;
  --border:        rgba(255,255,255,0.08);
  --border-strong: rgba(255,255,255,0.16);
}

/* Verhindert Flash beim ersten Laden */
html[data-theme="dark"]  { color-scheme: dark; }
html[data-theme="light"] { color-scheme: light; }
```

---

### Anti-Flash Script (in layout.tsx, vor allem anderen)

```typescript
// layout.tsx – in <head> als inline script, damit kein FOUC entsteht
export default function RootLayout({ children }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('ptone_theme') || 'dark';
              document.documentElement.setAttribute('data-theme', t);
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

### Theme-Umschalter UI (Einstellungen)

```typescript
// components/ThemeSelector.tsx
import { useTheme } from '@/styles/theme';
import { themes } from '@/styles/themes';

export function ThemeSelector() {
  const { themeId, setTheme } = useTheme();

  return (
    <div>
      {Object.values(themes).map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          aria-pressed={themeId === t.id}
        >
          {t.label}
        </button>
      ))}
      {/* Platzhalter für künftige Themes – noch deaktiviert */}
      {/* <button disabled>Obsidian (bald)</button> */}
    </div>
  );
}
```

---

### Speicherung in DB

| Feld           | Tabelle    | Typ    | Beschreibung                           |
|----------------|------------|--------|----------------------------------------|
| `color_theme`  | `profiles` | `text` | `'dark'` \| `'light'`                 |
| `color_scheme` | `profiles` | `text` | Theme-ID (für zukünftige Themes)       |

Beim Login: beide Felder laden → `setTheme()` aufrufen → localStorage überschreiben.

---

## 3. AUTH-REDIRECTS & PWA-LOGIK

### Grundregel

```
Nicht eingeloggt + Besuch von pt.* oder ptclient.*
  → KEIN Redirect zu ptone.*
  → Redirect zu /login auf derselben Domain

Cached Session vorhanden
  → Auto-Login, direkt zur App
```

Jede App ist vollständig autonom. Es gibt keinen Cross-Domain-Redirect für Auth.  
`ptone.yannicksalm.ch` bleibt die Landing Page mit eigenem Login — aber `pt.` und `ptclient.` leiten nie dorthin weiter.

---

### middleware.ts (pt. + ptclient.)

Kein Cross-Domain-Redirect mehr. Nicht authentifizierte Requests landen auf `/login` der jeweiligen App.

```typescript
// middleware.ts – gilt für pt.yannicksalm.ch & ptclient.yannicksalm.ch
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Öffentliche Pfade: immer erlaubt (inkl. /login selbst)
  const publicPaths = ['/login', '/manifest.json', '/icons/', '/offline', '/_next', '/favicon'];
  if (publicPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { ... } }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // Eingeloggt: has_coach Check (nur für ptclient.)
    if (request.nextUrl.hostname.startsWith('ptclient')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_coach')
        .eq('id', session.user.id)
        .single();

      if (!profile?.has_coach) {
        return NextResponse.redirect(new URL('/waiting', request.url));
      }
    }
    return response;
  }

  // Nicht eingeloggt → /login auf derselben Domain
  // /login prüft client-side den lokalen Cache und loggt ggf. auto ein
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
};
```

---

### /login Seite (pt. und ptclient. — je eigene Seite)

Beim Laden wird zuerst der lokale Supabase-Cache geprüft. Falls eine gültige Session vorhanden ist, wird der User direkt eingeloggt ohne das Formular zu sehen.

```typescript
// app/login/page.tsx  (in pt. und ptclient. identisch aufgebaut)
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const REGISTER_URL = 'https://ptone.yannicksalm.ch/register';

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true); // Zeigt Ladescreen während Cache-Check

  useEffect(() => {
    async function checkCachedSession() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Cached Session gefunden → direkt zur App
        router.replace('/');
      } else {
        // Kein Cache → Login-Formular anzeigen
        setChecking(false);
      }
    }
    checkCachedSession();
  }, [router]);

  async function onLogin(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      // Fehler anzeigen
      return;
    }

    router.replace('/');
  }

  // Ladescreen während Cache-Check (verhindert kurzes Aufblitzen des Formulars)
  if (checking) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <span>Wird geladen…</span>
      </div>
    );
  }

  return (
    <div>
      {/* Login-Formular */}
      {/* ... Email + Passwort Felder, Submit Button */}

      {/* Registrierungs-Link → ptone Landing */}
      <p>
        Noch kein Account?{' '}
        <a href={REGISTER_URL}>Registrieren</a>
      </p>
    </div>
  );
}
```

---

### Login-Seite: ptone.yannicksalm.ch/login

Bleibt bestehen — für User die direkt über die Landing Page einsteigen. Nach Login: Rolle prüfen → Redirect zur jeweiligen App.

```typescript
// landing/app/login/page.tsx
'use client';

import { createClient } from '@/lib/supabase/client';

export default function LandingLoginPage() {
  async function onLogin(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.session.user.id)
      .single();

    if (profile?.role === 'pt') {
      window.location.href = 'https://pt.yannicksalm.ch';
    } else {
      window.location.href = 'https://ptclient.yannicksalm.ch';
    }
  }

  // ... Formular + Link zu /register
}
```

---

### Logout (überall gleich)

Nach Logout bleibt der User auf der jeweiligen App-Domain und landet auf deren `/login`.

```typescript
// lib/logout.ts
import { createClient } from '@/lib/supabase/client';

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = '/login'; // Bleibt auf derselben Domain
}
```

---

### PWA-Verhalten

Da `/login` jetzt auf jeder App nativ existiert, ist kein spezieller PWA-Sonderfall mehr nötig. Der Cache-Check in `/login` deckt den Offline-/abgelaufenen-Token-Fall automatisch ab.

```
PWA startet (pt. oder ptclient.)
  ↓
middleware: kein Session-Cookie → /login
  ↓
/login: useEffect prüft lokalen Supabase-Cache
  ↓ Cache gültig  → router.replace('/') ✓
  ↓ Cache leer    → Login-Formular anzeigen
```

---

### Manifests (PWA)

```json
// pt/public/manifest.json
{
  "name": "PTOne – Personal Trainer",
  "short_name": "PTOne PT",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f0f10",
  "theme_color": "#7c6aff",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

```json
// client/public/manifest.json
{
  "name": "PTOne – Client",
  "short_name": "PTOne",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f0f10",
  "theme_color": "#7c6aff",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

### Gesamtfluss: Auth-Redirect

```
User öffnet pt.yannicksalm.ch (oder ptclient.)
         │
         ▼
middleware.ts prüft Session-Cookie
         │
    ┌────┴────┐
    │ Session  │ JA → App laden ✓
    └────┬────┘
         │ NEIN
         ▼
  /login (gleiche Domain)
         │
         ▼
  useEffect: Supabase lokalen Cache prüfen
         │
    ┌────┴──────────┐
    │ Cache gültig   │ JA → router.replace('/') ✓
    └────┬──────────┘
         │ NEIN
         ▼
  Login-Formular anzeigen
  + "Noch kein Account? Registrieren"
    → ptone.yannicksalm.ch/register
```

---

## ZUSAMMENFASSUNG

| Thema                  | Entscheidung                                                            |
|------------------------|-------------------------------------------------------------------------|
| i18n Library           | Keine – eigene Strings-Dateien pro Seite                                |
| Sprachen               | Deutsch (`de`) + Englisch (`en`)                                        |
| Strings-Datei          | `[feature].strings.ts` pro Seite/Feature, pro App                      |
| Sprachspeicherung      | DB (profiles/settings) → localStorage → `'de'`                         |
| Theme Standard         | `dark`                                                                  |
| Themes verfügbar       | `dark`, `light` (Infrastruktur für weitere ist bereit)                  |
| Theme-Tokens           | TypeScript-Objekte → CSS Custom Properties via JS                       |
| Anti-FOUC              | Inline-Script in layout.tsx liest localStorage vor React-Hydration      |
| Themspeicherung        | DB (`profiles.color_theme`, `profiles.color_scheme`) + localStorage     |
| Auth-Redirect          | Middleware → `/login` (gleiche Domain), kein Cross-Domain-Redirect      |
| Cache-Check            | `/login` prüft Supabase-Cache client-side → Auto-Login wenn gültig      |
| PWA-Erkennung          | Kein Sonderfall nötig – `/login` mit Cache-Check deckt alles ab         |
| Login-Seite pt/client  | `pt.yannicksalm.ch/login` / `ptclient.yannicksalm.ch/login`            |
| Registrierung          | Button auf `/login` → `ptone.yannicksalm.ch/register`                  |
| Logout                 | `signOut()` + `window.location.href = '/login'` (gleiche Domain)        |