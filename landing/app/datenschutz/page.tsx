'use client';

import { LegalPage, P, UL, Strong } from '@/components/landing/LegalPage';

export default function DatenschutzPage() {
  const sections = [
    {
      id: 'verantwortlicher',
      title: 'Verantwortlicher',
      content: (
        <>
          <P>Verantwortlicher im Sinne der DSGVO und des schweizerischen Datenschutzgesetzes (nDSG):</P>
          <P>
            <Strong>Yannick Salm</Strong><br />
            Zürich, Schweiz<br />
            E-Mail: <a href="mailto:info@yannicksalm.ch" style={{ color: 'var(--accent)' }}>info@yannicksalm.ch</a>
          </P>
        </>
      ),
    },
    {
      id: 'erhobene-daten',
      title: 'Welche Daten wir erheben',
      content: (
        <>
          <P><Strong>Bei der Registrierung:</Strong></P>
          <UL items={[
            'Vorname und Nachname',
            'E-Mail-Adresse',
            'Passwort (verschlüsselt gespeichert, niemals im Klartext)',
            'Rolle (Personal Trainer oder Client)',
          ]} />
          <P><Strong>Bei der Nutzung der Plattform:</Strong></P>
          <UL items={[
            'Trainingspläne und Workout-Logs',
            'Körpermessdaten (Gewicht, Masse) – nur wenn vom Nutzer eingegeben',
            'Wochenjournaleinträge (Bewertungen, Fotos) – nur wenn vom Nutzer erstellt',
            'Rechnungs- und Zahlungsinformationen',
            'Kommunikation innerhalb der Plattform',
            'Dateien und Dokumente die hochgeladen werden',
          ]} />
          <P><Strong>Automatisch erhobene Daten:</Strong></P>
          <UL items={[
            'IP-Adresse (anonymisiert durch Cloudflare)',
            'Browser-Typ und Betriebssystem',
            'Zugriffszeitpunkt und aufgerufene Seiten',
            'Verweisende URL',
          ]} />
        </>
      ),
    },
    {
      id: 'zweck',
      title: 'Zweck der Datenverarbeitung',
      content: (
        <>
          <P>Wir verarbeiten Ihre Daten ausschliesslich für folgende Zwecke:</P>
          <UL items={[
            'Bereitstellung und Betrieb der PTOne-Plattform',
            'Authentifizierung und Kontosicherheit',
            'Kommunikation zwischen Personal Trainer und Clients',
            'Erstellung und Verwaltung von Trainingsplänen und Journalen',
            'Rechnungsstellung und Buchhaltungsfunktionen',
            'Verbesserung und Weiterentwicklung des Dienstes',
            'Einhaltung gesetzlicher Pflichten',
          ]} />
        </>
      ),
    },
    {
      id: 'rechtsgrundlage',
      title: 'Rechtsgrundlage',
      content: (
        <>
          <P>Die Verarbeitung Ihrer Daten erfolgt auf folgenden Rechtsgrundlagen:</P>
          <UL items={[
            'Art. 6 Abs. 1 lit. b DSGVO – Vertragserfüllung: zur Bereitstellung der Plattformfunktionen',
            'Art. 6 Abs. 1 lit. a DSGVO – Einwilligung: für optionale Funktionen (z.B. Fortschrittsfotos)',
            'Art. 6 Abs. 1 lit. c DSGVO – Rechtliche Verpflichtung: für Buchführungspflichten',
            'Art. 6 Abs. 1 lit. f DSGVO – Berechtigte Interessen: für Sicherheit und Missbrauchsprävention',
            'Schweiz: Art. 6 nDSG (Bearbeitung nach Treu und Glauben, verhältnismässig)',
          ]} />
        </>
      ),
    },
    {
      id: 'drittanbieter',
      title: 'Drittanbieter & Auftragsverarbeiter',
      content: (
        <>
          <P><Strong>Supabase Inc.</Strong> (Authentifizierung & Datenbank)</P>
          <P>970 Toa Payoh North, Singapur · <a href="https://supabase.com/privacy" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">supabase.com/privacy</a></P>
          <P>Supabase speichert Accountdaten und Plattformdaten in verschlüsselter Form. Der Datentransfer in Drittländer erfolgt auf Basis der EU-Standardvertragsklauseln.</P>

          <P style={{ marginTop: 16 }}><Strong>Cloudflare Inc.</Strong> (Hosting & CDN)</P>
          <P>101 Townsend St, San Francisco, CA 94107, USA · <a href="https://www.cloudflare.com/privacypolicy/" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">cloudflare.com/privacypolicy</a></P>
          <P>Cloudflare stellt die Hosting-Infrastruktur bereit und verarbeitet dabei technische Zugriffsdaten zum Schutz vor Angriffen (DDoS-Schutz).</P>

          <P style={{ marginTop: 16 }}><Strong>Google LLC</Strong> (OAuth-Login, optional)</P>
          <P>1600 Amphitheatre Parkway, Mountain View, CA 94043, USA</P>
          <P>Wenn Sie sich mit Google anmelden, wird Ihre Google-Identität zur Authentifizierung verwendet. Wir erhalten dabei nur E-Mail-Adresse und Anzeigename.</P>
        </>
      ),
    },
    {
      id: 'speicherdauer',
      title: 'Speicherdauer',
      content: (
        <>
          <P>Wir speichern Ihre Daten nur so lange, wie es für die genannten Zwecke erforderlich ist:</P>
          <UL items={[
            'Accountdaten: bis zur Löschung des Kontos',
            'Rechnungsdaten: 10 Jahre (gesetzliche Aufbewahrungspflicht Schweiz)',
            'Log-Daten: maximal 90 Tage',
            'Inaktive Konten: werden nach 24 Monaten Inaktivität automatisch gelöscht',
          ]} />
          <P>Nach Ablauf der Speicherdauer oder auf Anfrage werden Ihre Daten sicher gelöscht oder anonymisiert.</P>
        </>
      ),
    },
    {
      id: 'cookies',
      title: 'Cookies & lokale Speicherung',
      content: (
        <>
          <P>PTOne verwendet folgende Speichermechanismen:</P>
          <UL items={[
            'Session-Cookies: für die Authentifizierung (technisch notwendig, keine Einwilligung erforderlich)',
            'localStorage: für Spracheinstellung und Theme-Präferenz (lokal, kein Server-Zugriff)',
            'Keine Tracking- oder Marketing-Cookies von Drittanbietern',
            'Kein Google Analytics oder ähnliche Analyse-Tools',
          ]} />
        </>
      ),
    },
    {
      id: 'rechte',
      title: 'Ihre Rechte',
      content: (
        <>
          <P>Sie haben gemäss DSGVO (Art. 15–22) und nDSG (Art. 25–27) folgende Rechte:</P>
          <UL items={[
            'Auskunftsrecht: Welche Daten wir über Sie gespeichert haben',
            'Berichtigungsrecht: Korrektur unrichtiger Daten',
            'Löschungsrecht: Löschung Ihrer Daten («Recht auf Vergessenwerden»)',
            'Einschränkungsrecht: Einschränkung der Verarbeitung',
            'Datenübertragbarkeit: Herausgabe Ihrer Daten in einem maschinenlesbaren Format',
            'Widerspruchsrecht: Widerspruch gegen bestimmte Verarbeitungen',
            'Widerruf der Einwilligung: Jederzeit für einwilligungsbasierte Verarbeitungen',
          ]} />
          <P>Zur Ausübung Ihrer Rechte wenden Sie sich an: <a href="mailto:info@yannicksalm.ch" style={{ color: 'var(--accent)' }}>info@yannicksalm.ch</a></P>
          <P>Sie haben ausserdem das Recht, Beschwerde bei der zuständigen Datenschutzbehörde einzureichen (Schweiz: EDÖB – Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter).</P>
        </>
      ),
    },
    {
      id: 'sicherheit',
      title: 'Datensicherheit',
      content: (
        <>
          <P>Wir setzen technische und organisatorische Sicherheitsmassnahmen ein, um Ihre Daten vor Verlust, Missbrauch und unberechtigtem Zugriff zu schützen:</P>
          <UL items={[
            'Verschlüsselung der Datenübertragung via HTTPS/TLS',
            'Passwörter werden ausschliesslich gehasht (bcrypt) gespeichert',
            'Datenbank-Zugriff nur über authentifizierte API-Aufrufe',
            'Row-Level Security (RLS) in der Datenbank',
            'Regelmässige Sicherheitsupdates',
          ]} />
        </>
      ),
    },
    {
      id: 'aenderungen',
      title: 'Änderungen dieser Erklärung',
      content: (
        <>
          <P>Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, um sie aktuellen rechtlichen Anforderungen oder Änderungen unserer Dienstleistungen zu entsprechen.</P>
          <P>Bei wesentlichen Änderungen werden registrierte Nutzer per E-Mail informiert. Die jeweils aktuelle Version ist stets unter <a href="/datenschutz" style={{ color: 'var(--accent)' }}>/datenschutz</a> abrufbar.</P>
        </>
      ),
    },
  ];

  return (
    <LegalPage
      eyebrow="Rechtliches"
      title="Datenschutzerklärung"
      subtitle="Informationen zur Verarbeitung Ihrer personenbezogenen Daten gemäss DSGVO und nDSG"
      lastUpdated="19. Mai 2026"
      sections={sections}
    />
  );
}
