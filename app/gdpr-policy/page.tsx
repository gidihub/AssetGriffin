import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { LegalContent } from '@/components/marketing/legal-content'

export const metadata: Metadata = {
  title: 'GDPR Policy | AssetGriffin',
  description: 'How AssetGriffin supports GDPR compliance and the rights of individuals in the EEA, UK, and Switzerland.',
}

const sections = [
  {
    heading: 'Our commitment',
    body: [
      'AssetGriffin is committed to complying with the General Data Protection Regulation (GDPR) and equivalent UK and Swiss data protection law for individuals located in the European Economic Area, United Kingdom, and Switzerland ("EEA and equivalent regions"). This policy supplements our Privacy Policy and describes how we support GDPR compliance.',
    ],
  },
  {
    heading: 'Roles under the GDPR',
    body: [
      'When you use AssetGriffin to store asset, inventory, or personnel-related data, AssetGriffin generally acts as a data processor on your behalf, and your organization acts as the data controller responsible for that data.',
      'When we collect information directly from you as a website visitor or account holder — such as your name, email, and billing details — AssetGriffin acts as the data controller for that information.',
    ],
  },
  {
    heading: 'Legal basis for processing',
    body: ['We rely on the following legal bases to process personal data:'],
    list: [
      'Contractual necessity — to provide the Service you have signed up for, such as maintaining your account and asset records.',
      'Legitimate interests — to secure the Service, prevent fraud, and improve our product, balanced against your rights.',
      'Consent — where you have opted in to receive marketing communications, which you may withdraw at any time.',
      'Legal obligation — where processing is required to comply with applicable law.',
    ],
  },
  {
    heading: 'Your rights under the GDPR',
    body: [
      'If you are located in the EEA, UK, or Switzerland, you have the following rights regarding your personal data, subject to certain exceptions provided by law:',
    ],
    list: [
      'Right of access — request a copy of the personal data we hold about you.',
      'Right to rectification — request correction of inaccurate or incomplete data.',
      'Right to erasure — request deletion of your personal data in certain circumstances.',
      'Right to restrict processing — request that we limit how we use your data.',
      'Right to data portability — request your data in a structured, commonly used format.',
      'Right to object — object to processing based on legitimate interests or for direct marketing.',
      'Right to withdraw consent — withdraw consent at any time where processing is based on consent.',
    ],
  },
  {
    heading: 'How to exercise your rights',
    body: [
      'To exercise any of these rights, contact us at privacy@assetgriffin.com. If your organization\u2019s account contains the data in question and AssetGriffin acts as a processor for that data, we may direct your request to your organization\u2019s account administrator, who is best positioned to fulfill it as the data controller.',
      'We will respond to verified requests within the timeframe required by applicable law, generally within one month.',
    ],
  },
  {
    heading: 'International data transfers',
    body: [
      'Where personal data is transferred outside the EEA, UK, or Switzerland, we rely on appropriate safeguards recognized under the GDPR, such as Standard Contractual Clauses, to ensure the data receives an equivalent level of protection.',
    ],
  },
  {
    heading: 'Data processing agreements',
    body: [
      'Organizations that require a Data Processing Agreement (DPA) to reflect AssetGriffin\u2019s role as a processor can request one by contacting privacy@assetgriffin.com.',
    ],
  },
  {
    heading: 'Right to lodge a complaint',
    body: [
      'If you believe we have not adequately addressed a concern about your personal data, you have the right to lodge a complaint with your local data protection supervisory authority.',
    ],
  },
  {
    heading: 'Contact us',
    body: [
      'For any questions about this GDPR Policy or our data protection practices, contact us at privacy@assetgriffin.com or through our contact page.',
    ],
  },
]

export default function GdprPolicyPage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="Company · GDPR"
        title="GDPR Policy"
        subtitle="How AssetGriffin supports data protection rights for individuals in the EEA, UK, and Switzerland."
      />
      <LegalContent lastUpdated="September 10, 2026" sections={sections} />
      <MarketingFooter />
    </main>
  )
}
