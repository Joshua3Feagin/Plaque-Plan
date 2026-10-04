#!/usr/bin/env node
/**
 * Demo outbox script — run from the repo root:
 *   node scripts/send-reminders-demo.js
 *
 * DEMO_MODE=true (default): writes HTML files to outbox/ and logs previews.
 * DEMO_MODE=false + SMTP vars set: sends real email via nodemailer.
 *
 * Required for real sending (set in .env):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL
 */

require('dotenv').config({ path: './apps/mobile/.env' });
const fs = require('fs');
const path = require('path');

const DEMO_MODE = process.env.DEMO_MODE !== 'false';
const DEMO_TODAY = '2025-11-10';

const DEMO_USER = { firstName: 'Sam', email: 'sam.rivera@example.com' };

const BENEFITS = [
  { id: 'flex-spend', name: 'Flexible Spending Account', description: 'Use your remaining FSA balance.', expiryDate: '2025-11-13' },
  { id: 'dental-max', name: 'Dental Annual Maximum', description: '$900 of your $2,000 annual max is unused.', expiryDate: '2025-11-24' },
  { id: 'vision', name: 'Vision Benefit', description: 'Annual eye exam and frames allowance.', expiryDate: '2025-11-05' },
];

function getExpiring(withinDays = 30) {
  const ref = new Date(DEMO_TODAY);
  return BENEFITS
    .map(b => {
      const expiry = new Date(b.expiryDate);
      const daysRemaining = Math.ceil((expiry - ref) / 86400000);
      const urgency = daysRemaining < 0 ? 'expired' : daysRemaining <= 7 ? 'critical' : 'warning';
      return { ...b, daysRemaining, urgency };
    })
    .filter(b => b.daysRemaining <= withinDays)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

function buildEmail(user, benefit) {
  const daysLabel = benefit.daysRemaining < 0 ? 'has already expired'
    : benefit.daysRemaining === 0 ? 'expires today'
    : `expires in ${benefit.daysRemaining} day${benefit.daysRemaining === 1 ? '' : 's'}`;

  const subject = `Your ${benefit.name} ${daysLabel}`;
  const urgencyColor = benefit.urgency === 'expired' ? '#888888' : benefit.urgency === 'critical' ? '#C0392B' : '#E67E22';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${subject}</title></head>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1F1A1C">
  <div style="background:#650030;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:22px">MaxOut Dental</h1>
  </div>
  <div style="border:1px solid #D9CEC6;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p>Hi ${user.firstName},</p>
    <div style="background:${urgencyColor}22;border-left:4px solid ${urgencyColor};padding:12px 16px;border-radius:4px;margin:16px 0">
      <strong style="color:${urgencyColor}">${benefit.name}</strong>
      <p style="margin:4px 0 0;color:#333">${daysLabel.charAt(0).toUpperCase() + daysLabel.slice(1)} — ${benefit.expiryDate}</p>
    </div>
    <p>${benefit.description}</p>
    <p>Log in to MaxOut to see your options.</p>
    <p style="color:#888;font-size:12px;margin-top:32px">— The MaxOut Team</p>
  </div>
</body></html>`;

  return { to: user.email, subject, html };
}

async function sendAll() {
  const expiring = getExpiring(30).filter(b => b.urgency !== 'expired');
  console.log(`\n[BenefitReminders] Found ${expiring.length} benefit(s) expiring soon.\n`);

  for (const benefit of expiring) {
    const email = buildEmail(DEMO_USER, benefit);
    console.log(`  → To: ${email.to}`);
    console.log(`    Subject: ${email.subject}`);

    if (DEMO_MODE) {
      const outDir = path.join(__dirname, '..', 'outbox');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const filename = path.join(outDir, `${benefit.id}-${Date.now()}.html`);
      fs.writeFileSync(filename, email.html, 'utf8');
      console.log(`    [DEMO] Written to ${filename}\n`);
    } else {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({ from: process.env.FROM_EMAIL, to: email.to, subject: email.subject, html: email.html });
        console.log(`    [SENT] Email delivered.\n`);
      } catch (err) {
        console.error(`    [ERROR] Failed to send: ${err.message}\n`);
      }
    }
  }
  console.log('[BenefitReminders] Done.\n');
}

sendAll();
