'use client';

import { LegalPage, P, UL, Strong } from '@/components/landing/LegalPage';

export default function PrivacyPage() {
  const sections = [
    {
      id: 'controller',
      title: 'Data Controller',
      content: (
        <>
          <P>The data controller responsible for processing your personal data is:</P>
          <P>
            <Strong>Yannick Salm</Strong><br />
            Zürich, Switzerland<br />
            Email: <a href="mailto:info@yannicksalm.ch" style={{ color: 'var(--accent)' }}>info@yannicksalm.ch</a>
          </P>
          <P>This Privacy Policy applies to the PTOne platform and website at ptone.yannicksalm.ch.</P>
        </>
      ),
    },
    {
      id: 'data-collected',
      title: 'What Data We Collect',
      content: (
        <>
          <P><Strong>Account registration data:</Strong></P>
          <UL items={[
            'First and last name',
            'Email address',
            'Password (stored encrypted, never in plain text)',
            'Account role (Personal Trainer or Client)',
          ]} />
          <P><Strong>Platform usage data:</Strong></P>
          <UL items={[
            'Training plans and workout logs',
            'Body metrics (weight, measurements) — only if entered by you',
            'Weekly journal entries (ratings, photos) — only if created by you',
            'Invoice and payment records',
            'Files and documents you upload',
            'Messages and communications within the platform',
          ]} />
          <P><Strong>Technical data (collected automatically):</Strong></P>
          <UL items={[
            'IP address (anonymised by Cloudflare)',
            'Browser type and operating system',
            'Access times and pages visited',
            'Referring URL',
          ]} />
        </>
      ),
    },
    {
      id: 'purpose',
      title: 'Why We Process Your Data',
      content: (
        <>
          <P>We process your personal data only for the following purposes:</P>
          <UL items={[
            'Providing and operating the PTOne platform',
            'Authentication and account security',
            'Enabling communication between PTs and their clients',
            'Creating and managing training plans, journals, and progress records',
            'Invoicing and accounting functions',
            'Improving and developing the service',
            'Complying with legal obligations',
          ]} />
        </>
      ),
    },
    {
      id: 'legal-basis',
      title: 'Legal Basis for Processing',
      content: (
        <>
          <P>We process your data under the following legal bases (GDPR Art. 6):</P>
          <UL items={[
            'Contract performance (Art. 6(1)(b)): to provide platform features',
            'Consent (Art. 6(1)(a)): for optional features such as progress photos',
            'Legal obligation (Art. 6(1)(c)): for accounting and tax retention requirements',
            'Legitimate interests (Art. 6(1)(f)): for security and fraud prevention',
          ]} />
          <P>For users in Switzerland: processing is based on Art. 6 nDSG (proportionate and in good faith).</P>
        </>
      ),
    },
    {
      id: 'third-parties',
      title: 'Third-Party Processors',
      content: (
        <>
          <P><Strong>Supabase Inc.</Strong> — Authentication & Database</P>
          <P>970 Toa Payoh North, Singapore · <a href="https://supabase.com/privacy" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">supabase.com/privacy</a></P>
          <P>Supabase stores your account data and platform data in encrypted form. Data transfers to third countries are based on EU Standard Contractual Clauses.</P>

          <P style={{ marginTop: 16 }}><Strong>Cloudflare Inc.</Strong> — Hosting & CDN</P>
          <P>101 Townsend St, San Francisco, CA 94107, USA · <a href="https://www.cloudflare.com/privacypolicy/" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">cloudflare.com/privacypolicy</a></P>
          <P>Cloudflare provides hosting infrastructure and processes technical access data for DDoS protection and performance.</P>

          <P style={{ marginTop: 16 }}><Strong>Google LLC</Strong> — OAuth login (optional)</P>
          <P>1600 Amphitheatre Parkway, Mountain View, CA 94043, USA</P>
          <P>If you choose to sign in with Google, your Google identity is used for authentication. We only receive your email address and display name.</P>

          <P style={{ marginTop: 16 }}>We do not sell your data to any third parties or use it for advertising purposes.</P>
        </>
      ),
    },
    {
      id: 'retention',
      title: 'Data Retention',
      content: (
        <>
          <P>We retain your data only as long as necessary:</P>
          <UL items={[
            'Account data: until account deletion',
            'Invoicing records: 10 years (Swiss statutory retention requirement)',
            'Server logs: maximum 90 days',
            'Inactive accounts: automatically deleted after 24 months of inactivity',
          ]} />
          <P>After the retention period, your data is securely deleted or anonymised.</P>
        </>
      ),
    },
    {
      id: 'cookies',
      title: 'Cookies & Local Storage',
      content: (
        <>
          <P>PTOne uses the following storage mechanisms:</P>
          <UL items={[
            'Session cookies: for authentication (technically necessary, no consent required)',
            'localStorage: for language and theme preferences (local only, no server access)',
            'No third-party tracking or marketing cookies',
            'No Google Analytics or similar analytics tools',
          ]} />
        </>
      ),
    },
    {
      id: 'your-rights',
      title: 'Your Rights',
      content: (
        <>
          <P>Under GDPR (Articles 15–22) and the Swiss nDSG (Art. 25–27), you have the following rights:</P>
          <UL items={[
            'Right of access: to know what data we hold about you',
            'Right to rectification: to correct inaccurate data',
            'Right to erasure: to have your data deleted ("right to be forgotten")',
            'Right to restriction: to restrict how we process your data',
            'Right to data portability: to receive your data in a machine-readable format',
            'Right to object: to object to certain types of processing',
            'Right to withdraw consent: at any time for consent-based processing',
          ]} />
          <P>To exercise your rights, contact us at <a href="mailto:info@yannicksalm.ch" style={{ color: 'var(--accent)' }}>info@yannicksalm.ch</a>. We will respond within 30 days.</P>
          <P>You also have the right to lodge a complaint with your local data protection authority. In Switzerland: <Strong>FDPIC</Strong> (Federal Data Protection and Information Commissioner) at <a href="https://www.edoeb.admin.ch" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">edoeb.admin.ch</a>.</P>
        </>
      ),
    },
    {
      id: 'security',
      title: 'Data Security',
      content: (
        <>
          <P>We implement technical and organisational measures to protect your data:</P>
          <UL items={[
            'All data transmitted over HTTPS/TLS encryption',
            'Passwords stored exclusively as bcrypt hashes — never readable',
            'Database access only via authenticated API calls',
            'Row-Level Security (RLS) ensures users can only access their own data',
            'Regular security reviews and dependency updates',
          ]} />
        </>
      ),
    },
    {
      id: 'international',
      title: 'International Data Transfers',
      content: (
        <>
          <P>Some of our service providers are located outside the EU/EEA and Switzerland (primarily the USA). Where data is transferred to countries without an adequate level of data protection, we ensure appropriate safeguards are in place, such as:</P>
          <UL items={[
            'EU Standard Contractual Clauses (SCCs)',
            'Adequacy decisions where applicable',
            'Data Processing Agreements with all sub-processors',
          ]} />
        </>
      ),
    },
    {
      id: 'changes',
      title: 'Changes to This Policy',
      content: (
        <>
          <P>We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will notify registered users of significant changes via email.</P>
          <P>The current version is always available at <a href="/privacy" style={{ color: 'var(--accent)' }}>/privacy</a>. The date at the top of this page indicates when it was last updated.</P>
        </>
      ),
    },
  ];

  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="How we collect, use and protect your personal data."
      lastUpdated="19 May 2026"
      sections={sections}
    />
  );
}
