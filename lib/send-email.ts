// ═══════════════════════════════════════════════════════════════════════════════
// NYRA EMAIL HELPERS
// /lib/send-email.ts
// Easy-to-use functions for sending emails from anywhere in the app
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = '/api/send-email';

// ─── Send Welcome Email ──────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string, plan: string) {
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'welcome',
      to,
      data: { name, plan },
    }),
  }).then(res => res.json());
}

// ─── Send Bill Reminder Email ────────────────────────────────────────────────
export async function sendBillReminderEmail(
  to: string,
  name: string,
  billName: string,
  amount: number,
  dueDate: string,
  daysUntil: number
) {
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'bill_reminder',
      to,
      data: { name, billName, amount, dueDate, daysUntil },
    }),
  }).then(res => res.json());
}

// ─── Send Payment Confirmation Email ─────────────────────────────────────────
export async function sendPaymentConfirmationEmail(
  to: string,
  name: string,
  plan: string,
  amount: number,
  nextBillingDate: string
) {
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'payment_confirmation',
      to,
      data: { name, plan, amount, nextBillingDate },
    }),
  }).then(res => res.json());
}

// ─── Send Weekly Summary Email ───────────────────────────────────────────────
export async function sendWeeklySummaryEmail(
  to: string,
  name: string,
  stats: {
    billsPaid: number;
    billsMissed: number;
    totalPaid: number;
    upcomingCount: number;
    upcomingTotal: number;
    upcomingBills: { name: string; amount: number; dueDate: string }[];
    streak: number;
    moneyIQ: number;
  }
) {
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'weekly_summary',
      to,
      data: { name, stats },
    }),
  }).then(res => res.json());
}

// ─── Send Verification Code Email ────────────────────────────────────────────
export async function sendVerificationCodeEmail(to: string, name: string, code: string) {
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'verification_code',
      to,
      data: { name, code },
    }),
  }).then(res => res.json());
}

export default {
  sendWelcomeEmail,
  sendBillReminderEmail,
  sendPaymentConfirmationEmail,
  sendWeeklySummaryEmail,
  sendVerificationCodeEmail,
};
