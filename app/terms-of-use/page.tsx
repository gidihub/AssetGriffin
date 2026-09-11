import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { SubPageHero } from '@/components/marketing/sub-page-hero'
import { LegalContent } from '@/components/marketing/legal-content'

export const metadata: Metadata = {
  title: 'Terms of Use | AssetGriffin',
  description: 'The terms and conditions that govern your use of AssetGriffin.',
}

const sections = [
  {
    heading: 'Agreement to terms',
    body: [
      'These Terms of Use ("Terms") govern your access to and use of AssetGriffin\u2019s website and asset tracking software (the "Service"). By creating an account or using the Service, you agree to be bound by these Terms. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.',
    ],
  },
  {
    heading: 'Accounts',
    body: [
      'You must provide accurate and complete information when creating an account and keep that information up to date. You are responsible for safeguarding your account credentials and for all activity that occurs under your account. Notify us promptly if you become aware of any unauthorized use of your account.',
    ],
  },
  {
    heading: 'Acceptable use',
    body: ['When using the Service, you agree not to:'],
    list: [
      'Use the Service for any unlawful purpose or in violation of any applicable regulation.',
      'Attempt to gain unauthorized access to the Service, other accounts, or related systems.',
      'Upload malicious code or content that infringes the intellectual property rights of others.',
      'Reverse engineer, decompile, or attempt to extract the source code of the Service, except where permitted by law.',
      'Resell or provide the Service to third parties without our prior written consent.',
    ],
  },
  {
    heading: 'Your data',
    body: [
      'You retain ownership of the asset, inventory, and other data you upload to the Service ("Customer Data"). You grant us a limited license to host, store, and process Customer Data solely to provide and improve the Service.',
      'You are responsible for the accuracy of Customer Data and for ensuring you have the necessary rights to upload it, including any data related to individuals.',
    ],
  },
  {
    heading: 'Subscriptions and billing',
    body: [
      'Free tier accounts are limited to the asset count described on our pricing page. Paid subscriptions renew automatically for the billing period you select unless canceled before the renewal date. Fees are non-refundable except where required by law or expressly stated otherwise.',
      'We may change our pricing with advance notice; changes will apply at your next renewal.',
    ],
  },
  {
    heading: 'Service availability',
    body: [
      'We work to keep the Service available and reliable but do not guarantee uninterrupted access. We may suspend or restrict access for maintenance, security, or to comply with legal obligations, and will provide notice where practical.',
    ],
  },
  {
    heading: 'Intellectual property',
    body: [
      'AssetGriffin and its licensors retain all rights, title, and interest in the Service, including all software, branding, and content we provide, other than Customer Data. Nothing in these Terms transfers ownership of our intellectual property to you.',
    ],
  },
  {
    heading: 'Termination',
    body: [
      'You may cancel your account at any time. We may suspend or terminate your access to the Service if you materially breach these Terms and do not cure the breach within a reasonable period after notice, or immediately in cases of fraud, security risk, or legal requirement.',
      'Upon termination, your right to use the Service ends, and we will handle your Customer Data in accordance with our Privacy Policy.',
    ],
  },
  {
    heading: 'Disclaimers and limitation of liability',
    body: [
      'The Service is provided "as is" without warranties of any kind, express or implied. To the maximum extent permitted by law, AssetGriffin will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, revenue, or profits, arising from your use of the Service.',
    ],
  },
  {
    heading: 'Changes to these terms',
    body: [
      'We may revise these Terms from time to time. If we make material changes, we will provide notice through the Service or by email before the changes take effect. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.',
    ],
  },
  {
    heading: 'Contact us',
    body: [
      'Questions about these Terms can be sent to legal@assetgriffin.com or through our contact page.',
    ],
  },
]

export default function TermsOfUsePage() {
  return (
    <main>
      <MarketingHeader />
      <SubPageHero
        eyebrow="Company · Terms"
        title="Terms of Use"
        subtitle="The terms and conditions that govern your use of AssetGriffin."
      />
      <LegalContent lastUpdated="September 10, 2026" sections={sections} />
      <MarketingFooter />
    </main>
  )
}
