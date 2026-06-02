'use client';

import { LegalPage, P, UL, Strong } from '@/components/landing/LegalPage';
import { useTranslation } from '@/locales';

const PRIVACY_URL = 'https://datenschutz.yannicksalm.ch/#ptone';
const EMAIL = 'info@yannicksalm.ch';

export default function TermsPage() {
  const { lang } = useTranslation();
  const de = lang === 'de';

  const sections = de ? [
    {
      id: 'geltungsbereich',
      title: 'Geltungsbereich & Vertragsparteien',
      content: (
        <>
          <P>Diese Nutzungsbedingungen («Bedingungen») regeln die Nutzung von <Strong>PTOne</Strong>, einer Software-as-a-Service-Plattform betrieben von Yannick Salm, Zürich, Schweiz («PTOne», «wir», «uns»).</P>
          <P>Mit der Erstellung eines Kontos oder der Nutzung der Plattform stimmst du («Nutzer») diesen Bedingungen zu. Wenn du nicht einverstanden bist, verwende PTOne nicht.</P>
          <P>PTOne unterscheidet zwei Nutzertypen: <Strong>Personal Trainer (PTs)</Strong>, die Clients und Trainingsdaten verwalten, und <Strong>Clients</Strong>, die auf die Plattform über ihre PT zugreifen.</P>
        </>
      ),
    },
    {
      id: 'pt-zugang',
      title: 'PT-Zugang (auf Einladung)',
      content: (
        <>
          <P>PT-Konten werden <Strong>nicht öffentlich vergeben</Strong>. Der Zugang als Personal Trainer erfolgt ausschliesslich auf persönliche Anfrage und Freischaltung durch Yannick Salm.</P>
          <P>Um PT-Zugang zu beantragen, kontaktiere uns unter: <a href={`mailto:${EMAIL}`} style={{ color: 'var(--accent)' }}>{EMAIL}</a> oder über das Kontaktformular.</P>
          <P>Als PT erklärst du mit der Nutzung, dass du:</P>
          <UL items={[
            'legitime Personal-Training-Dienstleistungen anbietest',
            'über die notwendigen Qualifikationen oder Zertifizierungen verfügst',
            'PTOne ausschliesslich für rechtmässige Geschäftszwecke nutzt',
            'für die Richtigkeit deines öffentlichen Profils verantwortlich bist',
          ]} />
        </>
      ),
    },
    {
      id: 'client-registrierung',
      title: 'Client-Registrierung',
      content: (
        <>
          <P>Clients können sich eigenständig registrieren. Der Zugang zum vollen Client-Dashboard wird freigeschaltet, sobald ein PT den Client hinzufügt.</P>
          <P>Clients verpflichten sich, die Plattform ausschliesslich zur Verfolgung ihres persönlichen Trainingsfortschritts und zur Kommunikation mit ihrem PT zu nutzen.</P>
        </>
      ),
    },
    {
      id: 'konto',
      title: 'Kontoregistrierung',
      content: (
        <>
          <P>Für die Nutzung von PTOne musst du ein Konto erstellen. Du verpflichtest dich:</P>
          <UL items={[
            'Genaue und vollständige Registrierungsdaten anzugeben',
            'Deine Zugangsdaten vertraulich zu behandeln und nicht weiterzugeben',
            'Uns bei unbefugter Nutzung deines Kontos sofort zu benachrichtigen',
            'Mindestens 16 Jahre alt zu sein (oder elterliche Zustimmung bei jüngeren Nutzern)',
          ]} />
        </>
      ),
    },
    {
      id: 'plattform-funktionen',
      title: 'Plattformfunktionen',
      content: (
        <>
          <P>PTOne bietet unter anderem folgende Funktionen:</P>
          <UL items={[
            'Erstellung und Zuweisung von Trainingsplänen mit Übungen und Sets',
            'Workout-Tracking mit Wiederholungen, Gewichten und Supersets',
            'Wöchentliche Journal-Einreichungen mit Körperdaten und Bewertungen',
            'Buchhaltung: Rechnungsstellung, Swiss QR-Zahlschein, Mahnwesen',
            'Google Calendar-Integration für Termine',
            'Datei-Verwaltung (Drive) für Dokumente und Rechnungen',
            'Exercise-Demo-Videos (hochgeladen durch PT)',
            'E-Mail-Versand über Resend (Rechnungen, Mahnungen)',
          ]} />
          <P>Der Funktionsumfang kann sich im Laufe der Zeit ändern. Neue Funktionen können ohne Vorankündigung hinzugefügt werden.</P>
        </>
      ),
    },
    {
      id: 'akzeptable-nutzung',
      title: 'Akzeptable Nutzung',
      content: (
        <>
          <P>Es ist untersagt, PTOne für folgende Zwecke zu nutzen:</P>
          <UL items={[
            'Verstoss gegen geltendes Recht oder Vorschriften',
            'Hochladen schädlicher, rechtswidriger oder anstössiger Inhalte',
            'Vortäuschen einer anderen Person oder Organisation',
            'Versuch des unbefugten Zugriffs auf andere Konten oder Systeme',
            'Automatisiertes Auslesen (Scraping) von Plattformdaten',
            'Übertragung von Schadsoftware oder schädlichem Code',
            'Spam oder unaufgeforderte Nachrichten',
            'Umgehung von Sicherheitsmassnahmen',
          ]} />
          <P>Wir behalten uns das Recht vor, Konten, die gegen diese Regeln verstossen, ohne Vorankündigung zu sperren oder zu löschen.</P>
        </>
      ),
    },
    {
      id: 'daten-inhalte',
      title: 'Daten & Inhalte',
      content: (
        <>
          <P>Du behältst das Eigentum an allen Inhalten, die du auf PTOne hochlädst (Trainingspläne, Journaleinträge, Dokumente, Fotos, Videos etc.).</P>
          <P>Durch das Hochladen erteilst du PTOne eine eingeschränkte, nicht-exklusive Lizenz, diese Inhalte ausschliesslich zum Zweck der Bereitstellung des Dienstes zu speichern, zu verarbeiten und anzuzeigen.</P>
          <P>Wir verkaufen deine Daten nicht an Dritte. Die Datenverarbeitung ist in unserer <a href={PRIVACY_URL} style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a> beschrieben.</P>
        </>
      ),
    },
    {
      id: 'rechnungen-zahlungen',
      title: 'Rechnungen & Zahlungsabwicklung',
      content: (
        <>
          <P>PTOne stellt Werkzeuge zur Rechnungsstellung bereit, darunter Swiss QR-konforme Zahlscheine (SPS 2022). Die Verwendung dieser Werkzeuge liegt in der Verantwortung des jeweiligen PTs.</P>
          <P>PTOne verarbeitet keine Zahlungen direkt. Alle Zahlungsabwicklungen zwischen PT und Client finden ausserhalb der Plattform statt (z.B. Banküberweisung).</P>
          <P>PTs sind selbst verantwortlich für die korrekte steuerliche Behandlung ihrer Rechnungen gemäss den lokalen Vorschriften.</P>
        </>
      ),
    },
    {
      id: 'preise',
      title: 'Preise & Verfügbarkeit',
      content: (
        <>
          <P>PTOne ist derzeit während der Beta-Phase kostenlos. Wir behalten uns das Recht vor, in Zukunft kostenpflichtige Pläne einzuführen.</P>
          <P>Sollten kostenpflichtige Pläne eingeführt werden:</P>
          <UL items={[
            'Erhältst du mindestens 30 Tage vorher eine Benachrichtigung',
            'Aktiv genutzte Funktionen werden nicht ohne angemessene Vorankündigung entfernt',
            'Zahlungen werden über Drittanbieter abgewickelt; deren AGB gelten',
            'Alle Preise in CHF inkl. Schweizer MwSt. (soweit anwendbar)',
          ]} />
        </>
      ),
    },
    {
      id: 'kündigung',
      title: 'Kündigung',
      content: (
        <>
          <P><Strong>Durch dich:</Strong> Du kannst dein Konto jederzeit über die Einstellungen oder per E-Mail an <a href={`mailto:${EMAIL}`} style={{ color: 'var(--accent)' }}>{EMAIL}</a> löschen. Deine Daten werden innerhalb von 30 Tagen gelöscht, soweit keine gesetzliche Aufbewahrungspflicht besteht.</P>
          <P><Strong>Durch uns:</Strong> Wir können dein Konto sofort sperren oder löschen, wenn du gegen diese Bedingungen verstosst, betrügerische Aktivitäten vorliegen oder dies gesetzlich erforderlich ist.</P>
          <P>Du kannst vor der Kündigung einen Datenexport anfordern.</P>
        </>
      ),
    },
    {
      id: 'haftung',
      title: 'Haftungsbeschränkung',
      content: (
        <>
          <P>Im gesetzlich zulässigen Rahmen haften PTOne und sein Betreiber nicht für:</P>
          <UL items={[
            'Mittelbare oder Folgeschäden',
            'Datenverlust oder Betriebsunterbrechungen',
            'Handlungen oder Inhalte von Drittnutzern der Plattform',
            'Körperliche Verletzungen oder gesundheitliche Folgen aus Trainingsberatungen oder -plänen',
          ]} />
          <P>Unsere Gesamthaftung für jeden Anspruch ist auf den von dir in den 12 Monaten vor dem Anspruch gezahlten Betrag oder CHF 100 begrenzt, je nachdem, welcher Betrag höher ist.</P>
          <P><Strong>Wichtig:</Strong> PTOne ist ein Verwaltungswerkzeug, kein medizinischer oder gesundheitlicher Dienst. Trainingspläne liegen in der Verantwortung des jeweiligen PTs.</P>
        </>
      ),
    },
    {
      id: 'anwendbares-recht',
      title: 'Anwendbares Recht & Gerichtsstand',
      content: (
        <>
          <P>Diese Bedingungen unterliegen <Strong>schweizerischem Recht</Strong> unter Ausschluss des UN-Kaufrechts (CISG).</P>
          <P>Ausschliesslicher Gerichtsstand für Streitigkeiten ist <Strong>Zürich, Schweiz</Strong>, soweit nicht zwingendes Verbraucherschutzrecht deines Wohnsitzlandes abweichende Regelungen vorsieht.</P>
        </>
      ),
    },
    {
      id: 'änderungen',
      title: 'Änderungen dieser Bedingungen',
      content: (
        <>
          <P>Wir können diese Bedingungen von Zeit zu Zeit aktualisieren. Über wesentliche Änderungen informieren wir dich per E-Mail oder über eine Mitteilung auf der Plattform mindestens 14 Tage vor Inkrafttreten.</P>
          <P>Die weitere Nutzung von PTOne nach dem Inkrafttreten gilt als Zustimmung zu den aktualisierten Bedingungen.</P>
          <P>Die aktuelle Version ist stets unter <a href="/terms" style={{ color: 'var(--accent)' }}>/terms</a> abrufbar.</P>
        </>
      ),
    },
  ] : [
    {
      id: 'scope',
      title: 'Scope & Parties',
      content: (
        <>
          <P>These Terms of Service ("Terms") govern your use of <Strong>PTOne</Strong>, a software-as-a-service platform operated by Yannick Salm, Zürich, Switzerland ("PTOne", "we", "us").</P>
          <P>By creating an account or using the platform, you ("User") agree to these Terms. If you do not agree, do not use PTOne.</P>
          <P>PTOne distinguishes two user types: <Strong>Personal Trainers (PTs)</Strong> who manage clients and training data, and <Strong>Clients</Strong> who access the platform through their PT.</P>
        </>
      ),
    },
    {
      id: 'pt-access',
      title: 'PT Access (By Invitation)',
      content: (
        <>
          <P>PT accounts are <Strong>not publicly available</Strong>. Access as a personal trainer is granted exclusively upon personal request and approval by Yannick Salm.</P>
          <P>To apply for PT access, contact us at: <a href={`mailto:${EMAIL}`} style={{ color: 'var(--accent)' }}>{EMAIL}</a> or via the contact form.</P>
          <P>By using PTOne as a PT, you represent that you:</P>
          <UL items={[
            'Are offering legitimate personal training services',
            'Hold the necessary qualifications or certifications',
            'Will use PTOne only for lawful business purposes',
            'Are responsible for the accuracy of your public profile',
          ]} />
        </>
      ),
    },
    {
      id: 'client-registration',
      title: 'Client Registration',
      content: (
        <>
          <P>Clients may register independently. Full access to the client dashboard is activated once a PT adds the client to their account.</P>
          <P>Clients agree to use the platform solely for tracking their personal training progress and communicating with their PT.</P>
        </>
      ),
    },
    {
      id: 'account',
      title: 'Account Registration',
      content: (
        <>
          <P>To use PTOne you must create an account. You agree to:</P>
          <UL items={[
            'Provide accurate and complete registration information',
            'Keep your credentials confidential and not share them',
            'Notify us immediately of any unauthorised use of your account',
            'Be at least 16 years old (or have parental consent if younger)',
          ]} />
        </>
      ),
    },
    {
      id: 'platform-features',
      title: 'Platform Features',
      content: (
        <>
          <P>PTOne provides among other things:</P>
          <UL items={[
            'Training plan creation and assignment with exercises and sets',
            'Workout tracking with reps, weights and supersets',
            'Weekly journal submissions with body data and ratings',
            'Accounting: invoicing, Swiss QR payment slips, dunning',
            'Google Calendar integration for appointments',
            'File management (Drive) for documents and invoices',
            'Exercise demo videos (uploaded by PT)',
            'Email delivery via Resend (invoices, reminders)',
          ]} />
          <P>The feature set may change over time. New features may be added without prior notice.</P>
        </>
      ),
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable Use',
      content: (
        <>
          <P>You may not use PTOne to:</P>
          <UL items={[
            'Violate any applicable law or regulation',
            'Upload harmful, unlawful, or offensive content',
            'Impersonate another person or entity',
            'Attempt to gain unauthorised access to other accounts or systems',
            'Scrape, crawl, or harvest data from the platform',
            'Transmit malware or other harmful code',
            'Use the platform for spam or unsolicited messages',
            'Circumvent any security measures or access controls',
          ]} />
          <P>We reserve the right to suspend or terminate accounts that violate these rules without prior notice.</P>
        </>
      ),
    },
    {
      id: 'data-content',
      title: 'Your Data & Content',
      content: (
        <>
          <P>You retain ownership of all content you upload to PTOne (training plans, journal entries, documents, photos, videos, etc.).</P>
          <P>By uploading content, you grant PTOne a limited, non-exclusive licence to store, process and display that content solely for the purpose of providing the service.</P>
          <P>We do not sell your data to third parties. Data processing is described in our <a href={PRIVACY_URL} style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</P>
        </>
      ),
    },
    {
      id: 'invoicing',
      title: 'Invoicing & Payments',
      content: (
        <>
          <P>PTOne provides invoicing tools including Swiss QR-compliant payment slips (SPS 2022). The use of these tools is the responsibility of the respective PT.</P>
          <P>PTOne does not process payments directly. All payment transactions between PT and client take place outside the platform (e.g. bank transfer).</P>
          <P>PTs are solely responsible for the correct tax treatment of their invoices according to local regulations.</P>
        </>
      ),
    },
    {
      id: 'pricing',
      title: 'Pricing & Availability',
      content: (
        <>
          <P>PTOne is currently available free of charge during the beta period. We reserve the right to introduce paid plans in the future.</P>
          <P>If and when paid plans are introduced:</P>
          <UL items={[
            'You will be given at least 30 days advance notice',
            'Existing features in active use will not be removed without adequate notice',
            'Payment will be processed via third-party providers; their terms apply',
            'All prices are in CHF and include Swiss VAT where applicable',
          ]} />
        </>
      ),
    },
    {
      id: 'termination',
      title: 'Termination',
      content: (
        <>
          <P><Strong>By you:</Strong> You may delete your account at any time via account settings or by contacting <a href={`mailto:${EMAIL}`} style={{ color: 'var(--accent)' }}>{EMAIL}</a>. Your data will be deleted within 30 days, except where legally required.</P>
          <P><Strong>By us:</Strong> We may suspend or terminate your account immediately if you breach these Terms, engage in fraudulent activity, or if required by law.</P>
          <P>You may request a data export before termination.</P>
        </>
      ),
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      content: (
        <>
          <P>To the maximum extent permitted by applicable law, PTOne and its operator are not liable for:</P>
          <UL items={[
            'Indirect, incidental, or consequential damages',
            'Loss of data or business interruption',
            'Actions or content of third-party users on the platform',
            'Physical injury or health outcomes resulting from training advice or plans',
          ]} />
          <P>Our total liability for any claim is limited to the amount you paid in the 12 months preceding the claim, or CHF 100, whichever is greater.</P>
          <P><Strong>Important:</Strong> PTOne is a management tool, not a medical or health service. Training plans are the responsibility of the PT who created them.</P>
        </>
      ),
    },
    {
      id: 'governing-law',
      title: 'Governing Law & Jurisdiction',
      content: (
        <>
          <P>These Terms are governed by <Strong>Swiss law</Strong>, excluding the UN CISG.</P>
          <P>The exclusive jurisdiction for any disputes is <Strong>Zürich, Switzerland</Strong>, unless mandatory consumer protection laws in your country of residence provide otherwise.</P>
        </>
      ),
    },
    {
      id: 'changes',
      title: 'Changes to These Terms',
      content: (
        <>
          <P>We may update these Terms from time to time. We will notify you of significant changes by email or via a notice on the platform at least 14 days before they take effect.</P>
          <P>Continued use of PTOne after the effective date constitutes acceptance of the updated Terms.</P>
          <P>The current version is always available at <a href="/terms" style={{ color: 'var(--accent)' }}>/terms</a>.</P>
        </>
      ),
    },
  ];

  return (
    <LegalPage
      eyebrow={de ? 'Rechtliches' : 'Legal'}
      title={de ? 'Allgemeine Geschäftsbedingungen' : 'Terms of Service'}
      subtitle={de
        ? 'Bitte lies diese Bedingungen sorgfältig durch, bevor du PTOne nutzt.'
        : 'Please read these terms carefully before using PTOne.'}
      lastUpdated={de ? '2. Juni 2026' : '2 June 2026'}
      sections={sections}
      lang={lang}
    />
  );
}
