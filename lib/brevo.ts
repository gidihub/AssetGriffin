import { BrevoClient } from '@getbrevo/brevo'

/**
 * Server-only email client. Never import this from a Client Component.
 *
 * Scaffolding only — components/marketing/contact-form.tsx currently only
 * updates local UI state on submit and never sends anything. To wire up
 * real delivery:
 *   1. Convert the form to call a Server Action (see app/login/actions.ts
 *      for the pattern) that captures FormData and calls `sendContactEmail`
 *      below.
 *   2. Verify a sending domain/sender in the Brevo dashboard and set
 *      BREVO_FROM_EMAIL to an address on that domain.
 */
export function getBrevoClient() {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not set — add it to .env.local')
  }
  return new BrevoClient({ apiKey })
}

export async function sendContactEmail(params: { name: string; email: string; message: string }) {
  const client = getBrevoClient()
  const fromEmail = process.env.BREVO_FROM_EMAIL
  const toEmail = process.env.CONTACT_FORM_TO_EMAIL

  if (!fromEmail || !toEmail) {
    throw new Error(
      'BREVO_FROM_EMAIL and CONTACT_FORM_TO_EMAIL must be set — add them to .env.local'
    )
  }

  return client.transactionalEmails.sendTransacEmail({
    sender: { email: fromEmail, name: 'AssetGriffin' },
    to: [{ email: toEmail }],
    replyTo: { email: params.email, name: params.name },
    subject: `New contact form message from ${params.name}`,
    textContent: params.message,
  })
}
