'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const PLAN_DETAILS: Record<string, { sub: string; bills: number | string }> = {
  Basic: { sub: 'Up to 5 bills tracked',   bills: 5 },
  Plus:  { sub: 'Up to 15 bills tracked',  bills: 15 },
  Power: { sub: 'Unlimited bills tracked', bills: '∞' },
};

// ─── Confetti engine ──────────────────────────────────────────────────────────
const COLORS = ['#2177d1','#3a8ee0','#5ba3ec','#8dc4f5','#c39a35','#d4ae52','#e8c96a','#ffffff','#e0eeff','#f0f6ff'];
const SHAPES = ['circle', 'rect', 'triangle'] as const;

function makeParticle(x: number, y: number, burst: boolean) {
  const angle = burst ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
  const speed = burst ? Math.random() * 12 + 5 : Math.random() * 14 + 6;
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: Math.random() * 5 + 2,
    w: Math.random() * 10 + 4,
    h: Math.random() * 5 + 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.18,
    gravity: 0.28 + Math.random() * 0.14,
    drag: 0.97 + Math.random() * 0.02,
    life: 1,
    decay: 0.011 + Math.random() * 0.008,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WelcomePage() {
  return <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter,sans-serif',color:'#7a90aa'}}>Loading...</div>}><WelcomeInner/></Suspense>;
}

function WelcomeInner() {
  const searchParams = useSearchParams();
  const name  = searchParams.get('name')  || '';
  const plan  = searchParams.get('plan')  || 'Plus';
  const price = parseInt(searchParams.get('price') || '5');

  const details = PLAN_DETAILS[plan] ?? PLAN_DETAILS.Plus;
  const firstName = name.split(' ')[0] || 'friend';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const particles = useRef<ReturnType<typeof makeParticle>[]>([]);

  const [tick1, setTick1] = useState('0');
  const [tick2, setTick2] = useState('0');

  // ── Confetti ────────────────────────────────────────────────────────────────
  function animate(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.current = particles.current.filter(p => p.life > 0);
    particles.current.forEach(p => {
      p.vx *= p.drag; p.vy *= p.drag; p.vy += p.gravity;
      p.x += p.vx; p.y += p.vy; p.rot += p.rotSpeed; p.life -= p.decay;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
      else if (p.shape === 'rect') { ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      else { ctx.beginPath(); ctx.moveTo(0, -p.r * 1.5); ctx.lineTo(p.r * 1.2, p.r); ctx.lineTo(-p.r * 1.2, p.r); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    });
    if (particles.current.length > 0) animRef.current = requestAnimationFrame(() => animate(ctx, canvas));
  }

  function launchConfetti() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cx = canvas.width / 2;
    for (let i = 0; i < 120; i++) particles.current.push(makeParticle(cx, canvas.height * 0.35, true));
    setTimeout(() => { for (let i = 0; i < 60; i++) particles.current.push(makeParticle(canvas.width * 0.15, canvas.height * 0.6, false)); }, 200);
    setTimeout(() => { for (let i = 0; i < 60; i++) particles.current.push(makeParticle(canvas.width * 0.85, canvas.height * 0.6, false)); }, 350);
    setTimeout(() => { for (let i = 0; i < 80; i++) particles.current.push(makeParticle(cx + (Math.random() - 0.5) * 80, canvas.height * 0.3, true)); }, 600);
    cancelAnimationFrame(animRef.current);
    animate(ctx, canvas);
  }

  function burstAt(x: number, y: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    for (let i = 0; i < 30; i++) particles.current.push(makeParticle(x, y, true));
    cancelAnimationFrame(animRef.current);
    animate(ctx, canvas);
  }

  // ── Counter animation ───────────────────────────────────────────────────────
  function countUp(setter: (v: string) => void, target: number | string, prefix: string, duration: number, delay: number) {
    if (target === '∞') { setTimeout(() => setter(prefix + '∞'), delay); return; }
    setTimeout(() => {
      const start = performance.now();
      function step(now: number) {
        const elapsed = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        setter(prefix + Math.round(eased * (target as number)));
        if (elapsed < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay);
  }

  // ── Canvas resize ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Launch confetti after brief delay
    setTimeout(launchConfetti, 900);

    // Start counters
    countUp(setTick1, 0,             '',  600,  2000);
    countUp(setTick2, details.bills, '',  900,  2100);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');

        :root {
          --blue:#2177d1;--blue-d:#1658a8;--blue-m:#3a8ee0;--blue-l:#5ba3ec;
          --blue-pale:rgba(33,119,209,0.08);--blue-glow:rgba(33,119,209,0.22);
          --gold:#c39a35;--gold-l:#d4ae52;
          --bg:#eef3fb;--text:#0c1524;--text2:#3a4f6a;--muted:#7a90aa;
          --border:rgba(33,119,209,0.1);
          --glass:rgba(255,255,255,0.62);--glass2:rgba(255,255,255,0.80);
          --gb:rgba(255,255,255,0.86);
          --gs:0 4px 24px rgba(33,119,209,0.09),0 1px 4px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,0.9);
          --gsl:0 24px 80px rgba(33,119,209,0.16),0 6px 20px rgba(0,0,0,0.07),inset 0 1px 0 rgba(255,255,255,0.9);
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;min-height:100vh;overflow-x:hidden;
          display:flex;flex-direction:column;align-items:center;justify-content:center;padding:100px 20px 40px;position:relative;}

        .bg-wrap{position:fixed;inset:0;z-index:0;
          background:radial-gradient(ellipse 80% 60% at 20% 10%,rgba(33,119,209,0.1) 0%,transparent 60%),
            radial-gradient(ellipse 60% 60% at 80% 80%,rgba(195,154,53,0.08) 0%,transparent 60%),
            radial-gradient(ellipse 50% 50% at 60% 30%,rgba(33,119,209,0.06) 0%,transparent 55%);}
        .bg-grid{position:fixed;inset:0;z-index:0;pointer-events:none;
          background-image:linear-gradient(rgba(33,119,209,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(33,119,209,0.035) 1px,transparent 1px);
          background-size:56px 56px;
          mask-image:radial-gradient(ellipse 70% 70% at 50% 50%,black 20%,transparent 100%);}
        .conf-canvas{position:fixed;inset:0;pointer-events:none;z-index:100;}

        /* NAV */
        .wl-nav{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:200;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 20px;height:50px;width:calc(100% - 48px);max-width:600px;
          background:var(--glass);backdrop-filter:blur(28px) saturate(2);
          border:1px solid var(--gb);border-radius:100px;box-shadow:var(--gs);
          opacity:0;animation:fadeUp .6s ease .2s forwards;}
        .logo{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.15rem;letter-spacing:-.03em;color:var(--blue);text-decoration:none;}
        .logo-gem{display:inline-block;width:5px;height:5px;background:var(--gold);border-radius:50%;margin-left:2px;margin-bottom:5px;box-shadow:0 0 8px var(--gold);vertical-align:middle;animation:gp 3s ease infinite;}
        @keyframes gp{0%,100%{box-shadow:0 0 6px var(--gold);}50%{box-shadow:0 0 16px var(--gold),0 0 28px rgba(195,154,53,.3);}}
        .nav-dash{font-size:.8rem;font-weight:600;color:white;background:var(--blue);padding:8px 20px;border-radius:100px;text-decoration:none;box-shadow:0 4px 14px var(--blue-glow);transition:background .2s,transform .15s;}
        .nav-dash:hover{background:var(--blue-d);transform:translateY(-1px);}

        /* CONTENT */
        .wl-content{position:relative;z-index:1;width:100%;max-width:580px;text-align:center;}

        /* CELEBRATION RING */
        .celebrate-ring{width:96px;height:96px;border-radius:50%;
          background:linear-gradient(135deg,var(--blue),var(--blue-m));
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 28px;
          box-shadow:0 0 0 12px rgba(33,119,209,0.08),0 0 0 24px rgba(33,119,209,0.04),0 12px 40px var(--blue-glow);
          opacity:0;animation:ringPop .7s cubic-bezier(.34,1.56,.64,1) .4s forwards;position:relative;}
        .celebrate-ring::before{content:'';position:absolute;inset:-3px;border-radius:50%;
          background:linear-gradient(135deg,var(--gold),transparent,var(--blue-l));
          z-index:-1;opacity:.5;animation:ringRotate 4s linear infinite;}
        @keyframes ringRotate{to{transform:rotate(360deg);}}
        @keyframes ringPop{from{opacity:0;transform:scale(.4);}to{opacity:1;transform:scale(1);}}
        .celebrate-icon{font-size:2.6rem;animation:iconBounce 1s cubic-bezier(.34,1.56,.64,1) .8s both;}
        @keyframes iconBounce{from{transform:scale(.3) rotate(-20deg);}to{transform:scale(1) rotate(0deg);}}

        /* HEADING */
        .welcome-eyebrow{font-size:.65rem;font-weight:600;letter-spacing:.2em;text-transform:uppercase;
          color:var(--gold);margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:10px;
          opacity:0;animation:fadeUp .6s ease .85s forwards;}
        .welcome-eyebrow::before,.welcome-eyebrow::after{content:'';width:22px;height:1.5px;background:var(--gold);opacity:.5;}
        .welcome-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;
          font-size:clamp(2.4rem,6vw,3.6rem);letter-spacing:-.04em;line-height:1.06;color:var(--text);margin-bottom:12px;
          opacity:0;animation:fadeUp .6s ease 1.0s forwards;}
        .name-highlight{background:linear-gradient(135deg,var(--blue),var(--blue-m),var(--blue-l));
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .welcome-sub{font-size:.95rem;color:var(--text2);line-height:1.8;max-width:420px;margin:0 auto 36px;
          opacity:0;animation:fadeUp .6s ease 1.15s forwards;}

        /* PLAN CARD */
        .plan-confirm{background:var(--glass);backdrop-filter:blur(24px) saturate(2);
          border:1px solid var(--gb);border-radius:22px;padding:22px 28px;
          box-shadow:var(--gsl);margin-bottom:28px;
          display:flex;align-items:center;justify-content:space-between;gap:16px;
          position:relative;overflow:hidden;opacity:0;animation:fadeUp .6s ease 1.3s forwards;}
        .plan-confirm::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,var(--blue),var(--gold),var(--blue),transparent);}
        .plan-confirm-left{text-align:left;}
        .plan-confirm-label{font-size:.6rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:4px;}
        .plan-confirm-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.2rem;letter-spacing:-.03em;color:var(--text);}
        .plan-confirm-sub{font-size:.75rem;color:var(--muted);margin-top:2px;}
        .plan-confirm-price{text-align:right;flex-shrink:0;}
        .pcp-amount{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:2rem;letter-spacing:-.04em;color:var(--blue);}
        .pcp-period{font-size:.7rem;color:var(--muted);}

        /* TICKERS */
        .ticker-row{display:flex;gap:12px;margin-bottom:28px;opacity:0;animation:fadeUp .6s ease 1.5s forwards;}
        .ticker-card{flex:1;background:var(--glass);backdrop-filter:blur(20px) saturate(2);
          border:1px solid var(--gb);border-radius:16px;padding:16px 14px;box-shadow:var(--gs);text-align:center;}
        .ticker-val{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.6rem;letter-spacing:-.04em;color:var(--blue);}
        .ticker-lbl{font-size:.65rem;color:var(--muted);margin-top:3px;line-height:1.4;}

        /* SMS PREVIEW */
        .sms-preview{background:var(--glass);backdrop-filter:blur(20px) saturate(2);
          border:1px solid var(--gb);border-radius:18px;padding:20px 22px;
          box-shadow:var(--gs);margin-bottom:24px;text-align:left;
          opacity:0;animation:fadeUp .6s ease 1.6s forwards;}
        .sms-header-row{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
        .sms-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--blue-m));
          display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;
          font-weight:800;font-size:.86rem;color:white;box-shadow:0 4px 10px var(--blue-glow);flex-shrink:0;}
        .sms-from{font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:700;color:var(--text);}
        .sms-tag{font-size:.58rem;color:var(--muted);}
        .sms-bubble{background:linear-gradient(135deg,var(--blue),var(--blue-d));
          color:white;border-radius:14px 14px 4px 14px;padding:12px 14px;font-size:.8rem;line-height:1.6;
          box-shadow:0 4px 16px var(--blue-glow);animation:bubblePop .5s cubic-bezier(.34,1.56,.64,1) 2.1s both;}
        @keyframes bubblePop{from{transform:scale(.95);opacity:.5;}to{transform:scale(1);opacity:1;}}
        .sms-time{font-size:.6rem;color:var(--muted);margin-top:8px;text-align:right;}

        /* NEXT STEPS */
        .steps-section{background:var(--glass);backdrop-filter:blur(24px) saturate(2);
          border:1px solid var(--gb);border-radius:22px;padding:28px;
          box-shadow:var(--gs);margin-bottom:24px;text-align:left;
          opacity:0;animation:fadeUp .7s ease 1.45s forwards;}
        .steps-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--text);
          margin-bottom:20px;display:flex;align-items:center;gap:8px;}
        .steps-title::after{content:'';flex:1;height:1px;background:var(--border);}
        .step-row{display:flex;align-items:flex-start;gap:14px;margin-bottom:16px;
          opacity:0;transform:translateX(-12px);animation:slideIn .5s ease forwards;}
        .step-row:nth-child(2){animation-delay:1.6s;}
        .step-row:nth-child(3){animation-delay:1.75s;}
        .step-row:nth-child(4){animation-delay:1.9s;}
        .step-row:last-child{margin-bottom:0;}
        @keyframes slideIn{to{opacity:1;transform:translateX(0);}}
        .step-num{width:30px;height:30px;border-radius:50%;flex-shrink:0;background:var(--blue);color:white;
          display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;
          font-size:.72rem;font-weight:800;box-shadow:0 4px 12px var(--blue-glow);}
        .step-info-title{font-family:'Plus Jakarta Sans',sans-serif;font-size:.86rem;font-weight:700;color:var(--text);margin-bottom:2px;}
        .step-info-desc{font-size:.78rem;color:var(--muted);line-height:1.55;}

        /* IMPACT STRIP */
        .impact-strip{display:flex;align-items:center;gap:10px;
          background:linear-gradient(135deg,rgba(33,119,209,.07),rgba(195,154,53,.05));
          border:1px solid rgba(33,119,209,.12);border-radius:14px;
          padding:13px 20px;margin-bottom:24px;
          opacity:0;animation:fadeUp .6s ease 1.9s forwards;}
        .is-text{font-size:.78rem;color:var(--text2);line-height:1.5;}
        .is-text strong{color:var(--blue);}

        /* CTA */
        .cta-wrap{display:flex;flex-direction:column;gap:10px;opacity:0;animation:fadeUp .6s ease 2.0s forwards;}
        .btn-primary{display:flex;align-items:center;justify-content:center;gap:8px;
          background:var(--blue);color:white;padding:15px 32px;border-radius:14px;
          font-family:'Plus Jakarta Sans',sans-serif;font-size:.94rem;font-weight:700;
          text-decoration:none;box-shadow:0 6px 26px var(--blue-glow);
          transition:background .2s,transform .15s,box-shadow .2s;}
        .btn-primary:hover{background:var(--blue-d);transform:translateY(-2px);box-shadow:0 10px 34px var(--blue-glow);}

        .footer-note{font-size:.72rem;color:var(--muted);margin-top:20px;opacity:0;animation:fadeUp .6s ease 2.1s forwards;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}

        @media(max-width:480px){
          .welcome-h{font-size:2.2rem;}
          .plan-confirm{flex-direction:column;text-align:center;}
          .ticker-val{font-size:1.3rem;}
          .wl-nav{width:calc(100% - 28px);}
        }
      `}</style>

      <div className="bg-wrap" />
      <div className="bg-grid" />
      <canvas ref={canvasRef} className="conf-canvas" onClick={e => burstAt(e.clientX, e.clientY)} />

      {/* NAV */}
      <nav className="wl-nav">
        <a href="/" className="logo">Nyra<span className="logo-gem" /></a>
        <a href="/dashboard" className="nav-dash">Go to dashboard →</a>
      </nav>

      {/* CONTENT */}
      <div className="wl-content">

        {/* Celebration ring */}
        <div className="celebrate-ring">
          <div className="celebrate-icon">🎉</div>
        </div>

        {/* Heading */}
        <div className="welcome-eyebrow">You&apos;re in</div>
        <h1 className="welcome-h">
          Welcome to Nyra,<br />
          <span className="name-highlight">{firstName}</span>.
        </h1>
        <p className="welcome-sub">Your account is live. You&apos;ll never be caught off guard by a bill again — starting right now.</p>

        {/* Plan card */}
        <div className="plan-confirm">
          <div className="plan-confirm-left">
            <div className="plan-confirm-label">Your plan</div>
            <div className="plan-confirm-name">{plan}</div>
            <div className="plan-confirm-sub">{details.sub}</div>
          </div>
          <div className="plan-confirm-price">
            <div className="pcp-amount">${price}</div>
            <div className="pcp-period">/month</div>
          </div>
        </div>

        {/* Animated tickers */}
        <div className="ticker-row">
          <div className="ticker-card">
            <div className="ticker-val">{tick1}</div>
            <div className="ticker-lbl">Late fees<br />since joining</div>
          </div>
          <div className="ticker-card">
            <div className="ticker-val">{tick2}</div>
            <div className="ticker-lbl">Bills you can<br />track</div>
          </div>
          <div className="ticker-card">
            <div className="ticker-val">100</div>
            <div className="ticker-lbl">Money IQ<br />to unlock</div>
          </div>
        </div>

        {/* SMS preview */}
        <div className="sms-preview">
          <div className="sms-header-row">
            <div className="sms-av">N</div>
            <div>
              <div className="sms-from">Nyra</div>
              <div className="sms-tag">Your first reminder will look like this</div>
            </div>
          </div>
          <div className="sms-bubble">
            👋 Hey {firstName}! Your <strong>Rent</strong> of <strong>$1,500</strong> is due in <strong>3 days</strong> on the 1st. You&apos;ve got this — just wanted to give you the heads up. 💙
          </div>
          <div className="sms-time">Nyra · 3 days before your bill is due</div>
        </div>

        {/* Next steps */}
        <div className="steps-section">
          <div className="steps-title">What happens next</div>
          {[
            { title: 'Add your bills in the dashboard', desc: 'Head to your dashboard and add any bill — Nyra will suggest billing cycles with AI so setup is quick.' },
            { title: 'Set your reminder timing', desc: "Choose how many days before each bill you want a heads-up. 3 days is the most popular, but it's your call." },
            { title: 'Sit back and relax', desc: "Nyra takes it from here. You'll get a text before each bill is due — no app needed, ever." },
          ].map(({ title, desc }, i) => (
            <div key={i} className="step-row">
              <div className="step-num">{i + 1}</div>
              <div>
                <div className="step-info-title">{title}</div>
                <div className="step-info-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Impact strip */}
        <div className="impact-strip">
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>💙</span>
          <div className="is-text">
            <strong>20% of your subscription</strong> goes toward Financial Futures Education — delivering financial literacy sessions to youth across Canada. Thank you for being part of that.
          </div>
        </div>

        {/* CTA */}
        <div className="cta-wrap">
          <a href="/dashboard" className="btn-primary">Set up my first bill →</a>
        </div>

        <div className="footer-note">
          A Financial Futures Education initiative ·{' '}
          <a href="https://financialfutureseducation.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none' }}>
            financialfutureseducation.com
          </a>
        </div>

      </div>
    </>
  );
}
