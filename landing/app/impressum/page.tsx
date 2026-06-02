'use client';

import { LegalPage, P, Strong } from '@/components/landing/LegalPage';
import { useTranslation } from '@/locales';

const PRIVACY_URL = 'https://datenschutz.yannicksalm.ch/#ptone';
const EMAIL = 'info@yannicksalm.ch';

export default function ImpressumPage() {
  const { lang } = useTranslation();
  const de = lang === 'de';

  const sections = de ? [
    {
      id: 'betreiber',
      title: 'Betreiber & Verantwortlicher',
      content: (
        <>
          <P><Strong>PTOne</Strong> ist ein Produkt von:</P>
          <P>
            Yannick Salm<br />
            Zürich, Schweiz<br />
            E-Mail: <a href={`mailto:${EMAIL}`} style={{ color: 'var(--accent)' }}>{EMAIL}</a>
          </P>
          <P>Verantwortlich für den Inhalt dieser Website gemäss Art. 3 UWG und Art. 7 DSG ist Yannick Salm.</P>
        </>
      ),
    },
    {
      id: 'plattform',
      title: 'Beschreibung der Plattform',
      content: (
        <>
          <P>PTOne ist eine Software-as-a-Service-Plattform für Personal Trainer. Sie bietet:</P>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>Clientverwaltung und Kommunikation</li>
            <li>Trainingsplanung und Workout-Tracking</li>
            <li>Wöchentliche Journal-Einreichungen</li>
            <li>Buchhaltung, Rechnungsstellung und Swiss QR-Invoices</li>
            <li>Google Calendar-Integration</li>
            <li>Datei-Verwaltung (Drive)</li>
            <li>Exercise-Videoverwaltung</li>
          </ul>
          <P style={{ marginTop: 8 }}>Die Plattform richtet sich primär an Personal Trainer und deren Klientinnen und Klienten in der Schweiz und im deutschsprachigen Raum.</P>
        </>
      ),
    },
    {
      id: 'hosting',
      title: 'Technische Infrastruktur & Drittanbieter',
      content: (
        <>
          <P><Strong>Cloudflare Inc.</Strong> — Hosting & CDN<br />
            101 Townsend St, San Francisco, CA 94107, USA<br />
            <a href="https://www.cloudflare.com/privacypolicy/" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">cloudflare.com/privacypolicy</a>
          </P>
          <P><Strong>Supabase Inc.</Strong> — Datenbank & Authentifizierung<br />
            970 Toa Payoh North, Singapur<br />
            <a href="https://supabase.com/privacy" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">supabase.com/privacy</a>
          </P>
          <P><Strong>Google LLC</Strong> — Kalender-Integration & OAuth<br />
            1600 Amphitheatre Pkwy, Mountain View, CA, USA<br />
            <a href="https://policies.google.com/privacy" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
          </P>
          <P><Strong>Resend Inc.</Strong> — E-Mail-Versand (Rechnungen & Mahnungen)<br />
            <a href="https://resend.com/legal/privacy-policy" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">resend.com/legal/privacy-policy</a>
          </P>
          <P><Strong>Formspree Inc.</Strong> — Kontaktformular<br />
            <a href="https://formspree.io/legal/privacy-policy" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">formspree.io/legal/privacy-policy</a>
          </P>
        </>
      ),
    },
    {
      id: 'datenschutz',
      title: 'Datenschutz',
      content: (
        <>
          <P>Die Datenschutzerklärung für PTOne ist verfügbar unter:</P>
          <P><a href={PRIVACY_URL} style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">{PRIVACY_URL}</a></P>
        </>
      ),
    },
    {
      id: 'haftung',
      title: 'Haftungsausschluss',
      content: (
        <>
          <P>Die Inhalte dieser Website wurden mit grösster Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.</P>
          <P>PTOne ist ein Verwaltungswerkzeug, kein medizinischer oder gesundheitlicher Dienst. Trainingspläne, die über PTOne erstellt werden, liegen in der Verantwortung des jeweiligen Personal Trainers.</P>
          <P>Bei bekannt werden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.</P>
        </>
      ),
    },
    {
      id: 'links',
      title: 'Externe Links',
      content: (
        <P>Diese Website enthält Links zu externen Websites Dritter. Für deren Inhalte sind die jeweiligen Anbieter verantwortlich. Zum Zeitpunkt der Verlinkung wurden keine Rechtsverletzungen erkannt.</P>
      ),
    },
    {
      id: 'urheberrecht',
      title: 'Urheberrecht',
      content: (
        <>
          <P>Alle auf dieser Website veröffentlichten Inhalte (Texte, Grafiken, Code, Design) sind urheberrechtlich geschützt.</P>
          <P>Die Vervielfältigung, Bearbeitung oder Verbreitung ohne schriftliche Zustimmung von Yannick Salm ist untersagt. Downloads sind ausschliesslich für den privaten, nicht kommerziellen Gebrauch gestattet.</P>
        </>
      ),
    },
    {
      id: 'streitschlichtung',
      title: 'Streitschlichtung & Gerichtsstand',
      content: (
        <>
          <P>Für Streitigkeiten aus dem Nutzungsverhältnis gilt schweizerisches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist Zürich, Schweiz.</P>
          <P>Wir sind weder verpflichtet noch bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</P>
        </>
      ),
    },
  ] : [
    {
      id: 'operator',
      title: 'Operator & Responsible Party',
      content: (
        <>
          <P><Strong>PTOne</Strong> is a product by:</P>
          <P>
            Yannick Salm<br />
            Zürich, Switzerland<br />
            Email: <a href={`mailto:${EMAIL}`} style={{ color: 'var(--accent)' }}>{EMAIL}</a>
          </P>
          <P>Responsible for the content of this website pursuant to Art. 3 UWG and Art. 7 DSG: Yannick Salm.</P>
        </>
      ),
    },
    {
      id: 'platform',
      title: 'Platform Description',
      content: (
        <>
          <P>PTOne is a software-as-a-service platform for personal trainers. It provides:</P>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>Client management and communication</li>
            <li>Training plan creation and workout tracking</li>
            <li>Weekly client journal submissions</li>
            <li>Accounting, invoicing and Swiss QR invoices</li>
            <li>Google Calendar integration</li>
            <li>File management (Drive)</li>
            <li>Exercise video management</li>
          </ul>
          <P style={{ marginTop: 8 }}>The platform is primarily aimed at personal trainers and their clients in Switzerland and the German-speaking region.</P>
        </>
      ),
    },
    {
      id: 'hosting',
      title: 'Technical Infrastructure & Third Parties',
      content: (
        <>
          <P><Strong>Cloudflare Inc.</Strong> — Hosting & CDN<br />
            101 Townsend St, San Francisco, CA 94107, USA<br />
            <a href="https://www.cloudflare.com/privacypolicy/" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">cloudflare.com/privacypolicy</a>
          </P>
          <P><Strong>Supabase Inc.</Strong> — Database & Authentication<br />
            970 Toa Payoh North, Singapore<br />
            <a href="https://supabase.com/privacy" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">supabase.com/privacy</a>
          </P>
          <P><Strong>Google LLC</Strong> — Calendar integration & OAuth<br />
            1600 Amphitheatre Pkwy, Mountain View, CA, USA<br />
            <a href="https://policies.google.com/privacy" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
          </P>
          <P><Strong>Resend Inc.</Strong> — Email delivery (invoices & reminders)<br />
            <a href="https://resend.com/legal/privacy-policy" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">resend.com/legal/privacy-policy</a>
          </P>
          <P><Strong>Formspree Inc.</Strong> — Contact form<br />
            <a href="https://formspree.io/legal/privacy-policy" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">formspree.io/legal/privacy-policy</a>
          </P>
        </>
      ),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      content: (
        <>
          <P>The privacy policy for PTOne is available at:</P>
          <P><a href={PRIVACY_URL} style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">{PRIVACY_URL}</a></P>
        </>
      ),
    },
    {
      id: 'liability',
      title: 'Disclaimer',
      content: (
        <>
          <P>The content of this website has been compiled with great care. We cannot, however, guarantee its accuracy, completeness or currency.</P>
          <P>PTOne is a management tool, not a medical or health service. Training plans created through PTOne are the responsibility of the respective personal trainer.</P>
          <P>We will remove any infringing content promptly upon becoming aware of any rights violations.</P>
        </>
      ),
    },
    {
      id: 'links',
      title: 'External Links',
      content: (
        <P>This website contains links to external third-party websites. Their operators are responsible for their content. No rights violations were identified at the time of linking.</P>
      ),
    },
    {
      id: 'copyright',
      title: 'Copyright',
      content: (
        <>
          <P>All content published on this website (texts, graphics, code, design) is protected by copyright.</P>
          <P>Reproduction, editing or distribution without the written consent of Yannick Salm is prohibited. Downloads are permitted for private, non-commercial use only.</P>
        </>
      ),
    },
    {
      id: 'dispute',
      title: 'Dispute Resolution & Jurisdiction',
      content: (
        <>
          <P>Swiss law applies to any disputes arising from the use of this platform, excluding the UN Convention on Contracts for the International Sale of Goods. Jurisdiction is Zürich, Switzerland.</P>
          <P>We are neither required nor willing to participate in dispute resolution proceedings before a consumer arbitration board.</P>
        </>
      ),
    },
  ];

  return (
    <LegalPage
      eyebrow={de ? 'Rechtliches' : 'Legal'}
      title={de ? 'Impressum' : 'Legal Notice'}
      subtitle={de ? 'Angaben gemäss Art. 3 UWG und Art. 7 DSG (Schweiz)' : 'Information pursuant to Swiss UWG Art. 3 and DSG Art. 7'}
      lastUpdated={de ? '2. Juni 2026' : '2 June 2026'}
      sections={sections}
      lang={lang}
    />
  );
}
