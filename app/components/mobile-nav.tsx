'use client';

import { useState, useEffect } from 'react';

interface MobileNavProps {
  activePage: string;
  userName?: string;
  userPlan?: string;
}

export function MobileNav({ activePage, userName = '', userPlan = 'Plus' }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Close on escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const navItems = [
    { href: '/dashboard',    icon: '📋', label: 'My Bills' },
    { href: '/reminders',    icon: '🔔', label: 'Reminders' },
    { href: '/achievements', icon: '🏆', label: 'Achievements' },
    { href: '/learn',        icon: '🧠', label: 'Learn' },
    { href: '/analytics',    icon: '📊', label: 'Analytics' },
    { href: '/settings',     icon: '⚙️', label: 'Settings' },
  ];

  return (
    <>
      <style>{`
        /* ── MOBILE TOP BAR ── */
        .mob-topbar {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 56px;
          z-index: 200;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(20px) saturate(2);
          border-bottom: 1px solid rgba(33,119,209,0.1);
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          box-shadow: 0 2px 12px rgba(33,119,209,.06);
        }
        .mob-logo {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: 1.2rem;
          letter-spacing: -.04em;
          color: #2177d1;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .mob-gem {
          width: 6px; height: 6px;
          background: #c39a35;
          border-radius: 50%;
          box-shadow: 0 0 8px #c39a35;
          animation: mgp 3s ease infinite;
        }
        @keyframes mgp {
          0%,100%{box-shadow:0 0 6px #c39a35;}
          50%{box-shadow:0 0 14px #c39a35,0 0 24px rgba(195,154,53,.3);}
        }
        .mob-hamburger {
          width: 40px; height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(33,119,209,.12);
          background: rgba(33,119,209,.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          transition: background .2s;
        }
        .mob-hamburger:hover { background: rgba(33,119,209,.12); }
        .mob-hamburger span {
          display: block;
          width: 18px; height: 2px;
          background: #2177d1;
          border-radius: 2px;
          transition: all .3s;
        }
        .mob-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .mob-hamburger.open span:nth-child(2) { opacity: 0; }
        .mob-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* ── OVERLAY ── */
        .mob-overlay {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 300;
          background: rgba(12,21,36,.45);
          backdrop-filter: blur(4px);
          animation: mfadeIn .25s ease;
        }
        @keyframes mfadeIn { from{opacity:0} to{opacity:1} }
        .mob-overlay.visible { display: block; }

        /* ── SLIDE-IN SIDEBAR ── */
        .mob-sidebar {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: 280px;
          z-index: 400;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(32px) saturate(2);
          border-right: 1px solid rgba(255,255,255,0.9);
          box-shadow: 4px 0 40px rgba(33,119,209,.12);
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          transform: translateX(-100%);
          transition: transform .3s cubic-bezier(.34,1.56,.64,1);
        }
        .mob-sidebar.open { transform: translateX(0); }
        .mob-sb-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px 24px;
          border-bottom: 1px solid rgba(33,119,209,.1);
          margin-bottom: 20px;
        }
        .mob-sb-logo-txt {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: 1.3rem;
          letter-spacing: -.04em;
          color: #2177d1;
        }
        .mob-nav-lbl {
          font-size: .57rem;
          font-weight: 700;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: #7a90aa;
          padding: 0 8px;
          margin: 10px 0 6px;
        }
        .mob-ni {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 12px;
          font-size: .88rem;
          font-weight: 500;
          color: #3a4f6a;
          text-decoration: none;
          margin-bottom: 2px;
          transition: background .2s, color .2s;
          position: relative;
        }
        .mob-ni:hover { background: rgba(33,119,209,.08); color: #2177d1; }
        .mob-ni.on {
          background: rgba(33,119,209,.08);
          color: #2177d1;
          font-weight: 600;
        }
        .mob-ni.on::before {
          content: '';
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 60%;
          background: #2177d1;
          border-radius: 0 3px 3px 0;
        }
        .mob-ni-ic { font-size: 1rem; flex-shrink: 0; width: 20px; text-align: center; }
        .mob-sb-bot {
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid rgba(33,119,209,.1);
        }
        .mob-plan-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(33,119,209,.08);
          border: 1px solid rgba(33,119,209,.15);
          border-radius: 12px;
          padding: 10px 12px;
          margin-bottom: 12px;
        }
        .mob-pp-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: .8rem;
          font-weight: 700;
          color: #2177d1;
        }
        .mob-pp-ct { font-size: .67rem; color: #7a90aa; }
        .mob-pp-badge {
          font-size: .61rem;
          font-weight: 700;
          color: #c39a35;
          background: rgba(195,154,53,.09);
          border: 1px solid rgba(195,154,53,.2);
          border-radius: 100px;
          padding: 2px 9px;
        }
        .mob-u-row { display: flex; align-items: center; gap: 10px; padding: 8px 4px; }
        .mob-u-av {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg,#2177d1,#3a8ee0);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: .78rem; font-weight: 800; color: white; flex-shrink: 0;
        }
        .mob-u-name { font-size: .82rem; font-weight: 600; color: #0c1524; }

        /* ── SHOW ON MOBILE ── */
        @media (max-width: 768px) {
          .mob-topbar { display: flex !important; }
          /* Push main content down on mobile */
          .main { margin-left: 0 !important; padding: 72px 16px 24px !important; }
          /* Hide desktop sidebar */
          .sb { display: none !important; }
          /* Stack grids */
          .dg, .dash-grid, .charts-grid, .ach-grid, .learn-grid {
            grid-template-columns: 1fr !important;
          }
          /* Stack stats */
          .stats { grid-template-columns: repeat(2,1fr) !important; }
          /* Stack sum row */
          .sum-row { grid-template-columns: repeat(2,1fr) !important; }
          /* Stack payday inputs */
          .payday-inputs { grid-template-columns: 1fr !important; }
          /* Full width tab bar */
          .tab-bar { width: 100% !important; overflow-x: auto; }
          /* Greeting */
          .greeting { flex-direction: column; align-items: flex-start; gap: 14px; }
          /* MIQ bar */
          .miq-bar { flex-wrap: wrap; }
          .miq-right { margin-left: 0 !important; text-align: left !important; }
          /* Bill actions */
          .b-acts { flex-wrap: wrap; }
          /* XP hero */
          .xp-inner { flex-wrap: wrap; }
          .xp-stats { width: 100%; margin-left: 0 !important; }
          /* Leaderboard panel full width */
          .lb-list { padding: 10px 12px; }
          /* Analytics */
          .plan-cards { gap: 8px; }
          /* Settings tab bar scroll */
          .tab-bar { justify-content: flex-start; }
          /* Modal full width */
          .modal { margin: 0 8px; padding: 24px 20px; }
          /* AI panel */
          .ai-panel { width: calc(100vw - 40px) !important; }
          /* Badges grid */
          .badges-grid { grid-template-columns: repeat(3,1fr) !important; }
          .bdg-grid { justify-content: center; }
          /* Right col stacks below */
          .rcol { margin-top: 0; }
          /* Learn grid */
          .learn-right { order: -1; }
          /* FR2 */
          .fr2 { grid-template-columns: 1fr !important; }
          /* Hide miq right duplicate number */
          .miq-right > div:last-child { display: none; }
        }

        @media (max-width: 430px) {
          .stats { grid-template-columns: 1fr 1fr !important; }
          .xp-stats { grid-template-columns: repeat(3,1fr) !important; }
          .page-title { font-size: 1.5rem !important; }
          .miq-bar { padding: 14px 16px !important; }
          .payday-card { padding: 14px 16px !important; }
        }
      `}</style>

      {/* TOP BAR */}
      <div className="mob-topbar">
        <div className="mob-logo">
          Nyra <span className="mob-gem" />
        </div>
        <div
          className={`mob-hamburger ${open ? 'open' : ''}`}
          onClick={() => setOpen(o => !o)}
        >
          <span /><span /><span />
        </div>
      </div>

      {/* OVERLAY */}
      <div
        className={`mob-overlay ${open ? 'visible' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* SLIDE-IN SIDEBAR */}
      <div className={`mob-sidebar ${open ? 'open' : ''}`}>
        <div className="mob-sb-logo">
          <span className="mob-sb-logo-txt">Nyra</span>
          <span className="mob-gem" />
        </div>
        <div className="mob-nav-lbl">Menu</div>
        {navItems.map(item => (
          <a
            key={item.href}
            className={`mob-ni ${activePage === item.href ? 'on' : ''}`}
            href={item.href}
            onClick={() => setOpen(false)}
          >
            <span className="mob-ni-ic">{item.icon}</span>
            {item.label}
          </a>
        ))}
        <div className="mob-nav-lbl">Resources</div>
        <a className="mob-ni" href="https://financialfutureseducation.com/" target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
          <span className="mob-ni-ic">🎓</span>FFE Website
        </a>
        <div className="mob-sb-bot">
          <div className="mob-plan-pill">
            <div>
              <div className="mob-pp-name">{userPlan} Plan</div>
              <div className="mob-pp-ct">Active</div>
            </div>
            <div className="mob-pp-badge">Active</div>
          </div>
          <div className="mob-u-row">
            <div className="mob-u-av">{userName?.[0]?.toUpperCase() || '?'}</div>
            <div><div className="mob-u-name">{userName || 'Account'}</div></div>
          </div>
        </div>
      </div>
    </>
  );
}
