import type { ExpiringBenefit } from './getExpiringBenefits';
import type { DemoUser } from './seeds';

export interface ReminderEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export function buildReminderEmail(user: DemoUser, benefit: ExpiringBenefit): ReminderEmail {
  const daysLabel =
    benefit.daysRemaining < 0
      ? 'has already expired'
      : benefit.daysRemaining === 0
      ? 'expires today'
      : `expires in ${benefit.daysRemaining} day${benefit.daysRemaining === 1 ? '' : 's'}`;

  const subject = `Your ${benefit.name} ${daysLabel}`;

  const text = [
    `Hi ${user.firstName},`,
    '',
    `Your ${benefit.name} ${daysLabel} (${benefit.expiryDate}).`,
    '',
    benefit.description,
    '',
    'Log in to MaxOut to see your options and make the most of your benefits.',
    '',
    '— The MaxOut Team',
  ].join('\n');

  const urgencyColor =
    benefit.urgency === 'expired' ? '#888888' : benefit.urgency === 'critical' ? '#C0392B' : '#E67E22';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${subject}</title></head>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1F1A1C">
  <div style="background:#650030;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:22px">MaxOut Dental</h1>
  </div>
  <div style="border:1px solid #D9CEC6;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p>Hi ${user.firstName},</p>
    <div style="background:${urgencyColor}15;border-left:4px solid ${urgencyColor};padding:12px 16px;border-radius:4px;margin:16px 0">
      <strong style="color:${urgencyColor}">${benefit.name}</strong>
      <p style="margin:4px 0 0;color:#333">${daysLabel.charAt(0).toUpperCase() + daysLabel.slice(1)} — ${benefit.expiryDate}</p>
    </div>
    <p>${benefit.description}</p>
    <p>Log in to MaxOut to see your options and make the most of your benefits.</p>
    <p style="color:#888;font-size:12px;margin-top:32px">— The MaxOut Team</p>
  </div>
</body>
</html>`;

  return { to: user.email, subject, text, html };
}

/**
 * Send (or preview) a benefit reminder.
 * DEMO_MODE=true  → logs to console and returns the email object for in-app preview.
 * DEMO_MODE=false → would call SMTP (not wired in the mobile app; use the backend/Lambda).
 */
export async function sendBenefitReminder(
  user: DemoUser,
  benefit: ExpiringBenefit,
): Promise<ReminderEmail> {
  const email = buildReminderEmail(user, benefit);

  // Always log — useful in dev and for the demo.
  console.log('[BenefitReminder] DEMO preview:', JSON.stringify({ to: email.to, subject: email.subject }, null, 2));

  return email;
}
