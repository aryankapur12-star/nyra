"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    billName: "",
    amount: "",
    dueDate: "",
    frequency: "Monthly"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: Math.random().toString(36) + Math.random().toString(36)
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed, please try again.");
      const userId = authData.user.id;
      await supabase.from("profiles").insert({
        id: userId,
        full_name: `${form.firstName} ${form.lastName}`,
        phone_number: form.phone
      });
      await supabase.from("bills").insert({
        user_id: userId,
        bill_name: form.billName,
        amount: parseFloat(form.amount) || 0,
        due_date: form.dueDate,
        recurring: form.frequency !== "One-time"
      });
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error("Could not create checkout session");
    } catch (err: any) {
      alert("Something went wrong: " + err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0a0a0f;
          --surface: #13131a;
          --border: #1e1e2e;
          --accent: #7c6aff;
          --accent2: #ff6a9b;
          --accent3: #6affda;
          --text: #f0eeff;
          --muted: #7a7a9a;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          overflow-x: hidden;
        }

        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 9999;
          opacity: 0.4;
        }

        nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px;
          background: rgba(10,10,15,0.7);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .logo {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
        }
        .logo-sub {
          font-size: 0.6rem;
          color: var(--muted);
          letter-spacing: 0.04em;
          font-weight: 400;
        }

        .nav-links { display: flex; gap: 36px; align-items: center; }
        .nav-links a {
          color: var(--muted);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 400;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--text); }

        .nav-sign-in {
          color: var(--muted) !important;
          border: 1px solid var(--border);
          padding: 10px 20px;
          border-radius: 100px;
          font-size: 0.9rem !important;
          transition: border-color 0.2s, color 0.2s !important;
        }
        .nav-sign-in:hover { border-color: var(--accent) !important; color: var(--text) !important; }
        .nav-sign-in {
  color: var(--muted) !important;
  border: 1px solid var(--border);
  padding: 10px 20px;
  border-radius: 100px;
  font-size: 0.9rem !important;
  transition: border-color 0.2s, color 0.2s !important;
}
.nav-sign-in:hover { border-color: var(--accent) !important; color: var(--text) !important; }
        .nav-cta {
          background: var(--accent);
          color: white !important;
          padding: 10px 22px;
          border-radius: 100px;
          font-weight: 500 !important;
          transition: opacity 0.2s !important;
        }
        .nav-cta:hover { opacity: 0.85; color: white !important; }

        .hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; }
        .hamburger span { display: block; width: 24px; height: 2px; background: var(--text); border-radius: 2px; }

        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 120px 24px 80px;
          position: relative;
          overflow: hidden;
        }

        .hero-glow {
          position: absolute;
          width: 700px; height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124,106,255,0.15) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .hero-glow2 {
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,106,155,0.1) 0%, transparent 70%);
          top: 30%; left: 65%;
          pointer-events: none;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(124,106,255,0.12);
          border: 1px solid rgba(124,106,255,0.25);
          color: var(--accent);
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 32px;
          animation: fadeUp 0.6s ease both;
        }

        .badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--accent);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        h1 {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(2.8rem, 7vw, 5.5rem);
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin-bottom: 24px;
          animation: fadeUp 0.6s 0.1s ease both;
        }

        h1 .grad {
          background: linear-gradient(135deg, var(--accent), var(--accent2) 50%, var(--accent3));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-sub {
          max-width: 520px;
          font-size: 1.1rem;
          color: var(--muted);
          line-height: 1.7;
          margin-bottom: 44px;
          animation: fadeUp 0.6s 0.2s ease both;
        }

        .hero-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
          animation: fadeUp 0.6s 0.3s ease both;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--accent), #9b5fff);
          color: white;
          padding: 16px 36px;
          border-radius: 100px;
          font-size: 1rem;
          font-weight: 500;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 40px rgba(124,106,255,0.3);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 60px rgba(124,106,255,0.45);
        }

        .btn-secondary {
          background: transparent;
          color: var(--text);
          padding: 16px 36px;
          border-radius: 100px;
          font-size: 1rem;
          font-weight: 400;
          text-decoration: none;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .btn-secondary:hover {
          border-color: var(--accent);
          background: rgba(124,106,255,0.06);
        }

        .hero-note {
          margin-top: 20px;
          font-size: 0.8rem;
          color: var(--muted);
          animation: fadeUp 0.6s 0.4s ease both;
        }

        .hero-cards {
          display: flex;
          gap: 16px;
          margin-top: 72px;
          animation: fadeUp 0.8s 0.5s ease both;
          flex-wrap: wrap;
          justify-content: center;
        }

        .mini-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px 20px;
          text-align: left;
          min-width: 160px;
        }

        .mini-card-label { font-size: 0.72rem; color: var(--muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em; }
        .mini-card-value { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.1rem; }
        .mini-card-sub { font-size: 0.75rem; color: var(--muted); margin-top: 4px; }
        .green { color: #6affda; }
        .pink { color: var(--accent2); }
        .purple { color: var(--accent); }

        section { padding: 100px 24px; }

        .section-inner {
          max-width: 1100px;
          margin: 0 auto;
        }

        .section-tag {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--accent);
          font-weight: 500;
          margin-bottom: 16px;
        }

        h2 {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(2rem, 4vw, 3rem);
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 16px;
        }

        .section-sub {
          color: var(--muted);
          font-size: 1.05rem;
          line-height: 1.7;
          max-width: 500px;
          margin-bottom: 60px;
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }

        .step-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s, transform 0.3s;
        }
        .step-card:hover { border-color: rgba(124,106,255,0.3); transform: translateY(-4px); }

        .step-num {
          font-family: 'Syne', sans-serif;
          font-size: 3.5rem;
          font-weight: 800;
          color: rgba(124,106,255,0.1);
          position: absolute;
          top: 16px; right: 20px;
          line-height: 1;
        }

        .step-icon { font-size: 1.8rem; margin-bottom: 16px; }

        .step-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 10px;
        }

        .step-desc { color: var(--muted); font-size: 0.9rem; line-height: 1.6; }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .feature-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 28px;
          transition: border-color 0.3s, transform 0.3s;
        }
        .feature-card:hover { border-color: rgba(124,106,255,0.25); transform: translateY(-3px); }
        .feature-card.accent-card {
          background: linear-gradient(135deg, rgba(124,106,255,0.12), rgba(255,106,155,0.08));
          border-color: rgba(124,106,255,0.2);
        }

        .feature-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.3rem;
          margin-bottom: 16px;
        }
        .icon-purple { background: rgba(124,106,255,0.15); }
        .icon-pink { background: rgba(255,106,155,0.15); }
        .icon-teal { background: rgba(106,255,218,0.15); }
        .icon-orange { background: rgba(255,180,50,0.15); }

        .feature-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 8px;
        }

        .feature-desc { color: var(--muted); font-size: 0.88rem; line-height: 1.6; }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          max-width: 800px;
        }

        .price-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 36px 32px;
          position: relative;
        }

        .price-card.featured {
          background: linear-gradient(160deg, rgba(124,106,255,0.15), rgba(255,106,155,0.08));
          border-color: rgba(124,106,255,0.35);
        }

        .price-badge {
          position: absolute;
          top: -12px; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          color: white;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 16px;
          border-radius: 100px;
          white-space: nowrap;
        }

        .price-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: var(--muted);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .price-amount {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 3rem;
          letter-spacing: -0.03em;
          line-height: 1;
          margin-bottom: 4px;
        }

        .price-period { font-size: 0.85rem; color: var(--muted); margin-bottom: 28px; }

        .price-features { list-style: none; margin-bottom: 32px; }
        .price-features li {
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
          font-size: 0.88rem;
          color: var(--muted);
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .price-features li:last-child { border-bottom: none; }
        .check { color: var(--accent3); }

        .form-wrapper { max-width: 560px; }

        .form-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 40px;
        }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-full { grid-column: 1 / -1; }

        label {
          display: block;
          font-size: 0.8rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
          font-weight: 500;
        }

        input, select {
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
        }
        input:focus, select:focus { border-color: var(--accent); }
        input::placeholder { color: var(--muted); }
        select option { background: var(--surface); }

        .form-submit {
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
          margin-top: 8px;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 0 30px rgba(124,106,255,0.25);
        }
        .form-submit:hover { opacity: 0.9; transform: translateY(-1px); }
        .form-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        footer {
          border-top: 1px solid var(--border);
          padding: 48px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-note { color: var(--muted); font-size: 0.85rem; }

        .footer-links { display: flex; gap: 24px; }
        .footer-links a { color: var(--muted); text-decoration: none; font-size: 0.85rem; transition: color 0.2s; }
        .footer-links a:hover { color: var(--text); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border), transparent);
          margin: 0 48px;
        }

        @media (max-width: 768px) {
          nav { padding: 16px 24px; }
          .nav-links { display: none; }
          .hamburger { display: flex; }
          h1 { font-size: 2.6rem; }
          .form-grid { grid-template-columns: 1fr; }
          footer { flex-direction: column; text-align: center; }
          .divider { margin: 0 24px; }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <div className="logo">
          <div className="logo-name">Nyra</div>
          <div className="logo-sub">by Financial Futures Education</div>
        </div>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="/login" className="nav-sign-in">Sign in</a>
          <a href="#signup" className="nav-cta">Get started free</a>
        </div>
        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-glow2" />
        <div className="badge"><span className="badge-dot" /> Now in early access</div>
        <h1>Never miss a bill<br /><span className="grad">ever again.</span></h1>
        <p className="hero-sub">
          Nyra sends you text reminders before your bills are due — Netflix, rent, subscriptions, everything. One place, zero stress. For everyone.
        </p>
        <div className="hero-actions">
          <a href="#signup" className="btn-primary">Start for free →</a>
          <a href="#how" className="btn-secondary">See how it works</a>
        </div>
        <p className="hero-note">No credit card needed · Takes 2 minutes to set up</p>
        <div className="hero-cards">
          <div className="mini-card">
            <div className="mini-card-label">Next due</div>
            <div className="mini-card-value purple">Netflix</div>
            <div className="mini-card-sub">in 2 days · $17.99</div>
          </div>
          <div className="mini-card">
            <div className="mini-card-label">This month</div>
            <div className="mini-card-value green">$284.50</div>
            <div className="mini-card-sub">across 6 bills</div>
          </div>
          <div className="mini-card">
            <div className="mini-card-label">Last reminder</div>
            <div className="mini-card-value pink">Sent ✓</div>
            <div className="mini-card-sub">Spotify · 3 days ago</div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="section-inner">
          <div className="section-tag">How it works</div>
          <h2>Set up in minutes,<br />stress less forever.</h2>
          <p className="section-sub">No apps to download, no complicated dashboards. Just texts that keep you on top of your money.</p>
          <div className="steps">
            {[
              { icon: "📱", title: "Enter your number", desc: "Add your phone number and we'll verify it instantly. That's your account — no passwords needed.", num: "01" },
              { icon: "📋", title: "Add your bills", desc: "Tell us what bills you pay — Netflix, rent, electricity, Spotify. Add due dates and amounts.", num: "02" },
              { icon: "🔔", title: "Get reminders", desc: "We'll text you 3 days before each bill is due so you're never caught off guard.", num: "03" },
              { icon: "✅", title: "Stay on track", desc: "Mark bills as paid, adjust dates, add new ones anytime. Total control via text.", num: "04" },
            ].map((s) => (
              <div className="step-card" key={s.num}>
                <div className="step-num">{s.num}</div>
                <div className="step-icon">{s.icon}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* FEATURES */}
      <section id="features">
        <div className="section-inner">
          <div className="section-tag">Features</div>
          <h2>Everything you need,<br />nothing you don't.</h2>
          <p className="section-sub">Built for anyone who wants to stay on top of their money without the hassle.</p>
          <div className="features-grid">
            {[
              { icon: "💬", iconClass: "icon-purple", title: "SMS Reminders", desc: "Get a text 3 days before every bill. No app required, just your phone.", accent: true },
              { icon: "📊", iconClass: "icon-teal", title: "Bill Tracking", desc: "See all your upcoming bills in one place and never get surprised by a charge." },
              { icon: "🔁", iconClass: "icon-pink", title: "Recurring Bills", desc: "Set it and forget it for monthly subscriptions — Nyra remembers so you don't have to." },
              { icon: "⚡", iconClass: "icon-orange", title: "Instant Setup", desc: "Add your first bill in under 2 minutes. Seriously, we timed it." },
              { icon: "🔒", iconClass: "icon-purple", title: "Private & Secure", desc: "We never store your card details. Your data stays yours." },
              { icon: "🎓", iconClass: "icon-teal", title: "For everyone", desc: "Whether you're a student, young professional, or just someone who hates late fees — Nyra has you covered." },
            ].map((f) => (
              <div className={`feature-card${f.accent ? " accent-card" : ""}`} key={f.title}>
                <div className={`feature-icon ${f.iconClass}`}>{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      <section id="pricing">
        <div className="section-inner">
          <div className="section-tag">Pricing</div>
          <h2>One simple price.<br />No surprises.</h2>
          <p className="section-sub">Pay only for what you need. $1 per bill, per month. Add 3 bills, pay $3. That's it — no hidden fees, no complicated tiers.</p>
          <div className="pricing-grid">
            <div className="price-card featured" style={{maxWidth:"420px"}}>
              <div className="price-name">Pay per bill</div>
              <div className="price-amount">$1</div>
              <div className="price-period">per bill, per month</div>
              <ul className="price-features">
                <li><span className="check">✓</span> SMS reminders for every bill</li>
                <li><span className="check">✓</span> Add or remove bills anytime</li>
                <li><span className="check">✓</span> Reminders 3 days before due date</li>
                <li><span className="check">✓</span> Recurring & one-time bills</li>
                <li><span className="check">✓</span> No hidden fees. Ever.</li>
              </ul>
              <a href="#signup" className="btn-primary" style={{display:"block",textAlign:"center"}}>Get started →</a>
              <p style={{textAlign:"center", color:"var(--muted)", fontSize:"0.8rem", marginTop:"16px"}}>Example: 5 bills = $5/month</p>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* SIGNUP FORM */}
      <section id="signup">
        <div className="section-inner">
          <div className="section-tag">Get started</div>
          <h2>Set up your first<br />reminder today.</h2>
          <p className="section-sub">Takes 2 minutes. We'll text you before we text you — just to make sure it works.</p>
          <div className="form-wrapper">
            <div className="form-card">
              {success ? (
                <div style={{textAlign:"center", padding:"40px 0"}}>
                  <div style={{fontSize:"3rem", marginBottom:"16px"}}>🎉</div>
                  <div style={{fontFamily:"Syne, sans-serif", fontWeight:700, fontSize:"1.4rem", marginBottom:"12px"}}>You're in!</div>
                  <div style={{color:"var(--muted)"}}>Check your email to confirm your account, then we'll start sending your reminders.</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <div>
                      <label>First name</label>
                      <input type="text" name="firstName" placeholder="Alex" onChange={handleChange} required />
                    </div>
                    <div>
                      <label>Last name</label>
                      <input type="text" name="lastName" placeholder="Johnson" onChange={handleChange} required />
                    </div>
                    <div className="form-full">
                      <label>Phone number</label>
                      <input type="tel" name="phone" placeholder="+1 (555) 000-0000" onChange={handleChange} required />
                    </div>
                    <div className="form-full">
                      <label>Email</label>
                      <input type="email" name="email" placeholder="alex@university.edu" onChange={handleChange} required />
                    </div>
                    <div className="form-full">
                      <label>First bill to track</label>
                      <input type="text" name="billName" placeholder="e.g. Netflix, Rent, Spotify..." onChange={handleChange} required />
                    </div>
                    <div>
                      <label>Amount</label>
                      <input type="number" name="amount" placeholder="0.00" onChange={handleChange} />
                    </div>
                    <div>
                      <label>Due date</label>
                      <input type="date" name="dueDate" onChange={handleChange} />
                    </div>
                    <div className="form-full">
                      <label>How often?</label>
                      <select name="frequency" onChange={handleChange}>
                        <option>Monthly</option>
                        <option>Weekly</option>
                        <option>Yearly</option>
                        <option>One-time</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="form-submit" disabled={loading}>
                    {loading ? "Creating your account..." : "Create my account →"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="logo">
          <div className="logo-name">Nyra</div>
          <div className="logo-sub">by Financial Futures Education</div>
        </div>
        <p className="footer-note">© 2025 Nyra. Never miss a bill again.</p>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </>
  );
}
