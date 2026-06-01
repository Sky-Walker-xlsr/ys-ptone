import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/styles/theme';
import { LanguageProvider } from '@/locales/index';

export const metadata: Metadata = {
  title: 'PTOne – PT Dashboard',
  description: 'Manage your personal training business.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: set theme + sidebar width before React hydration */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ptone_theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}try{var c=localStorage.getItem('sidebar-collapsed')==='true';document.documentElement.style.setProperty('--sidebar-width',c?'60px':'240px');}catch(e){}})();` }} />
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
