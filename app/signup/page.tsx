'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const PLAN_DETAILS: Record<string, { sub: string; bills: number | string }> = {
  Basic: { sub: 'Up to 5 bills tracked',  bills: 5 },
  Plus:  { sub: 'Up to 15 bills tracked', bills: 15 },
  Power: { sub: 'Unlimited bills',        bills: '∞' },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const searchParams = useSearchParams();
  const plan  = searchParams.get('plan')  || 'Plus';
  const price = parseInt(searchParams.get('price') || '5');

  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState<FormData>({ firstName: '', lastName: '', email: '', phone: '' });

  const planInfo = PLAN_DETAILS[plan] ?? PLAN_DETAILS.Plus;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const step1Valid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.includes('@') &&
    form.phone.trim().length >= 10;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function goStep(n: number) {
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submitToStripe() {
    setLoading(true);
    try {
      // 1. Create Supabase auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: Math.random().toString(36) + Math.random().toString(36),
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed, please try again.');

      const userId = authData.user.id;

      // 2. Insert profile
      await supabase.from('profiles').insert({
        id: userId,
        full_name: `${form.firstName} ${form.lastName}`,
        phone_number: form.phone,
      });

      // 3. Create Stripe checkout session
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          plan,
          price,
          name: `${form.firstName} ${form.lastName}`,
          successUrl: `/welcome?name=${encodeURIComponent(form.firstName)}&plan=${encodeURIComponent(plan)}&price=${price}`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Could not create checkout session');
      }
    } catch (err: any) {
      alert('Something went wrong: ' + err.message);
      setLoading(false);
    }
  }

  // ── Progress bar width ─────────────────────────────────────────────────────
  const progressPct = { 1: 33, 2: 66, 3: 100 }[step] ?? 33;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');

        :root {
          --blue:#2177d1;--blue-d:#1658a8;--blue-m:#3a8ee0;
          --blue-pale:rgba(33,119,209,0.08);--blue-glow:rgba(33,119,209,0.18);
          --gold:#c39a35;--gold-pale:rgba(195,154,53,0.09);
          --bg:#eef3fb;--text:#0c1524;--text2:#3a4f6a;--muted:#7a90aa;
          --border:rgba(33,119,209,0.1);
          --glass:rgba(255,255,255,0.62);--glass2:rgba(255,255,255,0.8);
          --gb:rgba(255,255,255,0.86);
          --gs:0 4px 24px rgba(33,119,209,0.09),0 1px 4px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,0.9);
          --gsl:0 20px 70px rgba(33,119,209,0.15),0 6px 20px rgba(0,0,0,0.07),inset 0 1px 0 rgba(255,255,255,0.9);
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;min-height:100vh;overflow-x:hidden;line-height:1.6;}

        .bg-blob{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
        .b1{width:600px;height:600px;background:radial-gradient(circle,rgba(33,119,209,0.1) 0%,transparent 70%);top:-150px;left:-150px;animation:bd1 20s ease-in-out infinite;}
        .b2{width:450px;height:450px;background:radial-gradient(circle,rgba(195,154,53,0.07) 0%,transparent 70%);bottom:5%;right:-80px;animation:bd2 25s ease-in-out infinite;}
        @keyframes bd1{0%,100%{transform:translate(0,0)}50%{transform:translate(50px,60px)}}
        @keyframes bd2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,-40px)}}

        /* NAV */
        .su-nav{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:200;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 20px;height:50px;width:calc(100% - 48px);max-width:800px;
          background:var(--glass);backdrop-filter:blur(28px) saturate(2);-webkit-backdrop-filter:blur(28px) saturate(2);
          border:1px solid var(--gb);border-radius:100px;box-shadow:var(--gs);}
        .logo{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.15rem;letter-spacing:-.03em;color:var(--blue);text-decoration:none;}
        .logo-gem{display:inline-block;width:5px;height:5px;background:var(--gold);border-radius:50%;margin-left:2px;margin-bottom:5px;box-shadow:0 0 8px var(--gold);vertical-align:middle;animation:gp 3s ease infinite;}
        @keyframes gp{0%,100%{box-shadow:0 0 6px var(--gold);}50%{box-shadow:0 0 16px var(--gold),0 0 28px rgba(195,154,53,.3);}}
        .nav-back{font-size:.8rem;font-weight:500;color:var(--text2);text-decoration:none;padding:7px 14px;border-radius:100px;transition:background .2s,color .2s;display:flex;align-items:center;gap:5px;}
        .nav-back:hover{background:var(--blue-pale);color:var(--blue);}

        /* LAYOUT */
        .su-page{position:relative;z-index:1;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:80px 20px 40px;}
        .signup-wrap{width:100%;max-width:600px;}

        /* PROGRESS */
        .progress-track{height:4px;background:rgba(33,119,209,0.1);border-radius:100px;margin-bottom:32px;overflow:hidden;}
        .progress-fill{height:100%;background:linear-gradient(90deg,var(--blue),var(--gold));border-radius:100px;transition:width .5s cubic-bezier(.34,1.56,.64,1);}

        /* STEP LABELS */
        .step-labels{display:flex;justify-content:space-between;margin-bottom:40px;align-items:center;}
        .step-label{display:flex;flex-direction:column;align-items:center;gap:5px;}
        .step-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-size:.68rem;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;
          border:2px solid rgba(33,119,209,0.2);background:rgba(255,255,255,0.5);
          color:var(--muted);transition:all .4s;}
        .step-dot.active{border-color:var(--blue);background:var(--blue);color:white;box-shadow:0 4px 14px var(--blue-glow);}
        .step-dot.done{border-color:var(--blue);background:var(--blue-pale);color:var(--blue);}
        .step-name{font-size:.6rem;font-weight:500;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;transition:color .3s;}
        .step-label.active .step-name{color:var(--blue);}
        .step-connector{flex:1;height:1px;background:rgba(33,119,209,0.15);max-width:80px;}

        /* CARD */
        .card{background:var(--glass);backdrop-filter:blur(28px) saturate(2);-webkit-backdrop-filter:blur(28px) saturate(2);
          border:1px solid var(--gb);border-radius:28px;padding:44px 48px;box-shadow:var(--gsl);
          position:relative;overflow:hidden;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,var(--blue),var(--gold),var(--blue),transparent);}

        /* Plan chip */
        .plan-chip{display:inline-flex;align-items:center;gap:8px;
          background:var(--blue-pale);border:1px solid rgba(33,119,209,0.18);border-radius:100px;
          padding:6px 16px;font-size:.75rem;font-weight:600;color:var(--blue);margin-bottom:28px;}
        .chip-dot{width:5px;height:5px;background:var(--gold);border-radius:50%;box-shadow:0 0 7px var(--gold);animation:gp 2.5s ease infinite;}

        .card-eyebrow{font-size:.62rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;display:flex;align-items:center;gap:10px;}
        .card-eyebrow::before{content:'';width:16px;height:1.5px;background:var(--gold);opacity:.5;}
        .card-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.85rem;letter-spacing:-.03em;color:var(--text);margin-bottom:6px;line-height:1.1;}
        .card-sub{font-size:.86rem;color:var(--text2);margin-bottom:32px;}

        /* FORM */
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .fg{margin-bottom:14px;}
        .fg label{display:block;font-size:.63rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:7px;}
        .fg input{
          width:100%;background:rgba(255,255,255,0.72);backdrop-filter:blur(12px);
          border:1.5px solid rgba(33,119,209,0.13);border-radius:12px;padding:13px 15px;
          font-family:'Inter',sans-serif;font-size:.9rem;font-weight:400;color:var(--text);outline:none;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.9);transition:border-color .2s,box-shadow .2s,background .2s;}
        .fg input:focus{border-color:var(--blue);background:rgba(255,255,255,.88);box-shadow:0 0 0 3px var(--blue-pale),inset 0 1px 0 rgba(255,255,255,.9);}
        .fg input::placeholder{color:var(--muted);}
        .phone-note{font-size:.73rem;color:var(--muted);margin-top:5px;display:flex;align-items:center;gap:5px;}

        /* BUTTONS */
        .next-btn{display:flex;align-items:center;justify-content:center;gap:8px;
          width:100%;background:var(--blue);color:white;border:none;
          padding:15px;border-radius:14px;margin-top:8px;
          font-family:'Plus Jakarta Sans',sans-serif;font-size:.92rem;font-weight:700;
          letter-spacing:-.01em;cursor:pointer;box-shadow:0 6px 26px var(--blue-glow);
          transition:background .2s,transform .15s,box-shadow .2s;}
        .next-btn:hover:not(:disabled){background:var(--blue-d);transform:translateY(-1px);box-shadow:0 10px 34px var(--blue-glow);}
        .next-btn:disabled{opacity:.5;cursor:not-allowed;}
        .back-link{display:block;text-align:center;margin-top:14px;font-size:.8rem;color:var(--muted);text-decoration:none;cursor:pointer;transition:color .2s;}
        .back-link:hover{color:var(--blue);}

        /* Step panel animation */
        .step-panel{animation:fadeIn .4s ease;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}

        /* Privacy / impact notes */
        .priv-note{display:flex;align-items:flex-start;gap:10px;
          background:rgba(33,119,209,0.05);border:1px solid rgba(33,119,209,0.12);border-radius:12px;padding:12px 16px;
          font-size:.76rem;color:var(--text2);line-height:1.55;margin-bottom:20px;}
        .impact-note{display:flex;align-items:center;gap:10px;
          background:linear-gradient(135deg,rgba(33,119,209,.07),rgba(195,154,53,.05));
          border:1px solid rgba(33,119,209,0.14);border-radius:14px;padding:14px 18px;margin-bottom:24px;}
        .in-text{font-size:.78rem;color:var(--text2);line-height:1.5;}
        .in-text strong{color:var(--blue);}

        /* Review / summary boxes */
        .review-box{background:rgba(255,255,255,.55);backdrop-filter:blur(16px);border:1px solid var(--gb);border-radius:16px;padding:20px 22px;box-shadow:var(--gs);margin-bottom:20px;}
        .review-row{display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:6px;}
        .review-row:last-child{margin-bottom:0;}
        .review-key{color:var(--muted);}
        .review-val{color:var(--text);font-weight:500;}

        .summary-row{display:flex;justify-content:space-between;padding:8px 0;font-size:.82rem;color:var(--text2);border-bottom:1px solid var(--border);}
        .summary-total{display:flex;justify-content:space-between;padding:10px 0 0;border-top:1px solid var(--border);font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.95rem;color:var(--text);}

        .checklist{display:flex;flex-direction:column;gap:10px;margin-bottom:24px;}
        .checklist-item{display:flex;align-items:center;gap:10px;font-size:.78rem;color:var(--text2);}
        .checklist-tick{color:var(--blue);font-size:.9rem;}

        /* Secure row */
        .secure-row{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:22px;font-size:.7rem;color:var(--muted);}

        @media(max-width:640px){
          .card{padding:32px 24px;}
          .form-row{grid-template-columns:1fr;}
          .su-nav{width:calc(100% - 28px);}
          .step-name{display:none;}
        }
      `}</style>

      {/* Background blobs */}
      <div className="bg-blob b1" />
      <div className="bg-blob b2" />

      {/* NAV */}
      <nav className="su-nav">
        <a href="/" className="logo">Nyra<span className="logo-gem" /></a>
        <a href="/" className="nav-back">← Back to Nyra</a>
      </nav>

      <div className="su-page">
        <div className="signup-wrap">

          {/* Progress bar */}
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>

          {/* Step labels */}
          <div className="step-labels">
            {(['Your info', 'Confirm', 'Payment'] as const).map((label, i) => (
              <>
                <div key={label} className={`step-label${step === i + 1 ? ' active' : ''}`}>
                  <div className={`step-dot${step === i + 1 ? ' active' : step > i + 1 ? ' done' : ''}`}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <div className="step-name">{label}</div>
                </div>
                {i < 2 && <div key={`conn-${i}`} className="step-connector" />}
              </>
            ))}
          </div>

          <div className="card">

            {/* ── Step 1: Your info ─────────────────────────────────────── */}
            {step === 1 && (
              <div className="step-panel">
                <div className="plan-chip">
                  <span className="chip-dot" />
                  {plan} Plan — ${price}/month
                </div>
                <div className="card-eyebrow">Step 1 of 3</div>
                <h1 className="card-h">Tell us about you.</h1>
                <p className="card-sub">Just the basics — this takes about 60 seconds.</p>

                <div className="priv-note">
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>🔒</span>
                  Your info is only used to create your account and send bill reminders. We never sell your data.
                </div>

                <div className="form-row">
                  <div className="fg">
                    <label>First name</label>
                    <input name="firstName" type="text" placeholder="First name" value={form.firstName} onChange={handleChange} />
                  </div>
                  <div className="fg">
                    <label>Last name</label>
                    <input name="lastName" type="text" placeholder="Last name" value={form.lastName} onChange={handleChange} />
                  </div>
                </div>
                <div className="fg">
                  <label>Email address</label>
                  <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
                </div>
                <div className="fg">
                  <label>Phone number</label>
                  <input name="phone" type="tel" placeholder="+1 (000) 000-0000" value={form.phone} onChange={handleChange} />
                  <div className="phone-note">📱 Your reminders will be sent here as text messages</div>
                </div>

                <button className="next-btn" onClick={() => goStep(2)} disabled={!step1Valid}>
                  Continue →
                </button>
                <div className="secure-row">
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M6 1L1 3.5V7c0 2.76 2.13 5.35 5 6 2.87-.65 5-3.24 5-6V3.5L6 1z" stroke="#7a90aa" strokeWidth="1.2" fill="none"/></svg>
                  Secure · Encrypted · Private
                </div>
              </div>
            )}

            {/* ── Step 2: Review ────────────────────────────────────────── */}
            {step === 2 && (
              <div className="step-panel">
                <div className="card-eyebrow">Step 2 of 3</div>
                <h1 className="card-h">Looks good?</h1>
                <p className="card-sub">Review your details before heading to payment.</p>

                <div className="impact-note">
                  <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>💙</span>
                  <div className="in-text">
                    By subscribing, <strong>20% of your monthly fee</strong> goes directly toward Financial Futures Education — delivering financial literacy to youth across Canada.
                  </div>
                </div>

                {/* Details review */}
                <div className="review-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '.8rem', fontWeight: 700, color: 'var(--text)' }}>Your Details</span>
                    <button onClick={() => goStep(1)} style={{ fontSize: '.72rem', color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Edit</button>
                  </div>
                  {[['Name', `${form.firstName} ${form.lastName}`], ['Email', form.email], ['Phone', form.phone]].map(([k, v]) => (
                    <div key={k} className="review-row">
                      <span className="review-key">{k}</span>
                      <span className="review-val">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Plan review */}
                <div className="review-box" style={{ borderColor: 'rgba(33,119,209,.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>{plan} Plan</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 2 }}>{planInfo.sub}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: 'var(--blue)' }}>${price}</div>
                      <div style={{ fontSize: '.68rem', color: 'var(--muted)' }}>/month</div>
                    </div>
                  </div>
                </div>

                <button className="next-btn" onClick={() => goStep(3)}>Go to payment →</button>
                <span className="back-link" onClick={() => goStep(1)}>← Back</span>
              </div>
            )}

            {/* ── Step 3: Payment ───────────────────────────────────────── */}
            {step === 3 && (
              <div className="step-panel">
                <div className="card-eyebrow">Step 3 of 3</div>
                <h1 className="card-h">You&apos;re almost in.</h1>
                <p className="card-sub">We&apos;re handing you off to our secure payment provider to complete your subscription.</p>

                {/* Order summary */}
                <div className="review-box">
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: '.85rem', color: 'var(--text)', marginBottom: 10 }}>Order Summary</div>
                  <div className="summary-row">
                    <span>Nyra {plan}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>${price}/mo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '.75rem', color: 'var(--muted)' }}>
                    <span>20% supports Financial Futures Education</span>
                    <span style={{ color: 'var(--gold)' }}>💙</span>
                  </div>
                  <div className="summary-total">
                    <span>Total today</span>
                    <span>${price}.00</span>
                  </div>
                </div>

                {/* Checklist */}
                <div className="checklist">
                  {['Cancel anytime — no penalty', 'Reminders start immediately after payment', 'Billed monthly · No hidden fees'].map(item => (
                    <div key={item} className="checklist-item">
                      <span className="checklist-tick">✓</span>
                      {item}
                    </div>
                  ))}
                </div>

                <button className="next-btn" onClick={submitToStripe} disabled={loading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ opacity: .8 }}><rect x="1" y="4" width="22" height="16" rx="3" stroke="white" strokeWidth="1.8" fill="none"/><path d="M1 10h22" stroke="white" strokeWidth="1.8"/></svg>
                  {loading ? 'Processing...' : 'Complete payment →'}
                </button>
                <span className="back-link" onClick={() => goStep(2)}>← Back</span>
                <div className="secure-row">
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M6 1L1 3.5V7c0 2.76 2.13 5.35 5 6 2.87-.65 5-3.24 5-6V3.5L6 1z" stroke="#7a90aa" strokeWidth="1.2" fill="none"/></svg>
                  Payments powered by Stripe · 256-bit SSL
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
