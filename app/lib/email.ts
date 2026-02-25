import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Executive AI <onboarding@resend.dev>";

function getClient(): Resend | null {
  if (!resendApiKey?.trim()) return null;
  return new Resend(resendApiKey);
}

export function isEmailConfigured(): boolean {
  return !!resendApiKey?.trim();
}

/**
 * Send a welcome email to a new user. Does not throw; logs errors.
 * Call after successful account creation. Requires RESEND_API_KEY (and optionally RESEND_FROM_EMAIL).
 */
export async function sendWelcomeEmail(name: string, email: string): Promise<void> {
  const client = getClient();
  if (!client) {
    return;
  }

  const displayName = name?.trim() || "there";
  const dashboardUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://app.example.com";
  const loginUrl = `${dashboardUrl}/login`;

  const html = getWelcomeEmailHtml(displayName, loginUrl);

  try {
    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: "You're in — welcome to Executive AI",
      html,
    });
  } catch (err) {
    console.error("Welcome email failed", err instanceof Error ? err.message : String(err));
  }
}

function getWelcomeEmailHtml(displayName: string, loginUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Executive AI</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color:#ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 40px 32px; text-align: center;">
              <h1 style="margin:0; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">Executive AI</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #94a3b8;">Full power of AI, safely.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 32px;">
              <h2 style="margin:0 0 16px; font-size: 22px; font-weight: 600; color: #0f172a; line-height: 1.3;">Hi ${escapeHtml(displayName)},</h2>
              <p style="margin:0 0 24px; font-size: 16px; line-height: 1.6; color: #475569;">Your account is ready. You can sign in anytime to access your dashboard, projects, and to-do — all in one place.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 10px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    <a href="${escapeHtml(loginUrl)}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">Go to your dashboard</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 28px 0 0; font-size: 14px; line-height: 1.5; color: #64748b;">If you have any questions, just reply to this email. We’re here to help.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; border-top: 1px solid #e2e8f0;">
              <p style="margin:0; font-size: 12px; color: #94a3b8; text-align: center;">You’re receiving this because you signed up for Executive AI.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
