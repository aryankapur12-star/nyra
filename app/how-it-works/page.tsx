'use client';

import { useEffect, useRef, useState } from 'react';

const FAQS = [
  {
    q: 'Do I need to download an app?',
    a: 'Nope. Nyra is entirely web-based and SMS-based. You manage your bills at nyra-nu.vercel.app and receive reminders as text messages. There\'s nothing to download or install — ever.',
  },
  {
    q: 'What happens when I add a bill with a past due date?',
    a: 'Nyra automatically rolls it forward to the next billing cycle. So if you add a monthly bill with a due date that already passed, it will show the next upcoming due date — you never have to manually update anything.',
  },
  {
    q: 'Can I set different reminder times for each bill?',
    a: 'Yes — every bill has its own reminder setting. Your rent might need a 7-day heads-up so you can make sure the money is there. Your Netflix just needs 1 day. You\'re in full control for each bill individually.',
  },
  {
    q: 'What if I have a pre-authorized payment set up — do I still need Nyra?',
    a: 'Pre-authorized payments (PADs) are convenient but they don\'t check your balance first. If your account is low when the payment is pulled, it gets rejected and you\'re charged an NSF fee by your bank. Nyra gives you advance warning so you can make sure the money is actually there — whether the payment is manual or automatic.',
  },
  {
    q: 'How do I cancel?',
    a: 'Simply remove all your bills from the dashboard. Your subscription automatically cancels itself at the end of your current billing period. No emails, no cancellation forms, no friction.',
  },
  {
    q: 'What does the 20% to Financial Futures Education mean?',
    a: 'Nyra is built by Financial Futures Education, a company that delivers financial literacy workshops to underserved youth in shelters, group homes, and community organizations across Canada. 20% of all Nyra profits directly fund these sessions — so every subscription helps a young person learn the money skills they need.',
  },
  {
    q: 'How does the AI Coach work?',
    a: 'Nyra\'s AI Coach learns from your payment patterns and provides personalized tips. It can spot unusual charges, predict cash flow crunches, suggest optimal payment timing, and answer any money questions you have — all in plain language.',
  },
  {
    q: 'What\'s Money IQ and how do I improve it?',
    a: 'Money IQ is your financial health score from 0–100 based on on-time payments, streak consistency, and good habits. Pay bills on time, maintain streaks, and complete weekly challenges to boost your score. It\'s a fun way to track your financial growth.',
  },
];

export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  // Scroll reveal via IntersectionObserver
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) (e.target as HTMLElement).classList.add('vis'); }),
      { threshold: 0.08 }
    );
    revealRefs.current.forEach(el => { if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  function addReveal(el: HTMLElement | null, i: number) {
    revealRefs.current[i] = el;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');
        :root {
          --blue:#2177d1;--blue-d:#1658a8;--blue-m:#3a8ee0;--blue-l:#5ba3ec;
          --blue-pale:rgba(33,119,209,0.08);--blue-glow:rgba(33,119,209,0.18);
          --gold:#c39a35;--gold-l:#d4ae52;--gold-pale:rgba(195,154,53,0.09);
          --bg:#eef3fb;--text:#0c1524;--text2:#3a4f6a;--muted:#7a90aa;
          --border:rgba(33,119,209,0.1);--success:#22c55e;--warn:#f59e0b;
          --purple:#8b5cf6;--purple-pale:rgba(139,92,246,0.08);
          --glass:rgba(255,255,255,0.60);--glass2:rgba(255,255,255,0.78);
          --gb:rgba(255,255,255,0.86);
          --gs:0 4px 24px rgba(33,119,209,0.08),0 1px 4px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,0.9);
          --gsl:0 20px 70px rgba(33,119,209,0.14),0 6px 20px rgba(0,0,0,0.07),inset 0 1px 0 rgba(255,255,255,0.9);
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;overflow-x:hidden;line-height:1.75;font-size:18px;}
        
        /* Nyra brand highlight */
        .nyra-brand{color:var(--blue);font-weight:700;}

        .bg-blob{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
        .b1{width:700px;height:700px;background:radial-gradient(circle,rgba(33,119,209,0.1) 0%,transparent 70%);top:-200px;left:-200px;animation:bd1 20s ease-in-out infinite;}
        .b2{width:500px;height:500px;background:radial-gradient(circle,rgba(195,154,53,0.08) 0%,transparent 70%);bottom:5%;right:-100px;animation:bd2 25s ease-in-out infinite;}
        .b3{width:400px;height:400px;background:radial-gradient(circle,rgba(33,119,209,0.06) 0%,transparent 70%);top:50%;left:40%;animation:bd3 17s ease-in-out infinite;}
        .b4{width:350px;height:350px;background:radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 70%);top:30%;right:10%;animation:bd1 22s ease-in-out infinite;}
        @keyframes bd1{0%,100%{transform:translate(0,0)}50%{transform:translate(50px,60px)}}
        @keyframes bd2{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,-40px)}}
        @keyframes bd3{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,30px)}}

        /* NAV */
        .hiw-nav{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:200;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 10px 0 20px;height:56px;width:calc(100% - 56px);max-width:1040px;
          background:var(--glass);backdrop-filter:blur(28px) saturate(2);
          border:1px solid var(--gb);border-radius:100px;box-shadow:var(--gs);}
        .logo{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.4rem;letter-spacing:-.03em;color:var(--blue);text-decoration:none;}
        .logo-gem{display:inline-block;width:6px;height:6px;background:var(--gold);border-radius:50%;margin-left:2px;margin-bottom:5px;box-shadow:0 0 8px var(--gold);vertical-align:middle;animation:gp 3s ease infinite;}
        @keyframes gp{0%,100%{box-shadow:0 0 6px var(--gold);}50%{box-shadow:0 0 16px var(--gold),0 0 28px rgba(195,154,53,.3);}}
        .nav-links{display:flex;align-items:center;gap:6px;}
        .nl{font-size:1rem;font-weight:500;color:var(--text2);text-decoration:none;padding:8px 16px;border-radius:100px;transition:background .2s,color .2s;}
        .nl:hover{background:var(--blue-pale);color:var(--blue);}
        .nl.active{color:var(--blue);background:var(--blue-pale);font-weight:600;}
        .nbtn{background:var(--blue);color:white;padding:12px 28px;border-radius:100px;font-size:1rem;font-weight:600;text-decoration:none;box-shadow:0 4px 14px var(--blue-glow);transition:background .2s,transform .15s;}
        .nbtn:hover{background:var(--blue-d);transform:translateY(-1px);}
        .ffe-link{font-size:0.85rem;font-weight:500;color:var(--text2);text-decoration:none;padding:8px 16px;border-radius:100px;border:1px solid var(--border);background:rgba(255,255,255,.4);transition:all .2s;}
        .ffe-link:hover{color:var(--blue);background:var(--blue-pale);}

        /* HERO */
        .hiw-hero{min-height:60vh;display:flex;align-items:center;justify-content:center;padding:130px 52px 80px;text-align:center;position:relative;overflow:hidden;z-index:1;}
        .hiw-hero-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(33,119,209,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(33,119,209,.04) 1px,transparent 1px);background-size:64px 64px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 100%);}
        .hiw-hero-inner{position:relative;z-index:1;max-width:760px;}
        .hiw-pill{display:inline-flex;align-items:center;gap:10px;background:var(--glass);backdrop-filter:blur(16px);border:1px solid var(--gb);border-radius:100px;padding:10px 26px 10px 18px;font-size:0.9rem;font-weight:600;color:var(--blue);letter-spacing:.04em;text-transform:uppercase;box-shadow:var(--gs);margin-bottom:32px;opacity:0;animation:fup .6s ease .1s forwards;}
        .pill-dot{width:8px;height:8px;background:var(--gold);border-radius:50%;box-shadow:0 0 8px var(--gold);animation:gp 2.5s ease infinite;}
        .hiw-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:clamp(2.6rem,5vw,4.2rem);letter-spacing:-.04em;line-height:1.06;color:var(--text);margin-bottom:20px;opacity:0;animation:fup .6s ease .2s forwards;}
        .hiw-h span{background:linear-gradient(135deg,var(--blue),var(--blue-m),var(--blue-l));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .hiw-sub{font-size:1.15rem;color:var(--text2);line-height:1.8;max-width:540px;margin:0 auto 40px;opacity:0;animation:fup .6s ease .3s forwards;}
        .hiw-ctas{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;opacity:0;animation:fup .6s ease .4s forwards;}
        .cta-p{display:inline-flex;align-items:center;gap:10px;background:var(--blue);color:white;padding:18px 38px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:1.15rem;font-weight:700;text-decoration:none;box-shadow:0 6px 28px var(--blue-glow);transition:background .2s,transform .15s;}
        .cta-p:hover{background:var(--blue-d);transform:translateY(-2px);}
        .cta-g{display:inline-flex;align-items:center;gap:8px;color:var(--text2);font-size:1.05rem;font-weight:500;text-decoration:none;padding:18px 28px;border-radius:100px;background:var(--glass);backdrop-filter:blur(16px);border:2px solid rgba(33,119,209,.22);box-shadow:var(--gs);transition:color .2s,background .2s;}
        .cta-g:hover{color:var(--blue);background:var(--blue-pale);}
        @keyframes fup{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}

        /* STEPS SECTION */
        .steps-section{position:relative;z-index:1;padding:100px 52px;max-width:1100px;margin:0 auto;}
        .section-eyebrow{display:flex;align-items:center;gap:12px;font-size:.78rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:22px;}
        .section-eyebrow::before{content:'';width:22px;height:2px;background:var(--gold);opacity:.5;}
        .section-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:clamp(2.2rem,3.2vw,3rem);letter-spacing:-.03em;color:var(--text);margin-bottom:16px;line-height:1.12;}
        .section-p{font-size:1.08rem;color:var(--text2);max-width:480px;line-height:1.85;margin-bottom:60px;}
        .steps-timeline{display:flex;flex-direction:column;}
        .step-block{display:grid;grid-template-columns:80px 1fr;gap:0 36px;position:relative;}
        .step-block:not(:last-child)::before{content:'';position:absolute;left:39px;top:80px;bottom:-20px;width:2px;background:linear-gradient(to bottom,var(--blue),rgba(33,119,209,.1));z-index:0;}
        .step-num-col{display:flex;flex-direction:column;align-items:center;padding-top:10px;}
        .step-circle{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--blue-m));display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.2rem;color:white;box-shadow:0 6px 20px var(--blue-glow);position:relative;z-index:1;flex-shrink:0;}
        .step-content{padding:0 0 60px;}
        .step-eyebrow{font-size:.78rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;margin-top:14px;}
        .step-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:clamp(1.6rem,2.5vw,2rem);letter-spacing:-.03em;color:var(--text);margin-bottom:14px;}
        .step-p{font-size:1.08rem;color:var(--text2);line-height:1.85;margin-bottom:24px;max-width:540px;}
        .step-visual{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:20px;padding:22px 24px;box-shadow:var(--gsl);max-width:540px;position:relative;overflow:hidden;}
        .step-visual::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--blue),var(--gold),transparent);}

        /* Visual elements */
        .av-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
        .av-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--text);}
        .av-badge{font-size:.62rem;font-weight:600;color:var(--blue);background:var(--blue-pale);border:1px solid rgba(33,119,209,.15);border-radius:100px;padding:3px 10px;}
        .av-field{background:rgba(255,255,255,.75);border:1.5px solid rgba(33,119,209,.12);border-radius:10px;padding:10px 13px;margin-bottom:8px;font-size:.8rem;color:var(--text);display:flex;align-items:center;justify-content:space-between;}
        .av-field-label{font-size:.6rem;color:var(--muted);margin-bottom:1px;text-transform:uppercase;letter-spacing:.07em;}
        .av-field-val{font-weight:600;}
        .av-ai{display:flex;align-items:center;gap:8px;background:var(--blue-pale);border:1px solid rgba(33,119,209,.15);border-radius:10px;padding:9px 12px;font-size:.75rem;color:var(--blue);margin-bottom:12px;}
        .av-ai-dot{width:5px;height:5px;background:var(--blue);border-radius:50%;animation:pulse 1.5s ease infinite;flex-shrink:0;}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.3;transform:scale(.6);}}
        .av-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;}
        .av-save{width:100%;background:var(--blue);color:white;border:none;padding:10px;border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 3px 12px var(--blue-glow);}
        .vd-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;}
        .vd-stat{background:rgba(255,255,255,.65);border:1px solid var(--gb);border-radius:12px;padding:12px 14px;box-shadow:var(--gs);}
        .vd-stat-val{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.2rem;letter-spacing:-.03em;color:var(--blue);}
        .vd-stat-lbl{font-size:.62rem;color:var(--muted);margin-top:1px;}
        .vd-bill{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.65);border:1px solid var(--gb);border-radius:12px;padding:11px 14px;margin-bottom:7px;box-shadow:var(--gs);}
        .vd-bill-name{font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:700;color:var(--text);}
        .vd-bill-due{font-size:.62rem;color:var(--muted);}
        .vd-chip{font-size:.64rem;font-weight:600;padding:3px 9px;border-radius:100px;margin-left:auto;white-space:nowrap;}
        .chip-warn{background:rgba(245,158,11,.12);color:var(--warn);border:1px solid rgba(245,158,11,.2);}
        .chip-ok{background:var(--blue-pale);color:var(--blue);border:1px solid rgba(33,119,209,.15);}
        .vd-bill-amt{font-family:'Plus Jakarta Sans',sans-serif;font-size:.85rem;font-weight:700;color:var(--text);margin-left:8px;}
        .vs-phone{max-width:300px;margin:0 auto;}
        .vs-header{text-align:center;margin-bottom:16px;}
        .vs-av{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--blue-m));display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1rem;color:white;margin:0 auto 8px;box-shadow:0 4px 14px var(--blue-glow);}
        .vs-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--text);}
        .vs-sub{font-size:.64rem;color:var(--muted);}
        .vs-bubble{background:linear-gradient(135deg,var(--blue),var(--blue-d));color:white;border-radius:16px 16px 4px 16px;padding:12px 14px;font-size:.78rem;line-height:1.6;box-shadow:0 4px 16px var(--blue-glow);margin-bottom:8px;}
        .vs-bubble2{background:linear-gradient(135deg,var(--gold),#a07820);color:white;border-radius:16px 16px 16px 4px;padding:10px 14px;font-size:.75rem;margin-left:20px;box-shadow:0 4px 14px rgba(195,154,53,.25);}
        .vs-time{font-size:.6rem;color:var(--muted);text-align:center;margin-top:8px;}
        .vp-grid{display:flex;flex-direction:column;gap:8px;}
        .vp-notif{background:rgba(255,255,255,.72);backdrop-filter:blur(20px) saturate(2.5);border:1px solid rgba(255,255,255,.92);border-radius:13px;padding:10px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 2px 10px rgba(33,119,209,.07),inset 0 1px 0 rgba(255,255,255,.95);}
        .vp-icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0;}
        .vp-app{font-size:.6rem;font-weight:700;color:var(--muted);letter-spacing:.04em;}
        .vp-msg{font-size:.72rem;font-weight:600;color:var(--text);}
        .vp-check{color:#22c55e;font-size:.95rem;font-weight:700;}

        /* ═══════════════════════════════════════════════════════════════════════════
           GAMIFICATION SECTION
           ═══════════════════════════════════════════════════════════════════════════ */
        .gamification-section{position:relative;z-index:1;padding:100px 52px;background:linear-gradient(180deg,var(--bg) 0%,rgba(139,92,246,0.03) 50%,var(--bg) 100%);}
        .gam-inner{max-width:1100px;margin:0 auto;}
        .gam-header{text-align:center;margin-bottom:60px;}
        .gam-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
        
        /* Gamification Cards */
        .gam-card{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:24px;padding:28px;box-shadow:var(--gsl);position:relative;overflow:hidden;transition:transform .3s,box-shadow .3s;}
        .gam-card:hover{transform:translateY(-4px);box-shadow:0 24px 80px rgba(33,119,209,0.18);}
        .gam-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:24px 24px 0 0;}
        .gam-card.streak::before{background:linear-gradient(90deg,#f59e0b,#ef4444,#f59e0b);}
        .gam-card.moneyiq::before{background:linear-gradient(90deg,var(--blue),var(--purple),var(--blue));}
        .gam-card.achieve::before{background:linear-gradient(90deg,var(--gold),#d4ae52,var(--gold));}
        .gam-card.leader::before{background:linear-gradient(90deg,#22c55e,#10b981,#22c55e);}
        
        .gam-card-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin-bottom:18px;}
        .gam-card.streak .gam-card-icon{background:rgba(245,158,11,.12);}
        .gam-card.moneyiq .gam-card-icon{background:var(--purple-pale);}
        .gam-card.achieve .gam-card-icon{background:var(--gold-pale);}
        .gam-card.leader .gam-card-icon{background:rgba(34,197,94,.1);}
        
        .gam-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.25rem;color:var(--text);margin-bottom:10px;letter-spacing:-.02em;}
        .gam-card-desc{font-size:1.02rem;color:var(--text2);line-height:1.75;margin-bottom:20px;}
        
        /* Streak Visual */
        .streak-visual{display:flex;align-items:center;gap:6px;}
        .streak-day{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;transition:transform .2s;}
        .streak-day.done{background:linear-gradient(135deg,#f59e0b,#ef4444);color:white;box-shadow:0 3px 12px rgba(245,158,11,.3);}
        .streak-day.today{background:var(--blue);color:white;animation:streakPulse 2s ease infinite;box-shadow:0 3px 12px var(--blue-glow);}
        .streak-day.future{background:rgba(33,119,209,.08);color:var(--muted);border:1.5px dashed rgba(33,119,209,.2);}
        @keyframes streakPulse{0%,100%{box-shadow:0 3px 12px var(--blue-glow);}50%{box-shadow:0 3px 20px rgba(33,119,209,.4);}}
        .streak-count{margin-left:auto;text-align:right;}
        .streak-num{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:2rem;color:#f59e0b;letter-spacing:-.03em;line-height:1;}
        .streak-label{font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;}
        
        /* Money IQ Visual */
        .moneyiq-visual{display:flex;align-items:center;gap:20px;}
        .iq-circle{width:90px;height:90px;border-radius:50%;background:conic-gradient(var(--purple) 0deg,var(--purple) 266deg,rgba(139,92,246,.15) 266deg);display:flex;align-items:center;justify-content:center;position:relative;box-shadow:0 6px 24px rgba(139,92,246,.2);} /* 266deg = 74% of 360 */
        .iq-circle::before{content:'';position:absolute;width:70px;height:70px;background:white;border-radius:50%;}
        .iq-score{position:relative;z-index:1;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.5rem;color:var(--purple);letter-spacing:-.03em;}
        .iq-breakdown{flex:1;}
        .iq-item{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);}
        .iq-item:last-child{border-bottom:none;}
        .iq-item-name{font-size:.75rem;color:var(--text2);}
        .iq-item-val{font-size:.75rem;font-weight:700;color:var(--success);}
        
        /* Achievements Visual */
        .achieve-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
        .achieve-badge{background:rgba(255,255,255,.7);border:1px solid var(--gb);border-radius:12px;padding:12px 8px;text-align:center;transition:transform .2s,box-shadow .2s;}
        .achieve-badge:hover{transform:scale(1.05);box-shadow:var(--gs);}
        .achieve-badge.locked{opacity:.4;filter:grayscale(1);}
        .achieve-icon{font-size:1.4rem;margin-bottom:4px;}
        .achieve-name{font-size:.6rem;font-weight:600;color:var(--text);line-height:1.3;}
        
        /* Leaderboard Visual */
        .leader-list{display:flex;flex-direction:column;gap:8px;}
        .leader-row{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.6);border:1px solid var(--gb);border-radius:12px;padding:10px 14px;}
        .leader-row.you{background:linear-gradient(135deg,rgba(34,197,94,.08),rgba(34,197,94,.02));border-color:rgba(34,197,94,.2);}
        .leader-rank{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.9rem;color:var(--muted);width:24px;}
        .leader-row:nth-child(1) .leader-rank{color:#fbbf24;}
        .leader-row:nth-child(2) .leader-rank{color:#94a3b8;}
        .leader-row:nth-child(3) .leader-rank{color:#d97706;}
        .leader-avatar{width:32px;height:32px;border-radius:50%;background:var(--blue-pale);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:var(--blue);}
        .leader-name{flex:1;font-size:.8rem;font-weight:600;color:var(--text);}
        .leader-score{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.85rem;color:var(--purple);}
        
        /* ═══════════════════════════════════════════════════════════════════════════
           AI FEATURES SECTION
           ═══════════════════════════════════════════════════════════════════════════ */
        .ai-section{position:relative;z-index:1;padding:100px 52px;background:linear-gradient(180deg,var(--bg) 0%,rgba(33,119,209,0.04) 100%);}
        .ai-inner{max-width:1100px;margin:0 auto;}
        .ai-header{text-align:center;margin-bottom:60px;}
        .ai-header .section-eyebrow{justify-content:center;}
        .ai-header .section-eyebrow::before{display:none;}
        
        .ai-bento{display:grid;grid-template-columns:1.2fr 0.8fr;grid-template-rows:auto auto;gap:20px;}
        
        /* AI Coach Card (large) */
        .ai-coach-card{grid-row:span 2;background:linear-gradient(145deg,rgba(33,119,209,0.06),rgba(195,154,53,0.03));backdrop-filter:blur(22px);border:1px solid var(--gb);border-radius:28px;padding:32px;box-shadow:var(--gsl);position:relative;overflow:hidden;}
        .ai-coach-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--blue),var(--gold),var(--blue));}
        .ai-coach-header{display:flex;align-items:center;gap:14px;margin-bottom:24px;}
        .ai-coach-avatar{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,var(--blue),var(--blue-m));display:flex;align-items:center;justify-content:center;font-size:1.5rem;box-shadow:0 6px 20px var(--blue-glow);}
        .ai-coach-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.4rem;color:var(--text);letter-spacing:-.02em;}
        .ai-coach-sub{font-size:.9rem;color:var(--muted);}
        .ai-coach-badge{display:inline-flex;align-items:center;gap:5px;background:var(--gold-pale);border:1px solid rgba(195,154,53,.2);border-radius:100px;padding:5px 14px;font-size:.72rem;font-weight:600;color:var(--gold);margin-top:4px;}
        
        .ai-chat{margin-bottom:20px;}
        .ai-msg{margin-bottom:12px;max-width:85%;}
        .ai-msg.user{margin-left:auto;text-align:right;}
        .ai-msg-bubble{display:inline-block;padding:12px 16px;border-radius:16px;font-size:.82rem;line-height:1.6;}
        .ai-msg.bot .ai-msg-bubble{background:white;border:1px solid var(--gb);color:var(--text);border-radius:16px 16px 16px 4px;box-shadow:var(--gs);}
        .ai-msg.user .ai-msg-bubble{background:linear-gradient(135deg,var(--blue),var(--blue-d));color:white;border-radius:16px 16px 4px 16px;box-shadow:0 4px 14px var(--blue-glow);}
        .ai-msg-time{font-size:.6rem;color:var(--muted);margin-top:4px;}
        
        .ai-input-mock{display:flex;align-items:center;gap:10px;background:white;border:1.5px solid rgba(33,119,209,.15);border-radius:14px;padding:12px 16px;}
        .ai-input-mock input{flex:1;border:none;outline:none;font-size:.85rem;color:var(--text);background:transparent;}
        .ai-input-mock input::placeholder{color:var(--muted);}
        .ai-send-btn{width:36px;height:36px;border-radius:10px;background:var(--blue);border:none;color:white;font-size:.9rem;cursor:pointer;box-shadow:0 3px 10px var(--blue-glow);}
        
        /* Smaller AI Feature Cards */
        .ai-feature-card{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:20px;padding:24px;box-shadow:var(--gs);transition:transform .2s;}
        .ai-feature-card:hover{transform:translateY(-3px);}
        .ai-feature-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin-bottom:14px;}
        .ai-feature-card.insights .ai-feature-icon{background:var(--purple-pale);}
        .ai-feature-card.payment .ai-feature-icon{background:rgba(34,197,94,.1);}
        .ai-feature-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1.1rem;color:var(--text);margin-bottom:8px;}
        .ai-feature-desc{font-size:1rem;color:var(--text2);line-height:1.75;margin-bottom:16px;}
        
        .insight-tags{display:flex;flex-wrap:wrap;gap:6px;}
        .insight-tag{font-size:.65rem;font-weight:600;padding:4px 10px;border-radius:100px;background:var(--purple-pale);color:var(--purple);border:1px solid rgba(139,92,246,.15);}
        
        .payment-alert{display:flex;align-items:center;gap:10px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15);border-radius:10px;padding:10px 12px;}
        .payment-alert-icon{font-size:1rem;}
        .payment-alert-text{font-size:.72rem;color:var(--text2);line-height:1.5;}
        .payment-alert-text strong{color:var(--warn);}

        /* DASHBOARD PREVIEW */
        .dash-preview-section{position:relative;z-index:1;padding:80px 52px;background:linear-gradient(180deg,rgba(33,119,209,.03) 0%,rgba(195,154,53,.02) 100%);border-top:1px solid var(--border);}
        .dp-inner{max-width:1020px;margin:0 auto;}
        .dp-header{max-width:500px;margin-bottom:52px;}
        .dash-mock{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:24px;padding:24px;box-shadow:var(--gsl);position:relative;overflow:visible;}
        .dm-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
        .dm-greeting{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.1rem;letter-spacing:-.03em;color:var(--text);}
        .dm-addbtn{background:var(--blue);color:white;padding:7px 16px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.75rem;font-weight:700;border:none;box-shadow:0 3px 12px var(--blue-glow);}
        .dm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px;}
        .dm-stat{background:rgba(255,255,255,.65);border:1px solid var(--gb);border-radius:14px;padding:14px 16px;box-shadow:var(--gs);}
        .dm-stat-val{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.3rem;letter-spacing:-.03em;color:var(--text);}
        .dm-stat-lbl{font-size:.64rem;color:var(--muted);margin-top:1px;}
        .dm-grid{display:grid;grid-template-columns:1fr 300px;gap:14px;}
        .dm-panel{background:rgba(255,255,255,.55);border:1px solid var(--gb);border-radius:16px;overflow:hidden;box-shadow:var(--gs);}
        .dm-panel-h{padding:14px 16px 10px;border-bottom:1px solid var(--border);font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;font-weight:700;color:var(--text);}
        .dm-bill-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(33,119,209,.05);}
        .dm-bill-row:last-child{border-bottom:none;}
        .dm-bill-name{font-size:.78rem;font-weight:600;color:var(--text);flex:1;}
        .dm-bill-chip{font-size:.6rem;font-weight:600;padding:2px 8px;border-radius:100px;}
        .dm-bill-amt{font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;font-weight:700;color:var(--text);margin-left:6px;}
        .annotation{position:absolute;z-index:10;display:flex;align-items:center;gap:8px;pointer-events:none;}
        .ann-line{height:1px;background:var(--gold);opacity:.7;flex-shrink:0;}
        .ann-dot{width:8px;height:8px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px var(--gold);flex-shrink:0;animation:gp 2s ease infinite;}
        .ann-card{background:white;border:1px solid rgba(195,154,53,.25);border-radius:10px;padding:7px 12px;box-shadow:0 4px 16px rgba(195,154,53,.15);white-space:nowrap;}
        .ann-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-size:.72rem;font-weight:700;color:var(--text);}
        .ann-card-sub{font-size:.62rem;color:var(--muted);}

        /* FAQ */
        .faq-section{position:relative;z-index:1;padding:100px 52px;max-width:860px;margin:0 auto;}
        .faq-list{margin-top:52px;display:flex;flex-direction:column;gap:12px;}
        .faq-item{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:20px;overflow:hidden;box-shadow:var(--gs);transition:box-shadow .2s;}
        .faq-item:hover{box-shadow:var(--gsl);}
        .faq-q{display:flex;align-items:center;justify-content:space-between;padding:22px 26px;cursor:pointer;gap:18px;}
        .faq-q-text{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1.05rem;color:var(--text);}
        .faq-icon{width:32px;height:32px;border-radius:50%;background:var(--blue-pale);border:1px solid rgba(33,119,209,.15);display:flex;align-items:center;justify-content:center;font-size:.8rem;color:var(--blue);flex-shrink:0;font-weight:700;transition:transform .3s,background .2s;}
        .faq-icon.open{transform:rotate(45deg);background:var(--blue);color:white;}
        .faq-a{overflow:hidden;transition:max-height .4s ease,padding .3s;max-height:0;padding:0 26px;}
        .faq-a.open{max-height:320px;padding:0 26px 22px;}
        .faq-a-text{font-size:1rem;color:var(--text2);line-height:1.85;}

        /* CTA STRIP */
        .cta-strip{position:relative;z-index:1;margin:0 52px 100px;border-radius:28px;overflow:hidden;background:linear-gradient(135deg,var(--blue) 0%,var(--blue-d) 50%,#1245a0 100%);padding:60px;text-align:center;box-shadow:0 20px 80px rgba(33,119,209,.25);}
        .cta-strip::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:48px 48px;}
        .cta-strip-inner{position:relative;z-index:1;}
        .cta-strip-eyebrow{font-size:.78rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.65);margin-bottom:18px;}
        .cta-strip-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:clamp(2rem,3.5vw,3rem);letter-spacing:-.04em;color:white;margin-bottom:16px;line-height:1.12;}
        .cta-strip-p{font-size:1.05rem;color:rgba(255,255,255,.8);max-width:460px;margin:0 auto 36px;line-height:1.85;}
        .cta-strip-btns{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;}
        .strip-btn-p{display:inline-flex;align-items:center;gap:10px;background:white;color:var(--blue);padding:18px 38px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:1.05rem;font-weight:700;text-decoration:none;box-shadow:0 4px 20px rgba(0,0,0,.15);transition:transform .15s,box-shadow .2s;}
        .strip-btn-p:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.2);}
        .strip-btn-g{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.12);color:white;padding:18px 28px;border-radius:100px;font-size:1rem;font-weight:500;text-decoration:none;border:1px solid rgba(255,255,255,.25);backdrop-filter:blur(10px);transition:background .2s;}
        .strip-btn-g:hover{background:rgba(255,255,255,.2);}

        /* FOOTER */
        .hiw-footer{position:relative;z-index:1;padding:40px 52px;border-top:1px solid var(--border);background:var(--glass);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px;}
        .f-logo{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.3rem;letter-spacing:-.03em;color:var(--blue);text-decoration:none;}
        .f-links{display:flex;gap:26px;}
        .f-link{font-size:.88rem;color:var(--muted);text-decoration:none;font-weight:500;transition:color .2s;}
        .f-link:hover{color:var(--blue);}
        .f-copy{font-size:.82rem;color:var(--muted);}

        /* SCROLL REVEAL */
        .reveal,.reveal-s{opacity:0;transition:opacity .85s cubic-bezier(.16,1,.3,1),transform .85s cubic-bezier(.16,1,.3,1);}
        .reveal{transform:translateY(24px);}.reveal-s{transform:scale(.97) translateY(12px);}
        .reveal.vis,.reveal-s.vis{opacity:1;transform:none;}
        .d1{transition-delay:.1s;}.d2{transition-delay:.2s;}.d3{transition-delay:.3s;}.d4{transition-delay:.4s;}

        @media(max-width:900px){
          .dm-grid{grid-template-columns:1fr;}
          .dm-stats{grid-template-columns:repeat(2,1fr);}
          .steps-section,.dash-preview-section,.faq-section,.gamification-section,.ai-section{padding:60px 24px;}
          .cta-strip{margin:0 20px 60px;padding:36px 24px;}
          .gam-grid{grid-template-columns:1fr;}
          .ai-bento{grid-template-columns:1fr;grid-template-rows:auto;}
          .ai-coach-card{grid-row:auto;}
        }
        @media(max-width:640px){
          .hiw-nav{width:calc(100% - 28px);padding:0 14px;}
          .nl{display:none;}
          .hiw-hero{padding:100px 20px 60px;}
          .hiw-footer{padding:24px 20px;flex-direction:column;text-align:center;}
          .step-block{grid-template-columns:56px 1fr;gap:0 16px;}
          .vd-row{grid-template-columns:repeat(2,1fr);}
          .dm-stats{grid-template-columns:repeat(2,1fr);}
          .achieve-grid{grid-template-columns:repeat(2,1fr);}
        }
      `}</style>

      <div className="bg-blob b1" />
      <div className="bg-blob b2" />
      <div className="bg-blob b3" />
      <div className="bg-blob b4" />

      {/* NAV */}
      <nav className="hiw-nav">
        <a href="/" className="logo">Nyra<span className="logo-gem" /></a>
        <a href="https://financialfutureseducation.com/" className="ffe-link" target="_blank" rel="noreferrer">Financial Futures Education ↗</a>
        <div className="nav-links">
          <a href="/" className="nl">Home</a>
          <a href="/how-it-works" className="nl active">How it works</a>
          <a href="/#pricing" className="nl">Pricing</a>
          <a href="/#pricing" className="nbtn">Get started</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hiw-hero">
        <div className="hiw-hero-grid" />
        <div className="hiw-hero-inner">
          <div className="hiw-pill"><span className="pill-dot" />How Nyra Works</div>
          <h1 className="hiw-h">Simple to set up.<br /><span>Nyra handles the rest.</span></h1>
          <p className="hiw-sub">From adding your first bill to never missing a due date again — here&apos;s exactly how <span className="nyra-brand">Nyra</span> works, step by step.</p>
          <div className="hiw-ctas">
            <a href="/#pricing" className="cta-p">Start Nyra for $3/month →</a>
            <a href="#steps" className="cta-g">See the steps ↓</a>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="steps-section" id="steps">
        <div className="section-eyebrow reveal" ref={el => addReveal(el, 0)}>The Nyra Process</div>
        <h2 className="section-h reveal d1" ref={el => addReveal(el, 1)}>Four steps to never<br />miss a bill again.</h2>
        <p className="section-p reveal d2" ref={el => addReveal(el, 2)}>No learning curve. No app to babysit. Just 3 minutes of setup and <span className="nyra-brand">Nyra</span> runs itself.</p>

        <div className="steps-timeline">

          {/* Step 1 */}
          <div className="step-block reveal" ref={el => addReveal(el, 3)}>
            <div className="step-num-col"><div className="step-circle">1</div></div>
            <div className="step-content">
              <div className="step-eyebrow">Sign up for Nyra</div>
              <h3 className="step-h">Pick your Nyra plan, enter your details.</h3>
              <p className="step-p">Choose the plan that fits — Nyra Basic for essentials, Nyra Plus for most people, or Nyra Power if you track everything. Then enter your name, email, and phone. Stripe handles payment securely.</p>
              <div className="step-visual">
                <div className="av-header"><div className="av-title">Create your account</div><div className="av-badge">Step 1 of 3</div></div>
                <div className="av-field"><div><div className="av-field-label">Name</div><div className="av-field-val">John Smith</div></div></div>
                <div className="av-field"><div><div className="av-field-label">Phone</div><div className="av-field-val">+1 (416) 000-0000</div></div></div>
                <div className="av-field" style={{ marginBottom: 14 }}><div><div className="av-field-label">Plan selected</div><div className="av-field-val" style={{ color: 'var(--blue)' }}>Plus — $5/month</div></div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.72rem', color: 'var(--muted)', marginBottom: 12 }}>
                  <span style={{ color: 'var(--blue)' }}>🔒</span> Secure · Encrypted · Private
                </div>
                <button className="av-save">Continue to payment →</button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="step-block reveal d1" ref={el => addReveal(el, 4)}>
            <div className="step-num-col"><div className="step-circle">2</div></div>
            <div className="step-content">
              <div className="step-eyebrow">Add your bills</div>
              <h3 className="step-h">Nyra AI helps you add bills in seconds.</h3>
              <p className="step-p">Head to your dashboard and start adding bills. Type the name — <span className="nyra-brand">Nyra&apos;s AI</span> instantly suggests the billing cycle, typical amount, and due date. Most people finish in under 3 minutes.</p>
              <div className="step-visual">
                <div className="av-header"><div className="av-title">Add a Bill</div><div className="av-badge">AI-powered</div></div>
                <div className="av-field"><div><div className="av-field-label">Bill name</div><div className="av-field-val">Netflix</div></div></div>
                <div className="av-ai"><div className="av-ai-dot" />✦ AI suggests: Netflix · Monthly · typically $18–$23/month</div>
                <div className="av-grid">
                  <div className="av-field" style={{ margin: 0 }}><div><div className="av-field-label">Amount</div><div className="av-field-val">$18.00</div></div></div>
                  <div className="av-field" style={{ margin: 0 }}><div><div className="av-field-label">Due date</div><div className="av-field-val">12th of month</div></div></div>
                </div>
                <div className="av-grid" style={{ marginTop: 8, marginBottom: 12 }}>
                  <div className="av-field" style={{ margin: 0 }}><div><div className="av-field-label">Cycle</div><div className="av-field-val">Monthly</div></div></div>
                  <div className="av-field" style={{ margin: 0 }}><div><div className="av-field-label">Remind me</div><div className="av-field-val">3 days before</div></div></div>
                </div>
                <button className="av-save">Save Bill →</button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="step-block reveal d2" ref={el => addReveal(el, 5)}>
            <div className="step-num-col"><div className="step-circle">3</div></div>
            <div className="step-content">
              <div className="step-eyebrow">Nyra tracks everything</div>
              <h3 className="step-h">Your Nyra dashboard keeps it all organized.</h3>
              <p className="step-p">Every bill lives in your dashboard with its due date, amount, and countdown. Bills are colour-coded by urgency so you see what needs attention at a glance. <span className="nyra-brand">Nyra</span> rolls due dates forward automatically.</p>
              <div className="step-visual">
                <div className="vd-row">
                  <div className="vd-stat"><div className="vd-stat-val">3</div><div className="vd-stat-lbl">Bills tracked</div></div>
                  <div className="vd-stat"><div className="vd-stat-val">$1,903</div><div className="vd-stat-lbl">Due this month</div></div>
                  <div className="vd-stat"><div className="vd-stat-val" style={{ color: 'var(--success)' }}>0</div><div className="vd-stat-lbl">Late fees</div></div>
                </div>
                {[['🏠','Rent','chip-warn','Due in 3d','$1,800'],['🎬','Netflix','chip-ok','Due in 12d','$18'],['📱','Rogers','chip-ok','Due in 18d','$85']].map(([icon,name,cls,chip,amt]) => (
                  <div key={name} className="vd-bill">
                    <div>{icon}</div>
                    <div><div className="vd-bill-name">{name}</div><div className="vd-bill-due">Monthly</div></div>
                    <div className={`vd-chip ${cls}`}>{chip}</div>
                    <div className="vd-bill-amt">{amt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="step-block reveal d3" ref={el => addReveal(el, 6)}>
            <div className="step-num-col"><div className="step-circle" style={{ background: 'linear-gradient(135deg,var(--gold),#a07820)' }}>4</div></div>
            <div className="step-content">
              <div className="step-eyebrow" style={{ color: 'var(--gold)' }}>The Nyra payoff</div>
              <h3 className="step-h">A Nyra text arrives. You pay. Done.</h3>
              <p className="step-p"><span className="nyra-brand">Nyra</span> sends a personal SMS exactly when you asked — 1, 3, 5, or 7 days before each bill is due. No app to open, no notification to find. Just a text. You pay the bill and close every month with zero late fees.</p>
              <div className="step-visual">
                <div className="vs-phone">
                  <div className="vs-header">
                    <div className="vs-av">N</div>
                    <div className="vs-name">Nyra</div>
                    <div className="vs-sub">Bill reminder service</div>
                  </div>
                  <div className="vs-bubble">
                    👋 Hey Alex! Your <strong>Rent</strong> of <strong>$1,800</strong> is due in <strong>3 days</strong> on March 1st.<br /><br />Don&apos;t get caught off guard — you&apos;ve got this. 💙
                  </div>
                  <div className="vs-bubble2">— Nyra · Never miss a bill.</div>
                  <div className="vs-time">Today · 9:00 AM</div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 14 }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>The result — every bill, paid on time</div>
                  <div className="vp-grid">
                    {[['🏠','rgba(195,154,53,.1)','Rent','$1,800'],['🎬','rgba(229,9,20,.09)','Netflix','$18.00'],['📱','rgba(33,119,209,.09)','Rogers','$85.00']].map(([icon,bg,name,amt]) => (
                      <div key={name} className="vp-notif">
                        <div className="vp-icon" style={{ background: bg }}>{icon}</div>
                        <div style={{ flex: 1 }}><div className="vp-app">{name}</div><div className="vp-msg">Payment successful · {amt}</div></div>
                        <div className="vp-check">✓</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          GAMIFICATION SECTION
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="gamification-section" id="gamification">
        <div className="gam-inner">
          <div className="gam-header">
            <div className="section-eyebrow reveal" ref={el => addReveal(el, 50)} style={{ justifyContent: 'center' }}>Nyra Gamification</div>
            <h2 className="section-h reveal d1" ref={el => addReveal(el, 51)} style={{ textAlign: 'center' }}>Make good habits<br />actually rewarding.</h2>
            <p className="section-p reveal d2" ref={el => addReveal(el, 52)} style={{ textAlign: 'center', margin: '0 auto' }}><span className="nyra-brand">Nyra</span> turns financial responsibility into something fun. Earn streaks, boost your Money IQ, unlock achievements, and climb the leaderboard.</p>
          </div>

          <div className="gam-grid">
            {/* Streak Card */}
            <div className="gam-card streak reveal d1" ref={el => addReveal(el, 53)}>
              <div className="gam-card-icon">🔥</div>
              <div className="gam-card-title">Nyra Payment Streaks</div>
              <div className="gam-card-desc">Pay on time, keep your streak alive. Miss a payment? It resets. How long can you go?</div>
              <div className="streak-visual">
                <div className="streak-day done">M</div>
                <div className="streak-day done">T</div>
                <div className="streak-day done">W</div>
                <div className="streak-day done">T</div>
                <div className="streak-day today">F</div>
                <div className="streak-day future">S</div>
                <div className="streak-day future">S</div>
                <div className="streak-count">
                  <div className="streak-num">12</div>
                  <div className="streak-label">day streak</div>
                </div>
              </div>
            </div>

            {/* Money IQ Card */}
            <div className="gam-card moneyiq reveal d2" ref={el => addReveal(el, 54)}>
              <div className="gam-card-icon">🧠</div>
              <div className="gam-card-title">Nyra Money IQ Score</div>
              <div className="gam-card-desc">Your financial health score from 0–100. Pay on time and make smart decisions to boost it.</div>
              <div className="moneyiq-visual">
                <div className="iq-circle">
                  <div className="iq-score">74</div>
                </div>
                <div className="iq-breakdown">
                  <div className="iq-item"><span className="iq-item-name">On-time payments</span><span className="iq-item-val">+45</span></div>
                  <div className="iq-item"><span className="iq-item-name">Streak bonus</span><span className="iq-item-val">+12</span></div>
                  <div className="iq-item"><span className="iq-item-name">Challenges completed</span><span className="iq-item-val">+8</span></div>
                </div>
              </div>
            </div>

            {/* Achievements Card */}
            <div className="gam-card achieve reveal d3" ref={el => addReveal(el, 55)}>
              <div className="gam-card-icon">🏆</div>
              <div className="gam-card-title">Nyra Achievements</div>
              <div className="gam-card-desc">Unlock badges as you hit milestones. Collect them all and show off your progress.</div>
              <div className="achieve-grid">
                <div className="achieve-badge"><div className="achieve-icon">🌟</div><div className="achieve-name">First Bill</div></div>
                <div className="achieve-badge"><div className="achieve-icon">🔥</div><div className="achieve-name">7-Day Streak</div></div>
                <div className="achieve-badge"><div className="achieve-icon">💯</div><div className="achieve-name">Perfect Month</div></div>
                <div className="achieve-badge"><div className="achieve-icon">🚀</div><div className="achieve-name">Power User</div></div>
                <div className="achieve-badge"><div className="achieve-icon">🎯</div><div className="achieve-name">10 On Time</div></div>
                <div className="achieve-badge locked"><div className="achieve-icon">💎</div><div className="achieve-name">IQ 80+</div></div>
                <div className="achieve-badge locked"><div className="achieve-icon">👑</div><div className="achieve-name">30-Day Streak</div></div>
                <div className="achieve-badge locked"><div className="achieve-icon">⚡</div><div className="achieve-name">Early Bird</div></div>
              </div>
            </div>

            {/* Leaderboard Card */}
            <div className="gam-card leader reveal d4" ref={el => addReveal(el, 56)}>
              <div className="gam-card-icon">📊</div>
              <div className="gam-card-title">Nyra Weekly Leaderboard</div>
              <div className="gam-card-desc">Compete with other <span className="nyra-brand">Nyra</span> users. Top performers get featured and earn bonus IQ points.</div>
              <div className="leader-list">
                <div className="leader-row">
                  <div className="leader-rank">1</div>
                  <div className="leader-avatar">SM</div>
                  <div className="leader-name">Sarah M.</div>
                  <div className="leader-score">89</div>
                </div>
                <div className="leader-row">
                  <div className="leader-rank">2</div>
                  <div className="leader-avatar">JK</div>
                  <div className="leader-name">James K.</div>
                  <div className="leader-score">84</div>
                </div>
                <div className="leader-row you">
                  <div className="leader-rank">3</div>
                  <div className="leader-avatar" style={{ background: 'rgba(34,197,94,.15)', color: '#22c55e' }}>You</div>
                  <div className="leader-name">You 🎉</div>
                  <div className="leader-score">74</div>
                </div>
                <div className="leader-row">
                  <div className="leader-rank">4</div>
                  <div className="leader-avatar">AT</div>
                  <div className="leader-name">Alex T.</div>
                  <div className="leader-score">71</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          AI FEATURES SECTION
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="ai-section" id="ai-features">
        <div className="ai-inner">
          <div className="ai-header">
            <div className="section-eyebrow reveal" ref={el => addReveal(el, 60)}>Nyra AI Features</div>
            <h2 className="section-h reveal d1" ref={el => addReveal(el, 61)}>Your personal<br />money advisor.</h2>
            <p className="section-p reveal d2" ref={el => addReveal(el, 62)} style={{ textAlign: 'center', margin: '0 auto' }}><span className="nyra-brand">Nyra&apos;s AI</span> learns your patterns and provides intelligent insights to help you make better financial decisions.</p>
          </div>

          <div className="ai-bento">
            {/* AI Coach Card (Large) */}
            <div className="ai-coach-card reveal d1" ref={el => addReveal(el, 63)}>
              <div className="ai-coach-header">
                <div className="ai-coach-avatar">✦</div>
                <div>
                  <div className="ai-coach-title">Nyra AI Coach</div>
                  <div className="ai-coach-sub">Your 24/7 financial assistant</div>
                  <div className="ai-coach-badge">✦ Powered by Claude</div>
                </div>
              </div>
              
              <div className="ai-chat">
                <div className="ai-msg user">
                  <div className="ai-msg-bubble">My Netflix went up to $22 this month — is that normal?</div>
                  <div className="ai-msg-time">Just now</div>
                </div>
                <div className="ai-msg bot">
                  <div className="ai-msg-bubble">
                    I noticed that too! Your Netflix increased from $18 to $22 — a 22% jump. This matches Netflix&apos;s recent price increase announced last month. 📈<br /><br />
                    <strong>Tip:</strong> You could switch to the Standard plan to save $4/month, or consider sharing with family to split costs. Want me to track this for you?
                  </div>
                  <div className="ai-msg-time">Just now</div>
                </div>
              </div>
              
              <div className="ai-input-mock">
                <input type="text" placeholder="Ask Nyra anything about your bills..." readOnly />
                <button className="ai-send-btn">→</button>
              </div>
            </div>

            {/* Smart Insights Card */}
            <div className="ai-feature-card insights reveal d2" ref={el => addReveal(el, 64)}>
              <div className="ai-feature-icon">📊</div>
              <div className="ai-feature-title">Nyra Smart Insights</div>
              <div className="ai-feature-desc">Weekly AI-generated reports showing spending trends, savings opportunities, and personalized tips.</div>
              <div className="insight-tags">
                <span className="insight-tag">Weekly wrap-up</span>
                <span className="insight-tag">Spending trends</span>
                <span className="insight-tag">Savings tips</span>
                <span className="insight-tag">Bill comparison</span>
              </div>
            </div>

            {/* Payment Intelligence Card */}
            <div className="ai-feature-card payment reveal d3" ref={el => addReveal(el, 65)}>
              <div className="ai-feature-icon">🔍</div>
              <div className="ai-feature-title">Nyra Payment Intelligence</div>
              <div className="ai-feature-desc">Automatically detects unusual charges and alerts you before problems become expensive.</div>
              <div className="payment-alert">
                <div className="payment-alert-icon">⚠️</div>
                <div className="payment-alert-text">
                  <strong>Unusual charge detected:</strong> Your Spotify was $45 this month vs. usual $15. Looks like an annual subscription renewal.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ANNOTATED DASHBOARD PREVIEW */}
      <section className="dash-preview-section" id="dashboard-preview">
        <div className="dp-inner">
          <div className="dp-header">
            <div className="section-eyebrow reveal" ref={el => addReveal(el, 7)}>The Nyra Dashboard</div>
            <h2 className="section-h reveal d1" ref={el => addReveal(el, 8)}>Everything in one place.<br />Nothing you don&apos;t need.</h2>
            <p className="section-p reveal d2" ref={el => addReveal(el, 9)} style={{ marginBottom: 0 }}><span className="nyra-brand">Nyra&apos;s</span> dashboard is clean, fast, and built around one job: showing you what&apos;s due and when.</p>
          </div>
          <div className="dash-mock reveal-s d1" ref={el => addReveal(el, 10)}>
            {/* Annotations */}
            <div className="annotation" style={{ top: -18, left: 80 }}>
              <div className="ann-dot" /><div className="ann-line" style={{ width: 40 }} />
              <div className="ann-card"><div className="ann-card-title">Personalised greeting</div><div className="ann-card-sub">Updates based on time of day</div></div>
            </div>
            <div className="annotation" style={{ top: 72, right: -10, flexDirection: 'row-reverse' }}>
              <div className="ann-dot" /><div className="ann-line" style={{ width: 30 }} />
              <div className="ann-card"><div className="ann-card-title">Your stats at a glance</div><div className="ann-card-sub">Bills, total due, late fees, reminders</div></div>
            </div>
            <div className="annotation" style={{ bottom: 60, left: -10, flexDirection: 'row-reverse' }}>
              <div className="ann-dot" /><div className="ann-line" style={{ width: 24 }} />
              <div className="ann-card"><div className="ann-card-title">Colour-coded urgency</div><div className="ann-card-sub">Amber = due soon · Blue = on track</div></div>
            </div>
            {/* Mock UI */}
            <div className="dm-topbar">
              <div className="dm-greeting">Good morning, Alex 👋</div>
              <button className="dm-addbtn">＋ Add Bill</button>
            </div>
            <div className="dm-stats">
              {[['3','Bills tracked'],['$1,903','Due this month'],['0','Late fees'],['3','Reminders sent']].map(([val,lbl],i) => (
                <div key={i} className="dm-stat"><div className="dm-stat-val" style={lbl==='Late fees'?{color:'var(--success)'}:{}}>{val}</div><div className="dm-stat-lbl">{lbl}</div></div>
              ))}
            </div>
            <div className="dm-grid">
              <div className="dm-panel">
                <div className="dm-panel-h">Your Bills</div>
                {[['🏠','Rent','chip-warn','Due in 3d','$1,800'],['🎬','Netflix','chip-ok','Due in 12d','$18'],['📱','Rogers','chip-ok','Due in 18d','$85']].map(([icon,name,cls,chip,amt]) => (
                  <div key={name} className="dm-bill-row">
                    <span>{icon}</span><div className="dm-bill-name">{name}</div>
                    <div className={`dm-bill-chip ${cls}`} style={cls==='chip-warn'?{background:'rgba(245,158,11,.12)',color:'#f59e0b'}:{background:'var(--blue-pale)',color:'var(--blue)'}}>{chip}</div>
                    <div className="dm-bill-amt">{amt}</div>
                  </div>
                ))}
              </div>
              <div className="dm-panel">
                <div className="dm-panel-h">Coming Up</div>
                {[['Rent · Mar 1','Reminder: Feb 26 at 9am'],['Netflix · Mar 12','Reminder: Mar 9 at 9am'],['Rogers · Mar 18','Reminder: Mar 13 at 9am']].map(([title,sub]) => (
                  <div key={title} className="dm-bill-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                    <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text)' }}>{title}</div>
                    <div style={{ fontSize: '.64rem', color: 'var(--muted)' }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="section-eyebrow reveal" ref={el => addReveal(el, 11)}>Nyra FAQ</div>
        <h2 className="section-h reveal d1" ref={el => addReveal(el, 12)}>Everything you<br />might be wondering.</h2>
        <div className="faq-list">
          {FAQS.map((faq, i) => (
            <div key={i} className="faq-item reveal" ref={el => addReveal(el, 13 + i)}>
              <div className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="faq-q-text">{faq.q}</div>
                <div className={`faq-icon${openFaq === i ? ' open' : ''}`}>+</div>
              </div>
              <div className={`faq-a${openFaq === i ? ' open' : ''}`}>
                <p className="faq-a-text">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <div className="cta-strip reveal" ref={el => addReveal(el, 30)}>
        <div className="cta-strip-inner">
          <div className="cta-strip-eyebrow">Ready to start with Nyra?</div>
          <h2 className="cta-strip-h">Three minutes to<br />never miss a bill again.</h2>
          <p className="cta-strip-p">Join Canadians who&apos;ve stopped stressing about due dates. Plans from $3/month — and 20% of Nyra profits fund financial literacy workshops for underserved youth across Canada.</p>
          <div className="cta-strip-btns">
            <a href="/#pricing" className="strip-btn-p">Get started with Nyra →</a>
            <a href="/" className="strip-btn-g">← Back to Home</a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="hiw-footer">
        <a href="/" className="f-logo">Nyra<span style={{ color: 'var(--gold)' }}>.</span></a>
        <div className="f-links">
          <a href="https://financialfutureseducation.com/" className="f-link" target="_blank" rel="noreferrer">Financial Futures Education ↗</a>
          <a href="/#features" className="f-link">Features</a>
          <a href="/#pricing" className="f-link">Pricing</a>
        </div>
        <div className="f-copy">© 2026 Financial Futures Education</div>
      </footer>
    </>
  );
}
