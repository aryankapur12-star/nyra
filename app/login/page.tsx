"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      alert("Something went wrong: " + err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0a0a0f;
          --surface: #13131a;
          --border: #1e1e2e;
          --accent: #7c6aff;
          --accent2: #ff6a9b;
          --text: #f0eeff;
          --muted: #7a7a9a;
        }
        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .glow {
          position: fixed;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124,106,255,0.12) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 48px 40px;
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 1;
        }
        .logo {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 32px;
        }
        .logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.8rem;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .logo-sub {
          font-size: 0.65rem;
          color: var(--muted);
          letter-spacing: 0.04em;
        }
        h1 {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.6rem;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .sub {
          color: var(--muted);
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        label {
          display: block;
          font-size: 0.75rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
          font-weight: 500;
        }
        input {
          width: 100%;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px 16px;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
          margin-bottom: 16px;
        }
        input:focus { border-color: var(--accent); }
        input::placeholder { color: var(--muted); }
        .btn {
          width: 100%;
          background: linear-gradient(135deg, var(--accent), #9b5fff);
          color: white;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s;
          box-shadow: 0 0 30px rgba(124,106,255,0.25);
        }
        .btn:hover { opacity: 0.9; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .back {
          display: block;
          text-align: center;
          margin-top: 20px;
          color: var(--muted);
          font-size: 0.85rem;
          text-decoration: none;
          transition: color 0.2s;
        }
        .back:hover { color: var(--text); }
        .success-icon { font-size: 3rem; margin-bottom: 16px; }
        .success-title {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.4rem;
          margin-bottom: 12px;
        }
        .success-sub { color: var(--muted); font-size: 0.9rem; line-height: 1.6; }
      `}</style>

      <div className="glow" />
      <div className="card">
        <div className="logo">
          <div className="logo-name">Nyra</div>
          <div className="logo-sub">by Financial Futures Education</div>
        </div>

        {sent ? (
          <div style={{textAlign:"center"}}>
            <div className="success-icon">📬</div>
            <div className="success-title">Check your inbox!</div>
            <div className="success-sub">We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.</div>
          </div>
        ) : (
          <>
            <h1>Welcome back</h1>
            <p className="sub">Enter your email and we'll send you a magic link to sign in instantly.</p>
            <form onSubmit={handleLogin}>
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn" disabled={loading}>
                {loading ? "Sending magic link..." : "Send magic link →"}
              </button>
            </form>
          </>
        )}
        <a href="/" className="back">← Back to Nyra</a>
      </div>
    </>
  );
}
