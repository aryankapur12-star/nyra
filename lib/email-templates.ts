// ═══════════════════════════════════════════════════════════════════════════════
// NYRA EMAIL TEMPLATES
// Beautiful, responsive email templates matching Nyra's brand
// ═══════════════════════════════════════════════════════════════════════════════

const BRAND = {
  blue: '#2177d1',
  blueDark: '#1658a8',
  gold: '#c39a35',
  text: '#0c1524',
  text2: '#3a4f6a',
  muted: '#7a90aa',
  bg: '#eef3fb',
  white: '#ffffff',
};

// Base wrapper for all emails
function emailWrapper(content: string, preheader: string = ''): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Nyra</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body { margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    table { border-collapse: collapse; }
    img { max-width: 100%; height: auto; }
    a { color: ${BRAND.blue}; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 20px !important; }
      .content { padding: 28px 24px !important; }
      .btn { padding: 14px 28px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.bg};">
  <!-- Preheader text (hidden) -->
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: ${BRAND.bg};">
    ${preheader}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.bg};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="container" width="580" cellpadding="0" cellspacing="0">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 28px; font-weight: 800; color: ${BRAND.blue}; letter-spacing: -0.03em;">
                    Nyra
                  </td>
                  <td style="padding-left: 4px; padding-bottom: 8px;">
                    <div style="width: 8px; height: 8px; background: ${BRAND.gold}; border-radius: 50%;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND.white}; border-radius: 24px; box-shadow: 0 4px 24px rgba(33,119,209,0.08);">
                <!-- Gold accent line -->
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, ${BRAND.blue}, ${BRAND.gold}, ${BRAND.blue}); border-radius: 24px 24px 0 0;"></td>
                </tr>
                <tr>
                  <td class="content" style="padding: 40px 44px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 13px; color: ${BRAND.muted}; line-height: 1.7; padding-bottom: 16px;">
                    💙 20% of Nyra profits support <a href="https://financialfutureseducation.com" style="color: ${BRAND.gold}; font-weight: 600;">Financial Futures Education</a>
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: ${BRAND.muted}; line-height: 1.6;">
                    Nyra · Made with care in Canada 🇨🇦<br>
                    <a href="https://nyra-nu.vercel.app/settings" style="color: ${BRAND.muted};">Manage preferences</a> · 
                    <a href="https://nyra-nu.vercel.app/settings" style="color: ${BRAND.muted};">Unsubscribe</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// Button component
function emailButton(text: string, url: string, style: 'primary' | 'secondary' = 'primary'): string {
  const bg = style === 'primary' ? BRAND.blue : 'transparent';
  const color = style === 'primary' ? BRAND.white : BRAND.blue;
  const border = style === 'primary' ? BRAND.blue : BRAND.blue;
  
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
      <tr>
        <td style="border-radius: 12px; background: ${bg}; border: 2px solid ${border};">
          <a href="${url}" class="btn" style="display: inline-block; padding: 14px 32px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700; color: ${color}; text-decoration: none;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. WELCOME EMAIL
// ═══════════════════════════════════════════════════════════════════════════════
export function welcomeEmail(name: string, plan: string): { subject: string; html: string } {
  const content = `
    <!-- Welcome Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, ${BRAND.blue}, #6366f1); border-radius: 20px; line-height: 80px; font-size: 36px;">
        🎉
      </div>
    </div>
    
    <!-- Heading -->
    <h1 style="margin: 0 0 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 28px; font-weight: 800; color: ${BRAND.text}; text-align: center; letter-spacing: -0.02em;">
      Welcome to Nyra, ${name}!
    </h1>
    <p style="margin: 0 0 32px; font-size: 16px; color: ${BRAND.text2}; text-align: center; line-height: 1.7;">
      You're all set up on the <strong style="color: ${BRAND.blue};">${plan} Plan</strong>. Let's make sure you never miss a bill again.
    </p>
    
    <!-- What's Next Section -->
    <div style="background: ${BRAND.bg}; border-radius: 16px; padding: 24px; margin-bottom: 28px;">
      <h2 style="margin: 0 0 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; color: ${BRAND.text};">
        🚀 Get started in 3 steps:
      </h2>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(33,119,209,0.1);">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width: 32px; height: 32px; background: ${BRAND.blue}; border-radius: 50%; text-align: center; color: white; font-weight: 700; font-size: 14px; line-height: 32px;">1</td>
                <td style="padding-left: 14px; font-size: 14px; color: ${BRAND.text2};">
                  <strong style="color: ${BRAND.text};">Add your bills</strong> — rent, subscriptions, utilities
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(33,119,209,0.1);">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width: 32px; height: 32px; background: ${BRAND.blue}; border-radius: 50%; text-align: center; color: white; font-weight: 700; font-size: 14px; line-height: 32px;">2</td>
                <td style="padding-left: 14px; font-size: 14px; color: ${BRAND.text2};">
                  <strong style="color: ${BRAND.text};">Set reminder timing</strong> — choose when to get notified
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width: 32px; height: 32px; background: ${BRAND.blue}; border-radius: 50%; text-align: center; color: white; font-weight: 700; font-size: 14px; line-height: 32px;">3</td>
                <td style="padding-left: 14px; font-size: 14px; color: ${BRAND.text2};">
                  <strong style="color: ${BRAND.text};">Relax</strong> — we'll text you before each bill is due
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 28px;">
      ${emailButton('Go to My Dashboard →', 'https://nyra-nu.vercel.app/dashboard')}
    </div>
    
    <!-- Help Note -->
    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, rgba(33,119,209,0.05), rgba(195,154,53,0.03)); border-radius: 12px;">
      <p style="margin: 0; font-size: 14px; color: ${BRAND.text2};">
        Questions? Reply to this email or chat with <strong style="color: ${BRAND.gold};">Nyra AI</strong> in your dashboard.
      </p>
    </div>
  `;
  
  return {
    subject: `Welcome to Nyra, ${name}! 🎉`,
    html: emailWrapper(content, `You're all set up on the ${plan} Plan. Let's make sure you never miss a bill.`),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. BILL REMINDER EMAIL
// ═══════════════════════════════════════════════════════════════════════════════
export function billReminderEmail(
  name: string,
  billName: string,
  amount: number,
  dueDate: string,
  daysUntil: number
): { subject: string; html: string } {
  const urgency = daysUntil <= 1 ? 'urgent' : daysUntil <= 3 ? 'soon' : 'upcoming';
  const urgencyColor = urgency === 'urgent' ? '#ef4444' : urgency === 'soon' ? '#f59e0b' : BRAND.blue;
  const urgencyBg = urgency === 'urgent' ? 'rgba(239,68,68,0.08)' : urgency === 'soon' ? 'rgba(245,158,11,0.08)' : BRAND.bg;
  const urgencyText = urgency === 'urgent' ? '🚨 Due Tomorrow!' : urgency === 'soon' ? `⏰ Due in ${daysUntil} days` : `📅 Due in ${daysUntil} days`;
  
  const content = `
    <!-- Urgency Badge -->
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; padding: 8px 18px; background: ${urgencyBg}; border: 1px solid ${urgencyColor}20; border-radius: 100px; font-size: 14px; font-weight: 700; color: ${urgencyColor};">
        ${urgencyText}
      </span>
    </div>
    
    <!-- Greeting -->
    <h1 style="margin: 0 0 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 800; color: ${BRAND.text}; text-align: center;">
      Hey ${name}, heads up! 👋
    </h1>
    <p style="margin: 0 0 28px; font-size: 15px; color: ${BRAND.text2}; text-align: center; line-height: 1.6;">
      Your <strong>${billName}</strong> bill is coming up.
    </p>
    
    <!-- Bill Card -->
    <div style="background: ${BRAND.bg}; border-radius: 16px; padding: 24px; margin-bottom: 24px; border-left: 4px solid ${urgencyColor};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size: 13px; color: ${BRAND.muted}; margin-bottom: 4px;">BILL NAME</div>
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 700; color: ${BRAND.text};">${billName}</div>
          </td>
          <td style="text-align: right;">
            <div style="font-size: 13px; color: ${BRAND.muted}; margin-bottom: 4px;">AMOUNT</div>
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 28px; font-weight: 800; color: ${BRAND.blue};">$${amount.toFixed(2)}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top: 16px; border-top: 1px solid rgba(33,119,209,0.1); margin-top: 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size: 14px; color: ${BRAND.text2};">
                  📅 <strong>Due:</strong> ${dueDate}
                </td>
                <td style="text-align: right; font-size: 14px; color: ${urgencyColor}; font-weight: 600;">
                  ${daysUntil === 0 ? 'Due Today!' : daysUntil === 1 ? 'Due Tomorrow' : `${daysUntil} days left`}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- CTA Buttons -->
    <div style="text-align: center; margin-bottom: 24px;">
      ${emailButton('Mark as Paid ✓', 'https://nyra-nu.vercel.app/dashboard')}
    </div>
    
    <!-- Tip -->
    <div style="text-align: center; padding: 16px; background: rgba(195,154,53,0.06); border-radius: 10px;">
      <p style="margin: 0; font-size: 13px; color: ${BRAND.text2};">
        💡 <strong>Tip:</strong> Set up auto-pay to never worry about this bill again.
      </p>
    </div>
  `;
  
  const subjectPrefix = urgency === 'urgent' ? '🚨' : urgency === 'soon' ? '⏰' : '📅';
  
  return {
    subject: `${subjectPrefix} ${billName} is due ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`} — $${amount.toFixed(2)}`,
    html: emailWrapper(content, `Your ${billName} bill ($${amount.toFixed(2)}) is due ${dueDate}. Don't forget to pay!`),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PAYMENT CONFIRMATION EMAIL
// ═══════════════════════════════════════════════════════════════════════════════
export function paymentConfirmationEmail(
  name: string,
  plan: string,
  amount: number,
  nextBillingDate: string
): { subject: string; html: string } {
  const content = `
    <!-- Success Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 72px; height: 72px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 50%; line-height: 72px; font-size: 32px;">
        ✓
      </div>
    </div>
    
    <!-- Heading -->
    <h1 style="margin: 0 0 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 26px; font-weight: 800; color: ${BRAND.text}; text-align: center;">
      Payment Successful! 🎉
    </h1>
    <p style="margin: 0 0 28px; font-size: 15px; color: ${BRAND.text2}; text-align: center; line-height: 1.6;">
      Thanks ${name}! Your Nyra subscription is active.
    </p>
    
    <!-- Receipt Card -->
    <div style="background: ${BRAND.bg}; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700; color: ${BRAND.muted}; letter-spacing: 0.08em;">
        RECEIPT
      </h2>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(33,119,209,0.1); font-size: 14px; color: ${BRAND.text2};">Plan</td>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(33,119,209,0.1); font-size: 14px; color: ${BRAND.text}; font-weight: 600; text-align: right;">Nyra ${plan}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(33,119,209,0.1); font-size: 14px; color: ${BRAND.text2};">Amount</td>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(33,119,209,0.1); font-size: 14px; color: ${BRAND.text}; font-weight: 600; text-align: right;">$${amount.toFixed(2)} CAD</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(33,119,209,0.1); font-size: 14px; color: ${BRAND.text2};">Billing cycle</td>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(33,119,209,0.1); font-size: 14px; color: ${BRAND.text}; font-weight: 600; text-align: right;">Monthly</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-size: 14px; color: ${BRAND.text2};">Next billing</td>
          <td style="padding: 10px 0; font-size: 14px; color: ${BRAND.text}; font-weight: 600; text-align: right;">${nextBillingDate}</td>
        </tr>
      </table>
    </div>
    
    <!-- Impact Note -->
    <div style="text-align: center; padding: 18px; background: linear-gradient(135deg, rgba(33,119,209,0.05), rgba(195,154,53,0.05)); border-radius: 12px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: ${BRAND.text2};">
        💙 <strong style="color: ${BRAND.gold};">$${(amount * 0.2).toFixed(2)}</strong> of your payment is going to Financial Futures Education to help Canadian youth learn financial literacy.
      </p>
    </div>
    
    <!-- CTA -->
    <div style="text-align: center;">
      ${emailButton('View My Dashboard', 'https://nyra-nu.vercel.app/dashboard')}
    </div>
  `;
  
  return {
    subject: `✓ Payment received — Nyra ${plan} is active`,
    html: emailWrapper(content, `Your $${amount.toFixed(2)} payment was successful. Nyra ${plan} is now active.`),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. WEEKLY SUMMARY EMAIL
// ═══════════════════════════════════════════════════════════════════════════════
export function weeklySummaryEmail(
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
): { subject: string; html: string } {
  const { billsPaid, billsMissed, totalPaid, upcomingCount, upcomingTotal, upcomingBills, streak, moneyIQ } = stats;
  const successRate = billsPaid + billsMissed > 0 ? Math.round((billsPaid / (billsPaid + billsMissed)) * 100) : 100;
  
  const content = `
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="font-size: 14px; color: ${BRAND.muted}; margin-bottom: 8px;">📊 WEEKLY SUMMARY</div>
      <h1 style="margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 26px; font-weight: 800; color: ${BRAND.text};">
        Hey ${name}, here's your week!
      </h1>
    </div>
    
    <!-- Stats Grid -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="width: 50%; padding: 12px;">
          <div style="background: ${BRAND.bg}; border-radius: 14px; padding: 18px; text-align: center;">
            <div style="font-size: 32px; font-weight: 800; color: #22c55e; font-family: 'Plus Jakarta Sans', sans-serif;">${billsPaid}</div>
            <div style="font-size: 13px; color: ${BRAND.muted};">Bills Paid ✓</div>
          </div>
        </td>
        <td style="width: 50%; padding: 12px;">
          <div style="background: ${BRAND.bg}; border-radius: 14px; padding: 18px; text-align: center;">
            <div style="font-size: 32px; font-weight: 800; color: ${BRAND.blue}; font-family: 'Plus Jakarta Sans', sans-serif;">$${totalPaid.toFixed(0)}</div>
            <div style="font-size: 13px; color: ${BRAND.muted};">Total Paid</div>
          </div>
        </td>
      </tr>
      <tr>
        <td style="width: 50%; padding: 12px;">
          <div style="background: ${BRAND.bg}; border-radius: 14px; padding: 18px; text-align: center;">
            <div style="font-size: 32px; font-weight: 800; color: ${BRAND.gold}; font-family: 'Plus Jakarta Sans', sans-serif;">${streak}</div>
            <div style="font-size: 13px; color: ${BRAND.muted};">Day Streak 🔥</div>
          </div>
        </td>
        <td style="width: 50%; padding: 12px;">
          <div style="background: ${BRAND.bg}; border-radius: 14px; padding: 18px; text-align: center;">
            <div style="font-size: 32px; font-weight: 800; color: ${BRAND.text}; font-family: 'Plus Jakarta Sans', sans-serif;">${moneyIQ}</div>
            <div style="font-size: 13px; color: ${BRAND.muted};">Money IQ</div>
          </div>
        </td>
      </tr>
    </table>
    
    <!-- Coming Up Section -->
    ${upcomingBills.length > 0 ? `
    <div style="background: linear-gradient(135deg, rgba(33,119,209,0.05), rgba(195,154,53,0.03)); border: 1px solid rgba(33,119,209,0.1); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 14px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700; color: ${BRAND.text};">
        📅 Coming up this week
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${upcomingBills.slice(0, 4).map(bill => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid rgba(33,119,209,0.08);">
            <span style="font-size: 14px; color: ${BRAND.text}; font-weight: 500;">${bill.name}</span>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid rgba(33,119,209,0.08); text-align: right;">
            <span style="font-size: 14px; color: ${BRAND.blue}; font-weight: 700;">$${bill.amount.toFixed(2)}</span>
            <span style="font-size: 12px; color: ${BRAND.muted}; margin-left: 8px;">${bill.dueDate}</span>
          </td>
        </tr>
        `).join('')}
      </table>
      <div style="margin-top: 14px; font-size: 14px; color: ${BRAND.text2};">
        <strong style="color: ${BRAND.text};">Total upcoming:</strong> $${upcomingTotal.toFixed(2)} across ${upcomingCount} bills
      </div>
    </div>
    ` : ''}
    
    <!-- Success Rate -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 14px; color: ${BRAND.muted}; margin-bottom: 6px;">Your payment success rate</div>
      <div style="font-size: 42px; font-weight: 800; color: ${successRate >= 90 ? '#22c55e' : successRate >= 70 ? '#f59e0b' : '#ef4444'}; font-family: 'Plus Jakarta Sans', sans-serif;">
        ${successRate}%
      </div>
      <div style="font-size: 13px; color: ${BRAND.muted};">
        ${successRate >= 90 ? '🏆 Excellent! Keep it up!' : successRate >= 70 ? '👍 Good job, room to improve!' : '💪 You can do better!'}
      </div>
    </div>
    
    <!-- CTA -->
    <div style="text-align: center;">
      ${emailButton('View Full Dashboard', 'https://nyra-nu.vercel.app/dashboard')}
    </div>
  `;
  
  return {
    subject: `📊 Your week: ${billsPaid} bills paid, $${totalPaid.toFixed(0)} total`,
    html: emailWrapper(content, `This week you paid ${billsPaid} bills totaling $${totalPaid.toFixed(2)}. ${upcomingCount} bills coming up.`),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. PHONE VERIFICATION CODE EMAIL (backup if SMS fails)
// ═══════════════════════════════════════════════════════════════════════════════
export function verificationCodeEmail(name: string, code: string): { subject: string; html: string } {
  const content = `
    <!-- Icon -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background: ${BRAND.bg}; border-radius: 16px; line-height: 64px; font-size: 28px;">
        🔐
      </div>
    </div>
    
    <!-- Heading -->
    <h1 style="margin: 0 0 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 800; color: ${BRAND.text}; text-align: center;">
      Your verification code
    </h1>
    <p style="margin: 0 0 28px; font-size: 15px; color: ${BRAND.text2}; text-align: center;">
      Hi ${name}, use this code to verify your phone number:
    </p>
    
    <!-- Code Box -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background: ${BRAND.bg}; border: 2px dashed rgba(33,119,209,0.3); border-radius: 14px; padding: 20px 40px;">
        <div style="font-family: 'Plus Jakarta Sans', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: ${BRAND.blue};">
          ${code}
        </div>
      </div>
    </div>
    
    <!-- Expiry Note -->
    <p style="margin: 0; font-size: 13px; color: ${BRAND.muted}; text-align: center;">
      This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
    </p>
  `;
  
  return {
    subject: `${code} is your Nyra verification code`,
    html: emailWrapper(content, `Your Nyra verification code is ${code}. It expires in 10 minutes.`),
  };
}

export default {
  welcomeEmail,
  billReminderEmail,
  paymentConfirmationEmail,
  weeklySummaryEmail,
  verificationCodeEmail,
};
