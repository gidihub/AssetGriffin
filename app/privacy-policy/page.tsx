import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { LegalContent } from '@/components/marketing/legal-content'

export const metadata: Metadata = {
  title: 'Privacy Policy | AssetGriffin',
  description: 'How AssetGriffin collects, uses, and protects your data when you use our asset tracking software.',
}

const sections = [
  {
    heading: 'Overview',
    body: [
      'This Privacy Policy describes how AssetGriffin ("AssetGriffin," "we," "us," or "our") collects, uses, and shares information when you use our website and asset tracking software (together, the "Service").',
      'By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this policy, please do not use the Service.',
    ],
  },
  {
    heading: 'Information we collect',
    body: [
      'We collect information you provide directly to us, information collected automatically when you use the Service, and information related to the assets, inventory, and equipment data you choose to store in your account.',
    ],
    list: [
      'Account information — name, email address, company name, and password when you create an account.',
      'Asset and inventory data — records you create in the Service, such as asset names, descriptions, locations, photos, and custody history.',
      'Usage data — pages visited, features used, and actions taken within the Service, collected automatically through standard logging.',
      'Device and connection data — browser type, IP address, and operating system, collected when you access the Service.',
      'Billing information — processed by our payment provider; AssetGriffin does not store full payment card numbers.',
    ],
  },
  {
    heading: 'How we use information',
    body: ['We use the information we collect to provide, maintain, and improve the Service, including to:'],
    list: [
      'Create and manage your account and authenticate your access to the Service.',
      'Operate core features such as asset tracking, checkout logging, maintenance scheduling, and reporting.',
      'Communicate with you about your account, updates to the Service, and support requests.',
      'Monitor and analyze usage trends to improve performance and reliability.',
      'Detect, investigate, and prevent fraudulent or unauthorized activity.',
      'Comply with legal obligations and enforce our Terms of Use.',
    ],
  },
  {
    heading: 'How we share information',
    body: [
      'We do not sell your personal information. We share information only in the following circumstances:',
    ],
    list: [
      'With service providers who perform functions on our behalf, such as hosting, email delivery, and payment processing, under contractual obligations to protect your data.',
      'With other members of your organization\u2019s account, as determined by the roles and permissions your account administrator configures.',
      'To comply with a legal obligation, such as a subpoena, court order, or government request.',
      'In connection with a merger, acquisition, or sale of assets, subject to standard confidentiality obligations.',
      'With your consent, or at your direction.',
    ],
  },
  {
    heading: 'Data retention',
    body: [
      'We retain account and asset data for as long as your account is active or as needed to provide the Service. If you close your account, we will delete or anonymize your data within a reasonable period, except where retention is required to comply with a legal obligation, resolve disputes, or enforce our agreements.',
    ],
  },
  {
    heading: 'Data security',
    body: [
      'We use industry-standard technical and organizational measures to protect information from unauthorized access, disclosure, alteration, or destruction, including encryption in transit and role-based access controls. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    heading: 'Your rights and choices',
    body: [
      'Depending on your location, you may have rights to access, correct, export, or delete your personal information. You can update most account information directly within the Service, or contact us to make a request.',
      'If you are located in the European Economic Area, United Kingdom, or Switzerland, see our GDPR Policy for additional information about your rights under applicable data protection law.',
    ],
  },
  {
    heading: "Children's privacy",
    body: [
      'The Service is not directed to individuals under the age of 16, and we do not knowingly collect personal information from children. If we learn we have collected personal information from a child, we will take steps to delete it.',
    ],
  },
  {
    heading: 'Changes to this policy',
    body: [
      'We may update this Privacy Policy from time to time. If we make material changes, we will notify account administrators by email or through a notice within the Service before the changes take effect.',
    ],
  },
  {
    heading: 'Contact us',
    body: [
      'If you have questions about this Privacy Policy or how we handle your information, contact us at privacy@assetgriffin.com or through our contact page.',
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="Company · Privacy"
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your information when you use AssetGriffin."
      />
      <LegalContent lastUpdated="September 10, 2026" sections={sections} />
      <MarketingFooter />
    </main>
  )
}
