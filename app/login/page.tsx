'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = email.includes('@') && password.length >= 8;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        // Successfully logged in - redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

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
          --danger:#ef4444;
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;min-height:100vh;overflow-x:hidden;line-height:1.6;}

        .bg-blob{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
        .b1{width:600px;height:600px;background:radial-gradient(circle,rgba(33,119,209,0.1) 0%,transparent 70%);top:-150px;left:-150px;animation:bd1 20s ease-in-out infinite;}
        .b2{width:450px;height:450px;background:radial-gradient(circle,rgba(195,154,53,0.07) 0%,transparent 70%);bottom:5%;right:-80px;animation:bd2 25s ease-in-out infinite;}
        @keyframes bd1{0%,100%{transform:translate(0,0)}50%{transform:translate(50px,60px)}}
        @keyframes bd2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,-40px)}}

        /* NAV */
        .login-nav{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:200;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 20px;height:50px;width:calc(100% - 48px);max-width:500px;
          background:var(--glass);backdrop-filter:blur(28px) saturate(2);-webkit-backdrop-filter:blur(28px) saturate(2);
          border:1px solid var(--gb);border-radius:100px;box-shadow:var(--gs);}
        .logo{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.15rem;letter-spacing:-.03em;color:var(--blue);text-decoration:none;}
        .logo-gem{display:inline-block;width:5px;height:5px;background:var(--gold);border-radius:50%;margin-left:2px;margin-bottom:5px;box-shadow:0 0 8px var(--gold);vertical-align:middle;animation:gp 3s ease infinite;}
        @keyframes gp{0%,100%{box-shadow:0 0 6px var(--gold);}50%{box-shadow:0 0 16px var(--gold),0 0 28px rgba(195,154,53,.3);}}
        .nav-back{font-size:.8rem;font-weight:500;color:var(--text2);text-decoration:none;padding:7px 14px;border-radius:100px;transition:background .2s,color .2s;display:flex;align-items:center;gap:5px;}
        .nav-back:hover{background:var(--blue-pale);color:var(--blue);}

        /* LAYOUT */
        .login-page{position:relative;z-index:1;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:80px 20px 40px;}
        .login-wrap{width:100%;max-width:440px;}

        /* CARD */
        .card{background:var(--glass);backdrop-filter:blur(28px) saturate(2);-webkit-backdrop-filter:blur(28px) saturate(2);
          border:1px solid var(--gb);border-radius:28px;padding:44px 48px;box-shadow:var(--gsl);
          position:relative;overflow:hidden;}
        .card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,var(--blue),var(--gold),var(--blue),transparent);}

        .card-eyebrow{font-size:.62rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;display:flex;align-items:center;gap:10px;}
        .card-eyebrow::before{content:'';width:16px;height:1.5px;background:var(--gold);opacity:.5;}
        .card-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.85rem;letter-spacing:-.03em;color:var(--text);margin-bottom:6px;line-height:1.1;}
        .card-sub{font-size:.86rem;color:var(--text2);margin-bottom:32px;}

        /* FORM */
        .fg{margin-bottom:18px;}
        .fg label{display:block;font-size:.63rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:7px;}
        .fg input{
          width:100%;background:rgba(255,255,255,0.72);backdrop-filter:blur(12px);
          border:1.5px solid rgba(33,119,209,0.13);border-radius:12px;padding:13px 15px;
          font-family:'Inter',sans-serif;font-size:.9rem;font-weight:400;color:var(--text);outline:none;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.9);transition:border-color .2s,box-shadow .2s,background .2s;}
        .fg input:focus{border-color:var(--blue);background:rgba(255,255,255,.88);box-shadow:0 0 0 3px var(--blue-pale),inset 0 1px 0 rgba(255,255,255,.9);}
        .fg input::placeholder{color:var(--muted);}

        /* ERROR */
        .error-box{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:12px 16px;margin-bottom:18px;font-size:.82rem;color:var(--danger);display:flex;align-items:center;gap:8px;}

        /* BUTTONS */
        .login-btn{display:flex;align-items:center;justify-content:center;gap:8px;
          width:100%;background:var(--blue);color:white;border:none;
          padding:15px;border-radius:14px;margin-top:8px;
          font-family:'Plus Jakarta Sans',sans-serif;font-size:.92rem;font-weight:700;
          letter-spacing:-.01em;cursor:pointer;box-shadow:0 6px 26px var(--blue-glow);
          transition:background .2s,transform .15s,box-shadow .2s;}
        .login-btn:hover:not(:disabled){background:var(--blue-d);transform:translateY(-1px);box-shadow:0 10px 34px var(--blue-glow);}
        .login-btn:disabled{opacity:.5;cursor:not-allowed;}
        
        .signup-link{display:block;text-align:center;margin-top:18px;font-size:.82rem;color:var(--muted);text-decoration:none;transition:color .2s;}
        .signup-link:hover{color:var(--blue);}
        .signup-link span{color:var(--blue);font-weight:600;}

        /* Secure row */
        .secure-row{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:22px;font-size:.7rem;color:var(--muted);}

        @media(max-width:640px){
          .card{padding:32px 24px;}
          .login-nav{width:calc(100% - 28px);}
        }
      `}</style>

      {/* Background blobs */}
      <div className="bg-blob b1" />
      <div className="bg-blob b2" />

      {/* NAV */}
      <nav className="login-nav">
        <a href="/" className="logo">Nyra<span className="logo-gem" /></a>
        <a href="/" className="nav-back">← Back to Nyra</a>
      </nav>

      <div className="login-page">
        <div className="login-wrap">
          <div className="card">
            <div className="card-eyebrow">Welcome back</div>
            <h1 className="card-h">Sign in to Nyra</h1>
            <p className="card-sub">Enter your email and password to access your dashboard.</p>

            {error && (
              <div className="error-box">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="fg">
                <label>Email address</label>
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="fg">
                <label>Password</label>
                <input 
                  type="password" 
                  placeholder="Your password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" className="login-btn" disabled={!isValid || loading}>
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>

            <a href="/signup" className="signup-link">
              Don't have an account? <span>Get started →</span>
            </a>

            <div className="secure-row">
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M6 1L1 3.5V7c0 2.76 2.13 5.35 5 6 2.87-.65 5-3.24 5-6V3.5L6 1z" stroke="#7a90aa" strokeWidth="1.2" fill="none"/></svg>
              Secure · Encrypted · Private
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
