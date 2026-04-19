'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  reminderTime: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
}

interface BillData {
  name: string;
  amount: string;
  dueDate: string;
  recurring: boolean;
}

const PLANS = [
  { id: 'Basic', price: 3, bills: 5, features: ['SMS reminders', 'Basic badges', 'Money IQ score'], color: '#7a90aa' },
  { id: 'Plus', price: 5, bills: 15, features: ['Everything in Basic', 'AI coach (10 msg/mo)', 'Analytics & Learn tab', 'All badges'], color: '#2177d1', popular: true },
  { id: 'Power', price: 8, bills: '∞', features: ['Everything in Plus', 'Unlimited AI coach', 'AI memory', 'Proactive insights', 'Secret badges'], color: '#7c3aed' },
];

const BILL_PRESETS = [
  { name: 'Rent', icon: '🏠', amount: '' },
  { name: 'Netflix', icon: '📺', amount: '16.49' },
  { name: 'Spotify', icon: '🎵', amount: '11.99' },
  { name: 'Phone Bill', icon: '📱', amount: '' },
  { name: 'Internet', icon: '📡', amount: '' },
  { name: 'Electricity', icon: '💡', amount: '' },
  { name: 'Car Insurance', icon: '🚗', amount: '' },
  { name: 'Gym', icon: '💪', amount: '' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SignupPage() {
  return <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter,sans-serif',color:'#7a90aa'}}>Loading...</div>}><SignupInner/></Suspense>;
}

function SignupInner() {
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan') || '';
  
  // Steps: 1=Welcome, 2=Account, 3=Phone Verify, 4=Profile, 5=Plan, 6=First Bill, 7=Tutorial, 8=Payment
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  
  // Form data
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    reminderTime: '09:00',
    smsEnabled: true,
    emailEnabled: true,
  });
  
  // Plan selection
  const [selectedPlan, setSelectedPlan] = useState(initialPlan || 'Plus');
  
  // Phone verification
  const [verifyCode, setVerifyCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  
  // First bill
  const [bill, setBill] = useState<BillData>({ name: '', amount: '', dueDate: '', recurring: true });
  const [skipBill, setSkipBill] = useState(false);
  
  // Tutorial
  const [tutorialStep, setTutorialStep] = useState(0);

  const taxRate = 0.13;
  const selectedPlanData = PLANS.find(p => p.id === selectedPlan) || PLANS[1];
  const price = selectedPlanData.price;
  const taxAmt = (price * taxRate).toFixed(2);
  const totalAmt = (price * (1 + taxRate)).toFixed(2);

  // ── Validation ─────────────────────────────────────────────────────────────
  const step2Valid = form.firstName.trim() && form.lastName.trim() && form.email.includes('@') && form.password.length >= 8;
  const step3Valid = form.phone.replace(/\D/g, '').length >= 10;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function goStep(n: number) {
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  // ── Create account (step 2 -> 3) ───────────────────────────────────────────
  async function createAccount() {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed, please try again.');

      setUserId(authData.user.id);

      // Insert initial profile
      await supabase.from('profiles').insert({
        id: authData.user.id,
        first_name: form.firstName,
        last_name: form.lastName,
        full_name: `${form.firstName} ${form.lastName}`,
      });

      goStep(3);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Send verification code (step 3) ────────────────────────────────────────
  async function sendVerifyCode() {
    if (!step3Valid) return;
    setLoading(true);
    setVerifyError('');
    
    const fullPhone = '+1' + form.phone.replace(/\D/g, '');
    
    try {
      const res = await fetch('/api/sms/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send code');
      setCodeSent(true);
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Verify phone code ──────────────────────────────────────────────────────
  async function verifyPhone() {
    if (verifyCode.length !== 6) {
      setVerifyError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setVerifyError('');
    
    const fullPhone = '+1' + form.phone.replace(/\D/g, '');
    
    try {
      const res = await fetch('/api/sms/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code: verifyCode, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      goStep(4);
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Save profile preferences (step 4 -> 5) ─────────────────────────────────
  async function savePreferences() {
    setLoading(true);
    await supabase.from('profiles').update({
      reminder_time: form.reminderTime,
      sms_enabled: form.smsEnabled,
      email_pref: form.emailEnabled ? 'both' : 'none',
    }).eq('id', userId);
    setLoading(false);
    goStep(5);
  }

  // ── Save plan selection (step 5 -> 6) ──────────────────────────────────────
  async function savePlan() {
    await supabase.from('profiles').update({ plan: selectedPlan }).eq('id', userId);
    goStep(6);
  }

  // ── Add first bill (step 6 -> 7) ───────────────────────────────────────────
  async function addFirstBill() {
    if (!skipBill && bill.name && bill.amount && bill.dueDate) {
      setLoading(true);
      await supabase.from('bills').insert({
        user_id: userId,
        bill_name: bill.name,
        amount: parseFloat(bill.amount),
        due_date: bill.dueDate,
        recurring: bill.recurring,
        remind_days_before: 3,
      });
      setLoading(false);
    }
    goStep(7);
  }

  // ── Complete onboarding (step 7 -> 8 payment) ──────────────────────────────
  async function goToPayment() {
    setLoading(true);
    try {
      // Send welcome email
      fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, name: form.firstName, plan: selectedPlan }),
      }).catch(() => {});

      // Create Stripe checkout
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          plan: selectedPlan,
          price,
          name: `${form.firstName} ${form.lastName}`,
          successUrl: `/dashboard?welcome=true`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Could not create checkout');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
      setLoading(false);
    }
  }

  // ── Progress ───────────────────────────────────────────────────────────────
  const totalSteps = 8;
  const progressPct = Math.round((step / totalSteps) * 100);

  const STEP_NAMES = ['Welcome', 'Account', 'Verify', 'Profile', 'Plan', 'First Bill', 'Tips', 'Payment'];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');
        :root{--blue:#2177d1;--blue-d:#1658a8;--blue-pale:rgba(33,119,209,0.08);--blue-glow:rgba(33,119,209,0.18);--gold:#c39a35;--gold-pale:rgba(195,154,53,0.09);--bg:#eef3fb;--text:#0c1524;--text2:#3a4f6a;--muted:#7a90aa;--border:rgba(33,119,209,0.1);--success:#22c55e;--glass:rgba(255,255,255,0.62);--gb:rgba(255,255,255,0.86);--gs:0 4px 24px rgba(33,119,209,0.09),0 1px 4px rgba(0,0,0,0.04);--gsl:0 20px 70px rgba(33,119,209,0.15),0 6px 20px rgba(0,0,0,0.07);}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;min-height:100vh;line-height:1.6;}
        
        .bg-blob{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
        .b1{width:600px;height:600px;background:radial-gradient(circle,rgba(33,119,209,0.1) 0%,transparent 70%);top:-150px;left:-150px;animation:bd1 20s ease-in-out infinite;}
        .b2{width:450px;height:450px;background:radial-gradient(circle,rgba(195,154,53,0.07) 0%,transparent 70%);bottom:5%;right:-80px;animation:bd2 25s ease-in-out infinite;}
        @keyframes bd1{0%,100%{transform:translate(0,0)}50%{transform:translate(50px,60px)}}
        @keyframes bd2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,-40px)}}

        .su-nav{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:200;display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:50px;width:calc(100% - 48px);max-width:800px;background:var(--glass);backdrop-filter:blur(28px);border:1px solid var(--gb);border-radius:100px;box-shadow:var(--gs);}
        .logo{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.15rem;letter-spacing:-.03em;color:var(--blue);text-decoration:none;}
        .logo-gem{display:inline-block;width:5px;height:5px;background:var(--gold);border-radius:50%;margin-left:2px;margin-bottom:5px;box-shadow:0 0 8px var(--gold);animation:gp 3s ease infinite;}
        @keyframes gp{0%,100%{box-shadow:0 0 6px var(--gold);}50%{box-shadow:0 0 16px var(--gold),0 0 28px rgba(195,154,53,.3);}}
        .nav-step{font-size:.75rem;color:var(--muted);font-weight:500;}

        .su-page{position:relative;z-index:1;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:80px 20px 40px;}
        .signup-wrap{width:100%;max-width:600px;}

        .progress-track{height:4px;background:rgba(33,119,209,0.1);border-radius:100px;margin-bottom:28px;overflow:hidden;}
        .progress-fill{height:100%;background:linear-gradient(90deg,var(--blue),var(--gold));border-radius:100px;transition:width .5s cubic-bezier(.34,1.56,.64,1);}

        .card{background:var(--glass);backdrop-filter:blur(28px);border:1px solid var(--gb);border-radius:28px;padding:44px 48px;box-shadow:var(--gsl);position:relative;overflow:hidden;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--blue),var(--gold),var(--blue),transparent);}

        .card-eyebrow{font-size:.62rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;display:flex;align-items:center;gap:10px;}
        .card-eyebrow::before{content:'';width:16px;height:1.5px;background:var(--gold);opacity:.5;}
        .card-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.85rem;letter-spacing:-.03em;color:var(--text);margin-bottom:6px;line-height:1.15;}
        .card-sub{font-size:.86rem;color:var(--text2);margin-bottom:28px;}

        .step-panel{animation:fadeIn .4s ease;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}

        /* Form fields */
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .fg{margin-bottom:14px;}
        .fg label{display:block;font-size:.63rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:7px;}
        .fg input,.fg select{width:100%;background:rgba(255,255,255,0.72);border:1.5px solid rgba(33,119,209,0.13);border-radius:12px;padding:13px 15px;font-family:'Inter',sans-serif;font-size:.9rem;color:var(--text);outline:none;transition:border-color .2s,box-shadow .2s;}
        .fg input:focus,.fg select:focus{border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-pale);}
        .field-hint{font-size:.72rem;color:var(--muted);margin-top:5px;display:flex;align-items:center;gap:5px;}
        .field-error{font-size:.72rem;color:#ef4444;margin-top:5px;}

        /* Buttons */
        .btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:15px;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.92rem;font-weight:700;cursor:pointer;transition:all .2s;border:none;}
        .btn-primary{background:var(--blue);color:white;box-shadow:0 6px 26px var(--blue-glow);}
        .btn-primary:hover:not(:disabled){background:var(--blue-d);transform:translateY(-1px);}
        .btn-primary:disabled{opacity:.5;cursor:not-allowed;}
        .btn-secondary{background:transparent;border:1.5px solid var(--border);color:var(--text2);}
        .btn-secondary:hover{border-color:var(--blue);color:var(--blue);}
        .back-link{display:block;text-align:center;margin-top:14px;font-size:.8rem;color:var(--muted);cursor:pointer;transition:color .2s;}
        .back-link:hover{color:var(--blue);}

        /* Welcome page */
        .welcome-hero{text-align:center;margin-bottom:32px;}
        .welcome-icon{font-size:4rem;margin-bottom:16px;}
        .welcome-features{display:flex;flex-direction:column;gap:14px;margin-bottom:28px;}
        .welcome-feat{display:flex;align-items:center;gap:14px;padding:16px 18px;background:rgba(255,255,255,.5);border:1px solid var(--border);border-radius:14px;}
        .wf-icon{font-size:1.4rem;width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:var(--blue-pale);border-radius:12px;}
        .wf-text{text-align:left;}
        .wf-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--text);}
        .wf-sub{font-size:.75rem;color:var(--muted);}

        /* Phone verify */
        .code-input{display:flex;gap:8px;justify-content:center;margin:24px 0;}
        .code-input input{width:48px;height:56px;text-align:center;font-size:1.4rem;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;border:2px solid var(--border);border-radius:12px;outline:none;}
        .code-input input:focus{border-color:var(--blue);}
        .resend-link{text-align:center;font-size:.78rem;color:var(--blue);cursor:pointer;margin-top:12px;}

        /* Plan cards */
        .plan-cards{display:flex;flex-direction:column;gap:12px;margin-bottom:24px;}
        .plan-card{padding:18px 20px;border:2px solid var(--border);border-radius:16px;cursor:pointer;transition:all .2s;position:relative;}
        .plan-card:hover{border-color:rgba(33,119,209,.3);}
        .plan-card.selected{border-color:var(--blue);background:var(--blue-pale);}
        .plan-card.popular::before{content:'Most Popular';position:absolute;top:-10px;right:16px;font-size:.6rem;font-weight:700;background:linear-gradient(135deg,var(--blue),#6366f1);color:white;padding:4px 10px;border-radius:100px;}
        .plan-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
        .plan-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1rem;}
        .plan-price{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1.1rem;color:var(--text);}
        .plan-price span{font-size:.75rem;font-weight:500;color:var(--muted);}
        .plan-bills{font-size:.75rem;color:var(--muted);margin-bottom:10px;}
        .plan-feats{display:flex;flex-wrap:wrap;gap:6px;}
        .plan-feat{font-size:.68rem;padding:4px 10px;background:rgba(255,255,255,.6);border-radius:100px;color:var(--text2);}

        /* Bill presets */
        .bill-presets{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;}
        .bill-preset{padding:14px 10px;border:1.5px solid var(--border);border-radius:12px;text-align:center;cursor:pointer;transition:all .2s;}
        .bill-preset:hover{border-color:var(--blue);background:var(--blue-pale);}
        .bill-preset.selected{border-color:var(--blue);background:var(--blue-pale);}
        .bp-icon{font-size:1.4rem;margin-bottom:4px;}
        .bp-name{font-size:.72rem;font-weight:600;color:var(--text);}

        /* Toggle */
        .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--border);}
        .toggle-row:last-child{border-bottom:none;}
        .toggle-info{flex:1;}
        .toggle-label{font-size:.85rem;font-weight:600;color:var(--text);}
        .toggle-sub{font-size:.72rem;color:var(--muted);margin-top:2px;}
        .toggle{width:44px;height:26px;border-radius:100px;cursor:pointer;position:relative;transition:background .2s;}
        .toggle.on{background:var(--blue);}
        .toggle.off{background:var(--border);}
        .toggle-knob{position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:white;box-shadow:0 2px 6px rgba(0,0,0,.15);transition:left .2s;}
        .toggle.on .toggle-knob{left:21px;}
        .toggle.off .toggle-knob{left:3px;}

        /* Tutorial */
        .tutorial-card{background:linear-gradient(135deg,var(--blue-pale),rgba(99,102,241,.05));border:1px solid var(--border);border-radius:20px;padding:28px;margin-bottom:16px;text-align:center;}
        .tut-icon{font-size:3rem;margin-bottom:12px;}
        .tut-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1.1rem;color:var(--text);margin-bottom:6px;}
        .tut-desc{font-size:.82rem;color:var(--text2);line-height:1.6;}
        .tut-dots{display:flex;justify-content:center;gap:8px;margin-top:20px;}
        .tut-dot{width:8px;height:8px;border-radius:50%;background:var(--border);transition:all .2s;}
        .tut-dot.active{background:var(--blue);width:24px;border-radius:4px;}

        /* Review box */
        .review-box{background:rgba(255,255,255,.55);border:1px solid var(--gb);border-radius:16px;padding:20px;margin-bottom:20px;}
        .summary-row{display:flex;justify-content:space-between;padding:8px 0;font-size:.82rem;color:var(--text2);border-bottom:1px solid var(--border);}
        .summary-row:last-child{border-bottom:none;}
        .summary-total{display:flex;justify-content:space-between;padding:12px 0 0;border-top:1px solid var(--border);font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1rem;color:var(--text);}

        .secure-row{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:22px;font-size:.7rem;color:var(--muted);}
        .impact-note{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,rgba(33,119,209,.06),rgba(195,154,53,.04));border:1px solid rgba(33,119,209,.12);border-radius:14px;padding:14px 18px;margin-bottom:24px;font-size:.78rem;color:var(--text2);line-height:1.5;}

        @media(max-width:640px){.card{padding:32px 24px;}.form-row{grid-template-columns:1fr;}.bill-presets{grid-template-columns:repeat(2,1fr);}.su-nav{width:calc(100% - 28px);}}
      `}</style>

      <div className="bg-blob b1" />
      <div className="bg-blob b2" />

      <nav className="su-nav">
        <a href="/" className="logo">Nyra<span className="logo-gem" /></a>
        <span className="nav-step">{step > 1 ? `Step ${step - 1} of ${totalSteps - 1}` : ''}</span>
      </nav>

      <div className="su-page">
        <div className="signup-wrap">
          {step > 1 && (
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          )}

          <div className="card">
            {/* ══════════════════════════════════════════════════════════════════
                STEP 1: WELCOME
            ══════════════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <div className="step-panel">
                <div className="welcome-hero">
                  <div className="welcome-icon">💰</div>
                  <h1 className="card-h">Never miss a bill again.</h1>
                  <p className="card-sub" style={{ marginBottom: 0 }}>Nyra sends you text reminders before bills are due — so you stay on top of your money.</p>
                </div>

                <div className="welcome-features">
                  <div className="welcome-feat">
                    <div className="wf-icon">📱</div>
                    <div className="wf-text">
                      <div className="wf-title">SMS Reminders</div>
                      <div className="wf-sub">Get texts 3 days before each bill is due</div>
                    </div>
                  </div>
                  <div className="welcome-feat">
                    <div className="wf-icon">🤖</div>
                    <div className="wf-text">
                      <div className="wf-title">AI Coach</div>
                      <div className="wf-sub">Chat with Nyra about your finances anytime</div>
                    </div>
                  </div>
                  <div className="welcome-feat">
                    <div className="wf-icon">🏆</div>
                    <div className="wf-text">
                      <div className="wf-title">Track Progress</div>
                      <div className="wf-sub">Earn badges, boost your Money IQ score</div>
                    </div>
                  </div>
                </div>

                <div className="impact-note">
                  <span style={{ fontSize: '1.3rem' }}>💙</span>
                  <span><strong>20% of all profits</strong> go to Financial Futures Education — teaching financial literacy to Canadian youth.</span>
                </div>

                <button className="btn btn-primary" onClick={() => goStep(2)}>
                  Get Started →
                </button>
                <a href="/login" className="back-link">Already have an account? Sign in</a>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 2: ACCOUNT CREATION
            ══════════════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <div className="step-panel">
                <div className="card-eyebrow">Step 1 of 7</div>
                <h1 className="card-h">Create your account</h1>
                <p className="card-sub">Just the basics — this takes about 60 seconds.</p>

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
                  <label>Password</label>
                  <input name="password" type="password" placeholder="At least 8 characters" value={form.password} onChange={handleChange} />
                  {form.password && form.password.length < 8 && (
                    <div className="field-error">⚠️ Password must be at least 8 characters</div>
                  )}
                </div>

                <button className="btn btn-primary" onClick={createAccount} disabled={!step2Valid || loading}>
                  {loading ? 'Creating account...' : 'Continue →'}
                </button>
                <span className="back-link" onClick={() => goStep(1)}>← Back</span>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 3: PHONE VERIFICATION
            ══════════════════════════════════════════════════════════════════ */}
            {step === 3 && (
              <div className="step-panel">
                <div className="card-eyebrow">Step 2 of 7</div>
                <h1 className="card-h">Verify your phone</h1>
                <p className="card-sub">We'll send your bill reminders here via text message.</p>

                {!codeSent ? (
                  <>
                    <div className="fg">
                      <label>Phone number</label>
                      <input
                        name="phone"
                        type="tel"
                        placeholder="(416) 555-0123"
                        value={formatPhone(form.phone)}
                        onChange={e => setForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      />
                      <div className="field-hint">📱 Canadian or US numbers only</div>
                    </div>
                    <button className="btn btn-primary" onClick={sendVerifyCode} disabled={!step3Valid || loading}>
                      {loading ? 'Sending...' : 'Send verification code →'}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: '.85rem', color: 'var(--text2)' }}>Enter the 6-digit code sent to</div>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>+1 {formatPhone(form.phone)}</div>
                    </div>
                    <div className="code-input">
                      {[0, 1, 2, 3, 4, 5].map(i => (
                        <input
                          key={i}
                          type="text"
                          maxLength={1}
                          value={verifyCode[i] || ''}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            const newCode = verifyCode.split('');
                            newCode[i] = val;
                            setVerifyCode(newCode.join(''));
                            if (val && e.target.nextElementSibling) {
                              (e.target.nextElementSibling as HTMLInputElement).focus();
                            }
                          }}
                        />
                      ))}
                    </div>
                    {verifyError && <div className="field-error" style={{ textAlign: 'center' }}>{verifyError}</div>}
                    <button className="btn btn-primary" onClick={verifyPhone} disabled={verifyCode.length !== 6 || loading}>
                      {loading ? 'Verifying...' : 'Verify & continue →'}
                    </button>
                    <div className="resend-link" onClick={() => { setCodeSent(false); setVerifyCode(''); setVerifyError(''); }}>
                      Didn't get it? Send again
                    </div>
                  </>
                )}
                <span className="back-link" onClick={() => goStep(2)}>← Back</span>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 4: PROFILE PREFERENCES
            ══════════════════════════════════════════════════════════════════ */}
            {step === 4 && (
              <div className="step-panel">
                <div className="card-eyebrow">Step 3 of 7</div>
                <h1 className="card-h">Set your preferences</h1>
                <p className="card-sub">Customize how Nyra reminds you about bills.</p>

                <div className="fg">
                  <label>Reminder time</label>
                  <select value={form.reminderTime} onChange={e => setForm(prev => ({ ...prev, reminderTime: e.target.value }))}>
                    <option value="07:00">7:00 AM</option>
                    <option value="08:00">8:00 AM</option>
                    <option value="09:00">9:00 AM (recommended)</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="20:00">8:00 PM</option>
                  </select>
                  <div className="field-hint">When should we send your reminders?</div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <div className="toggle-label">📱 SMS reminders</div>
                      <div className="toggle-sub">Get text messages before bills are due</div>
                    </div>
                    <div className={`toggle ${form.smsEnabled ? 'on' : 'off'}`} onClick={() => setForm(prev => ({ ...prev, smsEnabled: !prev.smsEnabled }))}>
                      <div className="toggle-knob" />
                    </div>
                  </div>
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <div className="toggle-label">📧 Email reminders</div>
                      <div className="toggle-sub">Also receive reminders via email</div>
                    </div>
                    <div className={`toggle ${form.emailEnabled ? 'on' : 'off'}`} onClick={() => setForm(prev => ({ ...prev, emailEnabled: !prev.emailEnabled }))}>
                      <div className="toggle-knob" />
                    </div>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={savePreferences} disabled={loading} style={{ marginTop: 24 }}>
                  {loading ? 'Saving...' : 'Continue →'}
                </button>
                <span className="back-link" onClick={() => goStep(3)}>← Back</span>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 5: PLAN SELECTION
            ══════════════════════════════════════════════════════════════════ */}
            {step === 5 && (
              <div className="step-panel">
                <div className="card-eyebrow">Step 4 of 7</div>
                <h1 className="card-h">Choose your plan</h1>
                <p className="card-sub">All plans include SMS reminders. Upgrade anytime.</p>

                <div className="plan-cards">
                  {PLANS.map(p => (
                    <div
                      key={p.id}
                      className={`plan-card ${selectedPlan === p.id ? 'selected' : ''} ${p.popular ? 'popular' : ''}`}
                      onClick={() => setSelectedPlan(p.id)}
                    >
                      <div className="plan-header">
                        <div className="plan-name" style={{ color: p.color }}>{p.id}</div>
                        <div className="plan-price">${p.price}<span>/mo + tax</span></div>
                      </div>
                      <div className="plan-bills">{typeof p.bills === 'number' ? `Up to ${p.bills} bills` : 'Unlimited bills'}</div>
                      <div className="plan-feats">
                        {p.features.map(f => <span key={f} className="plan-feat">{f}</span>)}
                      </div>
                    </div>
                  ))}
                </div>

                <button className="btn btn-primary" onClick={savePlan}>
                  Continue with {selectedPlan} →
                </button>
                <span className="back-link" onClick={() => goStep(4)}>← Back</span>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 6: ADD FIRST BILL
            ══════════════════════════════════════════════════════════════════ */}
            {step === 6 && (
              <div className="step-panel">
                <div className="card-eyebrow">Step 5 of 7</div>
                <h1 className="card-h">Add your first bill</h1>
                <p className="card-sub">Start tracking right away. You can always add more later.</p>

                <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.08em' }}>Quick picks</div>
                <div className="bill-presets">
                  {BILL_PRESETS.slice(0, 8).map(bp => (
                    <div
                      key={bp.name}
                      className={`bill-preset ${bill.name === bp.name ? 'selected' : ''}`}
                      onClick={() => setBill(prev => ({ ...prev, name: bp.name, amount: bp.amount || prev.amount }))}
                    >
                      <div className="bp-icon">{bp.icon}</div>
                      <div className="bp-name">{bp.name}</div>
                    </div>
                  ))}
                </div>

                <div className="fg">
                  <label>Bill name</label>
                  <input
                    type="text"
                    placeholder="e.g., Netflix, Rent, Phone Bill"
                    value={bill.name}
                    onChange={e => setBill(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="form-row">
                  <div className="fg">
                    <label>Amount ($)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={bill.amount}
                      onChange={e => setBill(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div className="fg">
                    <label>Due date</label>
                    <input
                      type="date"
                      value={bill.dueDate}
                      onChange={e => setBill(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="toggle-row" style={{ marginBottom: 20 }}>
                  <div className="toggle-info">
                    <div className="toggle-label">🔄 Recurring monthly</div>
                    <div className="toggle-sub">Bill repeats every month</div>
                  </div>
                  <div className={`toggle ${bill.recurring ? 'on' : 'off'}`} onClick={() => setBill(prev => ({ ...prev, recurring: !prev.recurring }))}>
                    <div className="toggle-knob" />
                  </div>
                </div>

                <button className="btn btn-primary" onClick={addFirstBill} disabled={loading}>
                  {bill.name && bill.amount && bill.dueDate ? 'Add bill & continue →' : 'Skip for now →'}
                </button>
                <span className="back-link" onClick={() => goStep(5)}>← Back</span>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 7: TUTORIAL / TIPS
            ══════════════════════════════════════════════════════════════════ */}
            {step === 7 && (
              <div className="step-panel">
                <div className="card-eyebrow">Step 6 of 7</div>
                <h1 className="card-h">Quick tips</h1>
                <p className="card-sub">Here's how to get the most out of Nyra.</p>

                {[
                  { icon: '📋', title: 'Add all your bills', desc: 'The more bills you track, the better Nyra works. Add rent, subscriptions, utilities — everything.' },
                  { icon: '✅', title: 'Mark bills as paid', desc: 'When you pay a bill, tap "Paid" to track your history and earn badges.' },
                  { icon: '🤖', title: 'Chat with Nyra AI', desc: 'Ask questions about your bills, get budgeting tips, or just say hi!' },
                  { icon: '🏆', title: 'Earn badges', desc: 'Complete challenges and build streaks to unlock achievements and boost your Money IQ.' },
                ].map((tip, i) => (
                  tutorialStep === i && (
                    <div key={tip.title} className="tutorial-card">
                      <div className="tut-icon">{tip.icon}</div>
                      <div className="tut-title">{tip.title}</div>
                      <div className="tut-desc">{tip.desc}</div>
                    </div>
                  )
                ))}

                <div className="tut-dots">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`tut-dot ${tutorialStep === i ? 'active' : ''}`} onClick={() => setTutorialStep(i)} />
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  {tutorialStep > 0 && (
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setTutorialStep(tutorialStep - 1)}>
                      ← Back
                    </button>
                  )}
                  {tutorialStep < 3 ? (
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setTutorialStep(tutorialStep + 1)}>
                      Next →
                    </button>
                  ) : (
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => goStep(8)}>
                      Continue to payment →
                    </button>
                  )}
                </div>
                <span className="back-link" onClick={() => goStep(6)}>← Back</span>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 8: PAYMENT
            ══════════════════════════════════════════════════════════════════ */}
            {step === 8 && (
              <div className="step-panel">
                <div className="card-eyebrow">Final step</div>
                <h1 className="card-h">Complete your subscription</h1>
                <p className="card-sub">You're almost there! Review and pay to start using Nyra.</p>

                <div className="review-box">
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: '.85rem', color: 'var(--text)', marginBottom: 12 }}>Order Summary</div>
                  <div className="summary-row">
                    <span>Nyra {selectedPlan}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>${price}/mo</span>
                  </div>
                  <div className="summary-row">
                    <span>HST/GST (13%)</span>
                    <span>${taxAmt}</span>
                  </div>
                  <div className="summary-total">
                    <span>Total today</span>
                    <span>${totalAmt} CAD</span>
                  </div>
                </div>

                <div className="impact-note">
                  <span style={{ fontSize: '1.2rem' }}>💙</span>
                  <span>20% of your subscription supports Financial Futures Education.</span>
                </div>

                <button className="btn btn-primary" onClick={goToPayment} disabled={loading}>
                  {loading ? 'Processing...' : '💳 Complete payment →'}
                </button>
                <span className="back-link" onClick={() => goStep(7)}>← Back</span>
                <div className="secure-row">
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M6 1L1 3.5V7c0 2.76 2.13 5.35 5 6 2.87-.65 5-3.24 5-6V3.5L6 1z" stroke="#7a90aa" strokeWidth="1.2" fill="none"/></svg>
                  Secure checkout · Powered by Stripe
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
