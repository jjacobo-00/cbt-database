import { Resend } from 'resend'
import nodemailer from 'nodemailer'

export async function sendOtpEmail(email: string, otp: string, memberName?: string) {
  const gmailUser = process.env.GMAIL_USER
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD
  const resendApiKey = process.env.RESEND_API_KEY
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'CBT Database <onboarding@resend.dev>'

  const subject = `${otp} is your CBT Member Portal login code`
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; }
        .card { max-width: 480px; margin: 20px auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
        .header { text-align: center; margin-bottom: 24px; }
        .logo-text { font-size: 20px; font-weight: bold; color: #1e293b; letter-spacing: -0.5px; }
        .title { font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 16px; margin-bottom: 8px; }
        .subtitle { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
        .otp-box { background-color: #f1f5f9; border-radius: 8px; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0284c7; border: 1px dashed #cbd5e1; margin-bottom: 24px; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo-text">⛪ CBT Olongapo</div>
          <div class="title">Member Verification Code</div>
          <div class="subtitle">Hello ${memberName ? memberName : 'Member'}, use the 6-digit code below to log into your CBT Member Portal.</div>
        </div>
        <div class="otp-box">${otp}</div>
        <p style="font-size: 13px; color: #64748b; text-align: center;">This code will expire in <strong>10 minutes</strong>. If you did not request this code, please ignore this email.</p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Community Baptist Temple - Olongapo. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `

  // Priority 1: Gmail SMTP (Sends from cbt.olongapo@gmail.com to ANY recipient)
  if (gmailUser && gmailAppPassword) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      })

      await transporter.sendMail({
        from: `CBT Olongapo <${gmailUser}>`,
        to: email,
        subject,
        html: htmlContent,
      })

      return { success: true, provider: 'gmail' }
    } catch (err: any) {
      console.error('[Gmail SMTP Error]', err)
      throw new Error(err.message || 'Failed to send OTP via Gmail SMTP')
    }
  }

  // Priority 2: Resend API (Requires domain verification for third-party recipients)
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey)
      const { data, error } = await resend.emails.send({
        from: resendFromEmail,
        to: [email],
        subject,
        html: htmlContent,
      })

      if (error) {
        console.error('[Resend Error]', error)
        throw new Error(error.message || 'Failed to send OTP email via Resend')
      }

      return { success: true, data, provider: 'resend' }
    } catch (err: any) {
      console.error('[Resend Error]', err)
      throw new Error(err.message || 'Error sending OTP email via Resend')
    }
  }

  // Fallback: Console Dev Mode
  console.log(`\n========================================`)
  console.log(`[DEV OTP MODE] No email provider configured.`)
  console.log(`Recipient: ${email} (${memberName || 'Member'})`)
  console.log(`OTP Code:  ${otp}`)
  console.log(`========================================\n`)
  return { success: true, devMode: true }
}
