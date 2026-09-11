import { Resend } from 'resend'

/**
 * Server-only email client. Never import this from a Client Component.
 *
 * Scaffolding only — components/marketing/contact-form.tsx currently only
 * updates local UI state on submit and never sends anything. To wire up
 * real delivery:
 *   1. Convert the form to call a Server Action (see app/login/actions.ts
 *      for the pattern) that captures FormData and calls `sendEmail` below.
 *   2. Verify a sending domain in the Resend dashboard and set
 *      RESEND_FROM_EMAIL to an address on that domain.
 */
export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set — add it to .env.local')
  }
  return new Resend(apiKey)
}

export async function sendContactEmail(params: { name: string; email: string; message: string }) {
  const resend = getResendClient()
  const from = process.env.RESEND_FROM_EMAIL
  const to = process.env.CONTACT_FORM_TO_EMAIL

  if (!from || !to) {
    throw new Error(
      'RESEND_FROM_EMAIL and CONTACT_FORM_TO_EMAIL must be set — add them to .env.local'
    )
  }

  return resend.emails.send({
    from,
    to,
    replyTo: params.email,
    subject: `New contact form message from ${params.name}`,
    text: params.message,
  })
}
