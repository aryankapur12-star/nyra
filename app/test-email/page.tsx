'use client';

import { useState } from 'react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  async function sendTestEmail(type: string) {
    if (!email) {
      setResult({ error: 'Please enter your email address' });
      return;
    }
    
    setSending(type);
    setResult(null);
    
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          to: email,
          data: getTestData(type),
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setResult({ success: true });
      } else {
        setResult({ error: data.error || 'Failed to send' });
      }
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setSending(null);
    }
  }

  function getTestData(type: string) {
    switch (type) {
      case 'welcome':
        return { name: 'Aryan', plan: 'Plus' };
      case 'bill_reminder':
        return {
          name: 'Aryan',
          billName: 'Netflix',
          amount: 16.49,
          dueDate: 'April 18, 2026',
          daysUntil: 3,
        };
      case 'payment_confirmation':
        return {
          name: 'Aryan',
          plan: 'Plus',
          amount: 5.65,
          nextBillingDate: 'May 13, 2026',
        };
      case 'weekly_summary':
        return {
          name: 'Aryan',
          stats: {
            billsPaid: 4,
            billsMissed: 0,
            totalPaid: 156.47,
            upcomingCount: 3,
            upcomingTotal: 89.99,
            upcomingBills: [
              { name: 'Netflix', amount: 16.49, dueDate: 'Apr 18' },
              { name: 'Spotify', amount: 11.99, dueDate: 'Apr 20' },
              { name: 'Phone Bill', amount: 61.51, dueDate: 'Apr 22' },
            ],
            streak: 12,
            moneyIQ: 740,
          },
        };
      case 'verification_code':
        return { name: 'Aryan', code: '847291' };
      default:
        return {};
    }
  }

  const emailTypes = [
    { id: 'welcome', name: '🎉 Welcome Email', desc: 'Sent when user signs up' },
    { id: 'bill_reminder', name: '📅 Bill Reminder', desc: 'Sent before bills are due' },
    { id: 'payment_confirmation', name: '✓ Payment Confirmation', desc: 'Sent after Stripe payment' },
    { id: 'weekly_summary', name: '📊 Weekly Summary', desc: 'Weekly stats and upcoming bills' },
    { id: 'verification_code', name: '🔐 Verification Code', desc: 'Phone verification backup' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#eef3fb',
      padding: '40px 20px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        background: 'white',
        borderRadius: 24,
        padding: 40,
        boxShadow: '0 4px 24px rgba(33,119,209,0.08)',
      }}>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '1.8rem',
          fontWeight: 800,
          color: '#0c1524',
          marginBottom: 8,
        }}>
          📧 Email Test Page
        </h1>
        <p style={{ color: '#7a90aa', marginBottom: 28 }}>
          Send test emails to yourself to preview how they look.
        </p>

        {/* Email Input */}
        <div style={{ marginBottom: 28 }}>
          <label style={{
            display: 'block',
            fontSize: '.72rem',
            fontWeight: 700,
            color: '#7a90aa',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
          }}>
            Your Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1.5px solid rgba(33,119,209,0.15)',
              borderRadius: 12,
              fontSize: '.95rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Result Message */}
        {result && (
          <div style={{
            padding: '14px 18px',
            borderRadius: 12,
            marginBottom: 20,
            background: result.success ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${result.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: result.success ? '#22c55e' : '#ef4444',
            fontSize: '.88rem',
            fontWeight: 500,
          }}>
            {result.success ? '✅ Email sent! Check your inbox.' : `❌ ${result.error}`}
          </div>
        )}

        {/* Email Type Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {emailTypes.map(type => (
            <button
              key={type.id}
              onClick={() => sendTestEmail(type.id)}
              disabled={sending !== null}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                border: '1.5px solid rgba(33,119,209,0.12)',
                borderRadius: 14,
                background: sending === type.id ? 'rgba(33,119,209,0.05)' : 'white',
                cursor: sending ? 'not-allowed' : 'pointer',
                opacity: sending && sending !== type.id ? 0.5 : 1,
                transition: 'all .2s',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '.95rem',
                  color: '#0c1524',
                }}>
                  {type.name}
                </div>
                <div style={{ fontSize: '.78rem', color: '#7a90aa', marginTop: 2 }}>
                  {type.desc}
                </div>
              </div>
              <div style={{
                padding: '8px 16px',
                background: '#2177d1',
                color: 'white',
                borderRadius: 8,
                fontSize: '.8rem',
                fontWeight: 600,
              }}>
                {sending === type.id ? 'Sending...' : 'Send'}
              </div>
            </button>
          ))}
        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <a href="/dashboard" style={{
            color: '#7a90aa',
            fontSize: '.85rem',
            textDecoration: 'none',
          }}>
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
