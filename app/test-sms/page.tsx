'use client';

import { useState } from 'react';

export default function TestSMSPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  async function sendCode() {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/sms/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+1' + phone.replace(/\D/g, '') }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send code');
      }

      setMessage('Code sent! Check your phone.');
      setStep('code');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/sms/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: '+1' + phone.replace(/\D/g, ''),
          code: code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify code');
      }

      setMessage('✅ Phone verified successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#eef3fb',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '24px', color: '#0c1524' }}>
          📱 SMS Verification Test
        </h1>
        <p style={{ margin: '0 0 24px', color: '#7a90aa', fontSize: '14px' }}>
          Test the Twilio SMS integration
        </p>

        {step === 'phone' ? (
          <>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: '#7a90aa', textTransform: 'uppercase' }}>
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="(416) 555-0123"
              value={formatPhone(phone)}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                outline: 'none',
                marginBottom: '16px',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={sendCode}
              disabled={phone.length < 10 || loading}
              style={{
                width: '100%',
                padding: '14px',
                background: phone.length >= 10 ? '#2177d1' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: phone.length >= 10 ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Sending...' : 'Send Verification Code →'}
            </button>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ color: '#7a90aa', fontSize: '14px' }}>Code sent to</div>
              <div style={{ fontWeight: 700, color: '#0c1524' }}>+1 {formatPhone(phone)}</div>
            </div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: '#7a90aa', textTransform: 'uppercase' }}>
              6-Digit Code
            </label>
            <input
              type="text"
              placeholder="123456"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '24px',
                fontWeight: 700,
                textAlign: 'center',
                letterSpacing: '8px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                outline: 'none',
                marginBottom: '16px',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={verifyCode}
              disabled={code.length !== 6 || loading}
              style={{
                width: '100%',
                padding: '14px',
                background: code.length === 6 ? '#2177d1' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: code.length === 6 ? 'pointer' : 'not-allowed',
                marginBottom: '12px',
              }}
            >
              {loading ? 'Verifying...' : 'Verify Code →'}
            </button>
            <button
              onClick={() => { setStep('phone'); setCode(''); setError(''); setMessage(''); }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#7a90aa',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              ← Change Number
            </button>
          </>
        )}

        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            color: '#16a34a',
            fontSize: '14px',
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
