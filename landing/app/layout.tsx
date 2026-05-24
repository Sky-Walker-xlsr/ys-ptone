import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { ThemeProvider }    from '@/styles/theme';
import { LanguageProvider } from '@/locales';
import { detectLanguage }   from '@/lib/geo';
import type { Language }    from '@/locales/types';

export const metadata: Metadata = {
  title:       'PTOne – Die Plattform für Personal Trainer',
  description: 'PTOne vereint Clientverwaltung, Trainingspläne, Buchhaltung und Kommunikation in einer eleganten App.',
  keywords:    ['personal trainer', 'PT software', 'Clientverwaltung', 'Trainingspläne', 'Buchhaltung PT'],
  authors:     [{ name: 'Yannick Salm' }],
  openGraph: {
    title:       'PTOne – Die Plattform für Personal Trainer',
    description: 'Professionelles PT-Management. Digital.',
    url:         'https://ptone.yannicksalm.ch',
    siteName:    'PTOne',
    locale:      'de_CH',
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'PTOne – Professionelles PT-Management',
    description: 'Alle Tools für Personal Trainer in einer App.',
  },
  robots: {
    index:  true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Geo-Detection: DACH → 'de', sonst → 'en'
  const headersList = await headers();
  const initialLang: Language = await detectLanguage(headersList);

  return (
    <html lang={initialLang} suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: Theme aus localStorage lesen bevor React hydratisiert */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var t = localStorage.getItem('ptone_theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', t);
                  var vars = {
                    dark: {
                      '--bg-page':'#07070f','--bg-surface':'#0f0f1a','--bg-card':'#13131f',
                      '--text-primary':'#eeeeff','--text-muted':'#8888aa','--accent':'#7c6aff',
                      '--border':'rgba(255,255,255,0.06)','--accent-muted':'rgba(124,106,255,0.12)',
                      '--accent-text':'#bdb0ff'
                    },
                    light: {
                      '--bg-page':'#f5f5f8','--bg-surface':'#ffffff','--bg-card':'#ffffff',
                      '--text-primary':'#0d0d1a','--text-muted':'#5a5a78','--accent':'#5b4ecc',
                      '--border':'rgba(0,0,0,0.07)','--accent-muted':'rgba(91,78,204,0.10)',
                      '--accent-text':'#5b4ecc'
                    }
                  };
                  var theme = vars[t] || vars.dark;
                  var root = document.documentElement;
                  for (var k in theme) root.style.setProperty(k, theme[k]);
                } catch(e){}
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider initialLang={initialLang}>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
