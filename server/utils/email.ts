/**
 * Sends email through Resend's HTTP API (no SDK needed, works on Node and
 * Cloudflare). Without an API key in development, the email is printed to
 * the terminal instead so you can click the link from there.
 */
import type { H3Event } from 'h3'

interface Message {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail(event: H3Event, msg: Message) {
  const config = useRuntimeConfig(event)

  if (!config.resendApiKey) {
    if (import.meta.dev) {
      console.info(`\n[email] To: ${msg.to}\n[email] Subject: ${msg.subject}\n${msg.text}\n`)
      return
    }
    throw createError({ statusCode: 500, statusMessage: 'Email is not configured' })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: config.emailFrom,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text
    })
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error('[email] Resend error', res.status, detail)
    throw createError({ statusCode: 502, statusMessage: 'Could not send the email. Please try again.' })
  }
}

export function signInEmail(link: string): Omit<Message, 'to'> {
  const text = `Here's your link to sign in to Brain Dump:\n\n${link}\n\nIt works once and expires in 20 minutes. If you didn't ask for this, you can ignore this email.`
  const html = `<!doctype html>
<html><body style="margin:0;background:#FAF9F7;font-family:Helvetica,Arial,sans-serif;color:#221D1A">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border-radius:24px;padding:36px">
        <tr><td style="font-size:22px;letter-spacing:-0.5px;padding-bottom:20px">brain<em style="font-family:Georgia,serif">dump</em></td></tr>
        <tr><td style="font-size:26px;font-weight:300;line-height:1.2;padding-bottom:16px">Good morning. Here's your way in.</td></tr>
        <tr><td style="padding-bottom:24px">
          <a href="${link}" style="display:inline-block;background:#221D1A;color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:16px">Sign in to Brain Dump</a>
        </td></tr>
        <tr><td style="font-size:14px;line-height:1.5;color:#55504B">This link works once and expires in 20 minutes. If you didn't ask for it, you can ignore this email.</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
  return { subject: 'Your Brain Dump sign-in link', html, text }
}
