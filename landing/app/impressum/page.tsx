'use client';

import { LegalPage, P, Strong } from '@/components/landing/LegalPage';
import { useTranslation } from '@/locales';

export default function ImpressumPage() {
  const { lang } = useTranslation();

  const sections = [
    {
      id: 'betreiber',
      title: 'Betreiber & Verantwortlicher',
      content: (
        <>
          <P><Strong>PTOne</Strong> ist ein Produkt von:</P>
          <P>
            Yannick Salm<br />
            Zürich, Schweiz<br />
            E-Mail: <a href="mailto:info@yannicksalm.ch" style={{ color: 'var(--accent)' }}>info@yannicksalm.ch</a>
          </P>
          <P>Verantwortlich für den Inhalt dieser Website gemäss Art. 3 UWG ist Yannick Salm.</P>
        </>
      ),
    },
    {
      id: 'plattform',
      title: 'Beschreibung der Plattform',
      content: (
        <>
          <P>PTOne ist eine Software-as-a-Service-Plattform, die Personal Trainern Werkzeuge zur Clientverwaltung, Trainingsplanung, Kommunikation und Buchhaltung bereitstellt.</P>
          <P>Die Plattform richtet sich primär an Personal Trainer sowie deren Klientinnen und Klienten im DACH-Raum (Deutschland, Österreich, Schweiz).</P>
        </>
      ),
    },
    {
      id: 'hosting',
      title: 'Hosting & technische Infrastruktur',
      content: (
        <>
          <P>Diese Website wird gehostet über:</P>
          <P>
            <Strong>Cloudflare Inc.</Strong><br />
            101 Townsend St, San Francisco, CA 94107, USA<br />
            Datenschutzerklärung: <a href="https://www.cloudflare.com/privacypolicy/" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">cloudflare.com/privacypolicy</a>
          </P>
          <P>Die Authentifizierung und Datenspeicherung erfolgt über:</P>
          <P>
            <Strong>Supabase Inc.</Strong><br />
            970 Toa Payoh North, Singapur<br />
            Datenschutzerklärung: <a href="https://supabase.com/privacy" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">supabase.com/privacy</a>
          </P>
        </>
      ),
    },
    {
      id: 'haftung',
      title: 'Haftungsausschluss',
      content: (
        <>
          <P>Die Inhalte dieser Website wurden mit grösster Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernehmen wir jedoch keine Gewähr.</P>
          <P>Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach schweizerischem Recht verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.</P>
          <P>Bei bekannt werden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen. Eine diesbezügliche Haftung übernehmen wir erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung.</P>
        </>
      ),
    },
    {
      id: 'links',
      title: 'Externe Links',
      content: (
        <>
          <P>Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.</P>
          <P>Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.</P>
        </>
      ),
    },
    {
      id: 'urheberrecht',
      title: 'Urheberrecht',
      content: (
        <>
          <P>Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem schweizerischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung ausserhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.</P>
          <P>Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet.</P>
        </>
      ),
    },
    {
      id: 'streitschlichtung',
      title: 'Streitschlichtung',
      content: (
        <>
          <P>Für Streitigkeiten aus dem Nutzungsverhältnis gilt schweizerisches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist Zürich, Schweiz, soweit gesetzlich zulässig.</P>
          <P>Wir sind weder verpflichtet noch bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</P>
        </>
      ),
    },
  ];

  return (
    <LegalPage
      eyebrow="Rechtliches"
      title="Impressum"
      subtitle="Angaben gemäss Art. 3 UWG (Schweiz)"
      lastUpdated="19. Mai 2026"
      sections={sections}
    />
  );
}
