'use client';

import { LegalPage, P, UL, Strong } from '@/components/landing/LegalPage';

export default function TermsPage() {
  const sections = [
    {
      id: 'scope',
      title: 'Scope & Parties',
      content: (
        <>
          <P>These Terms of Service ("Terms") govern your use of <Strong>PTOne</Strong>, a software-as-a-service platform operated by Yannick Salm, Zürich, Switzerland ("PTOne", "we", "us").</P>
          <P>By creating an account or using the platform, you ("User") agree to these Terms. If you do not agree, do not use PTOne.</P>
          <P>PTOne distinguishes two user types: <Strong>Personal Trainers (PTs)</Strong> who manage clients and training data, and <Strong>Clients</Strong> who access the platform through an invitation from their PT.</P>
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
          <P>You are responsible for all activity that occurs under your account.</P>
        </>
      ),
    },
    {
      id: 'pt-account',
      title: 'Personal Trainer Accounts',
      content: (
        <>
          <P>PT accounts are self-registered. By registering as a PT you represent that:</P>
          <UL items={[
            'You are offering legitimate personal training services',
            'You have the necessary qualifications or certifications to provide the services you advertise',
            'You will use PTOne only for lawful business purposes',
            'You are responsible for the accuracy of your public profile information',
          ]} />
          <P>PTOne does not independently verify PT qualifications. Users of the platform should conduct their own due diligence when selecting a trainer.</P>
        </>
      ),
    },
    {
      id: 'client-account',
      title: 'Client Accounts',
      content: (
        <>
          <P>Client access requires an invitation or approval from a registered PT. Clients may register independently but cannot access the full client dashboard until assigned to a PT (<code>has_coach = true</code>).</P>
          <P>Clients agree to use the platform solely for tracking their personal training progress and communicating with their assigned PT.</P>
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
            'Transmit malware, viruses, or other harmful code',
            'Use the platform for spam or unsolicited commercial messages',
            'Circumvent any security measures or access controls',
          ]} />
          <P>We reserve the right to suspend or terminate accounts that violate these rules without prior notice.</P>
        </>
      ),
    },
    {
      id: 'data-and-content',
      title: 'Your Data & Content',
      content: (
        <>
          <P>You retain ownership of all content you upload to PTOne (training plans, journal entries, documents, photos, etc.).</P>
          <P>By uploading content, you grant PTOne a limited, non-exclusive licence to store, process, and display that content solely for the purpose of providing the service to you.</P>
          <P>We do not sell your data to third parties. Data processing is described in our <a href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</a>.</P>
        </>
      ),
    },
    {
      id: 'pricing',
      title: 'Pricing & Payment',
      content: (
        <>
          <P>PTOne is currently available free of charge during the beta period. We reserve the right to introduce paid plans in the future.</P>
          <P>If and when paid plans are introduced:</P>
          <UL items={[
            'You will be given at least 30 days advance notice before any free plan changes',
            'Existing features in active use will not be removed without adequate notice',
            'Payment will be processed via third-party providers; their terms apply',
            'All prices are in CHF and include Swiss VAT where applicable',
          ]} />
        </>
      ),
    },
    {
      id: 'availability',
      title: 'Service Availability',
      content: (
        <>
          <P>We aim for high availability but do not guarantee uninterrupted service. PTOne may be unavailable during maintenance, upgrades, or due to factors outside our control.</P>
          <P>We are not liable for any losses resulting from temporary unavailability of the service.</P>
        </>
      ),
    },
    {
      id: 'termination',
      title: 'Termination',
      content: (
        <>
          <P><Strong>By you:</Strong> You may delete your account at any time via account settings or by contacting <a href="mailto:info@yannicksalm.ch" style={{ color: 'var(--accent)' }}>info@yannicksalm.ch</a>. Your data will be deleted within 30 days, except where retention is legally required.</P>
          <P><Strong>By us:</Strong> We may suspend or terminate your account immediately if you breach these Terms, engage in fraudulent activity, or if we are required to do so by law.</P>
          <P>On termination, your right to use the service ceases. You may request an export of your data before termination.</P>
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
          <P>Our total liability for any claim is limited to the amount you paid for the service in the 12 months preceding the claim, or CHF 100, whichever is greater.</P>
          <P><Strong>Important:</Strong> PTOne is a management tool, not a medical or health service. Training plans created through PTOne are the responsibility of the PT who created them, not PTOne.</P>
        </>
      ),
    },
    {
      id: 'governing-law',
      title: 'Governing Law & Jurisdiction',
      content: (
        <>
          <P>These Terms are governed by <Strong>Swiss law</Strong>, excluding the UN Convention on Contracts for the International Sale of Goods (CISG).</P>
          <P>Any disputes arising from or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of <Strong>Zürich, Switzerland</Strong>, unless mandatory consumer protection laws in your country of residence provide otherwise.</P>
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
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="Please read these terms carefully before using PTOne."
      lastUpdated="19 May 2026"
      sections={sections}
    />
  );
}
