import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/styles/theme';
import { LanguageProvider } from '@/locales/index';

export const metadata: Metadata = {
  title: 'PTOne – Client',
  description: 'Your personal training companion.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ptone_theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();` }} />
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
