'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function goSignup(plan: string, price: number) {
  window.location.href = `/signup?plan=${encodeURIComponent(plan)}&price=${price}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Landing Page
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [sttVisible, setSttVisible] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(-1);
  const storyRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroInViewRef = useRef(true);

  // ── Scroll-to-top button ──────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setSttVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Nyra name re-animation when hero scrolls back into view ──────────────
  const replayNyra = useCallback(() => {
    const fill = document.getElementById('nyraFill') as HTMLElement | null;
    const line = document.getElementById('nyraLine') as HTMLElement | null;
    const ghost = document.getElementById('nyraGhost') as HTMLElement | null;
    if (!fill || !line || !ghost) return;

    [fill, line, ghost].forEach(el => { el.style.animation = 'none'; });
    document.querySelectorAll<HTMLElement>('.sp').forEach(sp => { sp.style.animation = 'none'; });

    requestAnimationFrame(() => requestAnimationFrame(() => {
      ghost.style.animation = 'ghostIn .5s ease .1s forwards';
      fill.style.clipPath = 'inset(0 100% 0 0)';
      fill.style.animation = 'nyraR 1.3s cubic-bezier(.77,0,.18,1) .4s forwards, nyraS 8s ease infinite 2s';
      line.style.width = '0';
      line.style.animation = 'dl .8s cubic-bezier(.77,0,.18,1) 1.55s forwards';
      const delays = [1.65, 1.8, 1.9, 1.7, 2.0, 1.75];
      document.querySelectorAll<HTMLElement>('.sp').forEach((sp, i) => {
        sp.style.animation = `sparkle 2.5s ease ${delays[i]}s forwards`;
      });
    }));
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting && heroInViewRef.current) {
          heroInViewRef.current = false;
        } else if (e.isIntersecting && !heroInViewRef.current) {
          heroInViewRef.current = true;
          replayNyra();
        }
      });
    }, { threshold: 0.5 });
    obs.observe(hero);
    return () => obs.disconnect();
  }, [replayNyra]);

  // ── Scroll story ──────────────────────────────────────────────────────────
  const screens = ['sc1', 'sc2', 'sc3', 'sc4'];
  const chapters = ['ch1', 'ch2', 'ch3', 'ch4'];
  const dots = ['d0', 'd1', 'd2', 'd3'];
  const glows = [
    'radial-gradient(circle,rgba(255,80,80,.1) 0%,transparent 70%)',
    'radial-gradient(circle,rgba(33,119,209,.14) 0%,transparent 70%)',
    'radial-gradient(circle,rgba(33,119,209,.14) 0%,transparent 70%)',
    'radial-gradient(circle,rgba(52,199,89,.12) 0%,transparent 70%)',
  ];

  const animItems: Record<number, string[][]> = {
    0: [['n1a', '100'], ['n1b', '350']],
    1: [['sb1', '100'], ['sb2', '280'], ['sb3', '460']],
    2: [['sm1', '200'], ['sm2', '600']],
    3: [['p1', '0'], ['p2', '130'], ['p3', '260'], ['p4', '390'], ['p5', '520']],
  };
  const resetItems: Record<number, string[]> = {
    0: ['n1a', 'n1b'],
    1: ['sb1', 'sb2', 'sb3'],
    2: ['sm1', 'sm2'],
    3: ['p1', 'p2', 'p3', 'p4', 'p5'],
  };

  const curChRef = useRef(-1);

  const activateChapter = useCallback((i: number) => {
    if (i === curChRef.current) return;
    const prev = curChRef.current;
    if (prev >= 0) resetItems[prev]?.forEach(id => document.getElementById(id)?.classList.remove('sh'));
    curChRef.current = i;
    setCurrentChapter(i);

    screens.forEach((id, j) => document.getElementById(id)?.classList.toggle('active', j === i));
    chapters.forEach((id, j) => document.getElementById(id)?.classList.toggle('active', j === i));
    dots.forEach((id, j) => document.getElementById(id)?.classList.toggle('active', j === i));

    const glow = document.getElementById('pglow');
    if (glow) glow.style.background = glows[i];
    const pwrap = document.getElementById('pwrap');
    if (pwrap) pwrap.style.transform = `translateY(${(i - 1.5) * 9}px)`;
    const progFill = document.getElementById('progFill');
    if (progFill) progFill.style.width = `${((i + 1) / 4) * 100}%`;

    animItems[i]?.forEach(([id, delay]) => {
      setTimeout(() => document.getElementById(id)?.classList.add('sh'), Number(delay));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const el = storyRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      activateChapter(Math.min(3, Math.floor(progress * 4)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activateChapter]);

  // ── Scroll reveal ─────────────────────────────────────────────────────────
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal, .reveal-s').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');

        :root {
          --blue:#2177d1;--blue-d:#1658a8;--blue-m:#3a8ee0;
          --blue-pale:rgba(33,119,209,0.08);--blue-glow:rgba(33,119,209,0.18);
          --gold:#c39a35;--gold-light:#d4ae52;--gold-pale:rgba(195,154,53,0.09);
          --bg:#eef3fb;--bg2:#e4ecf8;
          --text:#0c1524;--text2:#3a4f6a;--muted:#7a90aa;
          --border:rgba(33,119,209,0.1);
          --glass:rgba(255,255,255,0.60);--glass2:rgba(255,255,255,0.75);
          --gb:rgba(255,255,255,0.85);
          --gs:0 4px 24px rgba(33,119,209,0.09),0 1px 4px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,0.9);
          --gsl:0 16px 60px rgba(33,119,209,0.14),0 4px 16px rgba(0,0,0,0.07),inset 0 1px 0 rgba(255,255,255,0.9);
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;overflow-x:hidden;line-height:1.75;font-size:18px;}
        
        /* Nyra brand highlight */
        .nyra-brand{color:var(--blue);font-weight:700;}

        /* BLOBS */
        .bg-blob{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
        .b1{width:700px;height:700px;background:radial-gradient(circle,rgba(33,119,209,0.11) 0%,transparent 70%);top:-180px;left:-180px;animation:bd1 20s ease-in-out infinite;}
        .b2{width:500px;height:500px;background:radial-gradient(circle,rgba(195,154,53,0.08) 0%,transparent 70%);bottom:5%;right:-100px;animation:bd2 25s ease-in-out infinite;}
        .b3{width:400px;height:400px;background:radial-gradient(circle,rgba(33,119,209,0.06) 0%,transparent 70%);top:45%;left:45%;animation:bd3 17s ease-in-out infinite;}
        @keyframes bd1{0%,100%{transform:translate(0,0)}33%{transform:translate(55px,75px)}66%{transform:translate(-35px,35px)}}
        @keyframes bd2{0%,100%{transform:translate(0,0)}33%{transform:translate(-65px,-45px)}66%{transform:translate(35px,-60px)}}
        @keyframes bd3{0%,100%{transform:translate(0,0)}50%{transform:translate(-55px,35px)}}

        /* NAV */
        .nyra-nav{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:200;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 10px 0 20px;height:56px;
          width:calc(100% - 56px);max-width:1040px;
          background:var(--glass);backdrop-filter:blur(28px) saturate(2);-webkit-backdrop-filter:blur(28px) saturate(2);
          border:1px solid var(--gb);border-radius:100px;box-shadow:var(--gs);
          opacity:0;animation:navIn .6s ease 2.1s forwards;}
        @keyframes navIn{to{opacity:1;}}
        .logo{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.6rem;letter-spacing:-.03em;color:var(--blue);text-decoration:none;}
        .logo-gem{display:inline-block;width:7px;height:7px;background:var(--gold);border-radius:50%;margin-left:2px;margin-bottom:5px;box-shadow:0 0 8px var(--gold);animation:gp 3s ease infinite;vertical-align:middle;}
        @keyframes gp{0%,100%{box-shadow:0 0 6px var(--gold);}50%{box-shadow:0 0 16px var(--gold),0 0 28px rgba(195,154,53,.3);}}
        .ffe-link{font-size:0.95rem;font-weight:500;color:var(--text2);text-decoration:none;padding:10px 18px;border-radius:100px;border:1px solid var(--border);background:rgba(255,255,255,0.4);transition:all .2s;}
        .ffe-link:hover{color:var(--blue);background:var(--blue-pale);border-color:rgba(33,119,209,0.2);}
        .nav-right{display:flex;align-items:center;gap:8px;}
        .nl{font-size:1rem;font-weight:500;color:var(--text2);text-decoration:none;padding:10px 18px;border-radius:100px;transition:background .2s,color .2s;}
        .nl:hover{background:var(--blue-pale);color:var(--blue);}
        .nbtn{background:var(--blue);color:white;padding:12px 28px;border-radius:100px;font-size:1rem;font-weight:600;text-decoration:none;box-shadow:0 4px 14px var(--blue-glow);transition:background .2s,transform .15s;}
        .nbtn:hover{background:var(--blue-d);transform:translateY(-1px);}

        /* SCROLL-TO-TOP */
        .stt{position:fixed;bottom:28px;right:28px;z-index:300;
          width:48px;height:48px;border-radius:50%;
          background:var(--glass2);backdrop-filter:blur(20px);
          box-shadow:var(--gs);cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          font-size:1.1rem;color:var(--blue);
          opacity:0;transform:translateY(12px);
          transition:opacity .3s,transform .3s,background .2s;
          border:1px solid var(--gb);}
        .stt.vis{opacity:1;transform:translateY(0);}
        .stt:hover{background:var(--glass2);}

        /* HERO */
        .hero{min-height:100vh;display:flex;align-items:center;justify-content:center;
          padding:110px 52px 80px;position:relative;overflow:hidden;text-align:center;z-index:1;}
        .hero-grid{position:absolute;inset:0;pointer-events:none;z-index:0;
          background-image:linear-gradient(rgba(33,119,209,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(33,119,209,.04) 1px,transparent 1px);
          background-size:64px 64px;
          mask-image:radial-gradient(ellipse 75% 75% at 50% 50%,black 20%,transparent 100%);}
        .hero-inner{position:relative;z-index:1;max-width:900px;}
        .hero-pill{display:inline-flex;align-items:center;gap:10px;
          background:var(--glass);backdrop-filter:blur(16px);border:1px solid var(--gb);
          border-radius:100px;padding:10px 26px 10px 18px;
          font-size:0.9rem;font-weight:600;color:var(--blue);letter-spacing:.04em;text-transform:uppercase;
          box-shadow:var(--gs);margin-top:24px;margin-bottom:16px;
          opacity:0;animation:fup .7s ease 2s forwards;}
        .hero-inner .hero-pill{display:flex;width:fit-content;margin-left:auto;margin-right:auto;}
        .pill-dot{width:8px;height:8px;background:var(--gold);border-radius:50%;box-shadow:0 0 8px var(--gold);animation:gp 2.5s ease infinite;}

        /* NYRA ANIMATION */
        .nyra-stage{position:relative;display:block;width:100%;text-align:center;}
        .nyra-ghost{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;
          font-size:clamp(7rem,20vw,14rem);line-height:.9;letter-spacing:-.04em;
          color:transparent;-webkit-text-stroke:2px rgba(33,119,209,0.14);
          display:inline-block;opacity:0;animation:ghostIn .5s ease .4s forwards;}
        @keyframes ghostIn{to{opacity:1;}}
        .nyra-fill{position:absolute;top:0;left:50%;transform:translateX(-50%);
          font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;
          font-size:clamp(7rem,20vw,14rem);line-height:.9;letter-spacing:-.04em;
          background:linear-gradient(135deg,#1a5fb0 0%,var(--blue) 25%,var(--blue-m) 50%,#5ba3ec 65%,var(--blue) 80%,#1a5fb0 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;background-size:300% 300%;
          clip-path:inset(0 100% 0 0);
          animation:nyraR 1.3s cubic-bezier(.77,0,.18,1) .75s forwards,nyraS 8s ease infinite 2.5s;
          filter:drop-shadow(0 0 48px rgba(33,119,209,.22));}
        @keyframes nyraR{from{clip-path:inset(0 100% 0 0);}to{clip-path:inset(0 0% 0 0);}}
        @keyframes nyraS{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
        .sparkles{position:absolute;inset:0;pointer-events:none;}
        .sp{position:absolute;width:5px;height:5px;border-radius:50%;background:var(--gold);opacity:0;animation:sparkle 2.5s ease forwards;}
        .sp:nth-child(1){top:15%;left:10%;animation-delay:1.9s;}
        .sp:nth-child(2){top:70%;left:20%;animation-delay:2.05s;}
        .sp:nth-child(3){top:20%;right:12%;animation-delay:2.15s;}
        .sp:nth-child(4){top:75%;right:18%;animation-delay:2.0s;}
        .sp:nth-child(5){top:40%;left:2%;animation-delay:2.25s;}
        .sp:nth-child(6){top:50%;right:5%;animation-delay:1.95s;}
        @keyframes sparkle{0%{opacity:0;transform:scale(0);}40%{opacity:1;transform:scale(1.2);}100%{opacity:0;transform:scale(0) translateY(-18px);}}
        .nyra-underline{position:absolute;bottom:-.12em;left:0;right:0;height:8px;border-radius:4px;
          background:linear-gradient(90deg,var(--gold),var(--gold-light));
          width:0;animation:dl .8s cubic-bezier(.77,0,.18,1) 1.9s forwards;box-shadow:0 3px 16px rgba(195,154,53,.35);}
        @keyframes dl{from{width:0}to{width:100%}}
        .hero-sub{font-size:1.35rem;color:var(--text2);margin-top:28px;line-height:1.8;max-width:680px;margin-left:auto;margin-right:auto;
          opacity:0;animation:fup .8s ease 2.2s forwards;}
        @keyframes fup{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        .hero-btns{display:flex;gap:16px;justify-content:center;margin-top:44px;opacity:0;animation:fup .8s ease 2.4s forwards;}
        .hero-btn{display:inline-flex;align-items:center;gap:10px;
          background:var(--blue);color:white;font-size:1.15rem;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;
          padding:18px 38px;border-radius:100px;text-decoration:none;
          box-shadow:0 6px 28px var(--blue-glow);transition:background .2s,transform .15s;}
        .hero-btn:hover{background:var(--blue-d);transform:translateY(-2px);}
        .hero-btn-sec{background:transparent;border:2px solid rgba(33,119,209,.22);color:var(--blue);box-shadow:none;}
        .hero-btn-sec:hover{background:var(--blue-pale);border-color:rgba(33,119,209,.35);}
        .hero-scroll{margin-top:60px;font-size:1rem;color:var(--muted);opacity:0;animation:fup .8s ease 2.6s forwards;}
        .hero-scroll span{display:inline-block;animation:bounce 1.8s ease infinite;}
        @keyframes bounce{0%,100%{transform:translateY(0);}50%{transform:translateY(5px);}}

        /* MARQUEE */
        .marquee-wrap{overflow:hidden;padding:20px 0;position:relative;z-index:1;
          background:var(--glass);backdrop-filter:blur(20px) saturate(2);
          border-top:1px solid var(--gb);border-bottom:1px solid var(--gb);box-shadow:var(--gs);}
        .marquee-track{display:flex;width:max-content;animation:mq 28s linear infinite;}
        .m-item{display:flex;align-items:center;gap:14px;padding:0 34px;border-right:1px solid var(--border);
          font-size:.95rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);}
        .m-gem{color:var(--gold);}
        @keyframes mq{from{transform:translateX(0);}to{transform:translateX(-50%);}}

        /* SOUND FAMILIAR */
        .sf-section{position:relative;z-index:1;padding:110px 52px 70px;text-align:center;}
        .sf-inner{max-width:800px;margin:0 auto;}
        .sf-eyebrow{display:inline-flex;align-items:center;gap:12px;
          font-size:.9rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:28px;}
        .sf-eyebrow::before,.sf-eyebrow::after{content:'';width:36px;height:2px;background:var(--gold);opacity:.5;}
        .sf-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;
          font-size:clamp(2.2rem,4.5vw,3.4rem);letter-spacing:-.03em;color:var(--text);margin-bottom:28px;line-height:1.1;}
        .sf-p{font-size:1.18rem;color:var(--text2);line-height:1.9;margin-bottom:48px;}
        .ch-stat{display:inline-flex;align-items:center;gap:20px;
          background:var(--glass);backdrop-filter:blur(20px) saturate(2);border:1px solid var(--gb);
          border-radius:20px;padding:22px 34px;box-shadow:var(--gs);}
        .sv{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:2.8rem;letter-spacing:-.03em;color:var(--blue);}
        .sl{font-size:1.05rem;color:var(--text2);max-width:200px;line-height:1.55;text-align:left;}
        .sf-source{font-size:.85rem;color:var(--muted);margin-top:18px;}

        /* SCROLL STORY */
        .story-section{position:relative;z-index:1;height:480vh;}
        .story-sticky{position:sticky;top:0;height:100vh;
          display:grid;grid-template-columns:1fr 1fr;align-items:center;overflow:hidden;
          background:linear-gradient(180deg,var(--bg) 0%,var(--bg2) 100%);}
        .s-prog{position:absolute;top:0;left:0;right:0;height:3px;z-index:10;background:rgba(33,119,209,.1);}
        .s-prog-fill{height:100%;width:0%;background:linear-gradient(90deg,var(--blue),var(--gold));transition:width .3s ease;}
        .phone-side{height:100vh;display:flex;align-items:center;justify-content:center;position:relative;
          background:linear-gradient(135deg,rgba(33,119,209,.04) 0%,rgba(195,154,53,.03) 100%);
          border-right:1px solid var(--border);}
        .phone-glow{position:absolute;width:480px;height:480px;border-radius:50%;filter:blur(60px);transition:background 1s ease;}
        .phone-wrap{position:relative;z-index:1;transition:transform .15s ease;}
        .phone-frame{width:420px;height:580px;border-radius:36px;
          border:1.5px solid rgba(255,255,255,.88);
          background:var(--glass);backdrop-filter:blur(32px) saturate(2.5);-webkit-backdrop-filter:blur(32px) saturate(2.5);
          box-shadow:0 0 0 .5px rgba(33,119,209,.14),0 28px 72px rgba(33,119,209,.18),0 8px 22px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.95),inset 0 -1px 0 rgba(33,119,209,.07);
          position:relative;overflow:hidden;}
        .phone-frame::before{content:'';position:absolute;top:18px;left:50%;transform:translateX(-50%);
          width:12px;height:12px;border-radius:50%;background:rgba(33,119,209,.25);z-index:20;}
        .phone-frame::after{content:'';position:absolute;inset:0;
          background:linear-gradient(145deg,rgba(255,255,255,.5) 0%,transparent 35%,transparent 65%,rgba(255,255,255,.1) 100%);
          pointer-events:none;z-index:15;border-radius:35px;}
        .phone-screen{position:absolute;inset:10px;border-radius:28px;overflow:hidden;background:linear-gradient(160deg,#f0f6ff 0%,#e8f0fc 100%);}
        .screen-state{position:absolute;inset:0;padding:36px 24px 24px;opacity:0;transition:opacity .5s ease;display:flex;flex-direction:column;}
        .screen-state.active{opacity:1;}
        .ch-dots{position:absolute;bottom:28px;left:50%;transform:translateX(-50%);display:flex;gap:10px;}
        .cd{width:10px;height:10px;border-radius:50%;background:rgba(33,119,209,.18);transition:background .3s,transform .3s;}
        .cd.active{background:var(--blue);transform:scale(1.35);}

        /* Screen 1 */
        .s1n{background:rgba(255,255,255,.75);backdrop-filter:blur(16px);border:1px solid rgba(255,100,100,.14);
          border-radius:16px;padding:20px;margin-bottom:14px;
          box-shadow:0 2px 10px rgba(255,80,80,.07),inset 0 1px 0 rgba(255,255,255,.9);
          transform:translateY(10px);opacity:0;transition:transform .5s,opacity .5s;}
        .s1n.sh{transform:translateY(0);opacity:1;}
        .s1a{font-size:.9rem;font-weight:700;color:#d04040;letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px;}
        .s1t{font-size:1.1rem;font-weight:700;color:#b03030;margin-bottom:6px;}
        .s1b{font-size:1rem;color:#c05050;line-height:1.65;}

        /* Screen 2 */
        .s2h{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;}
        .s2t{font-family:'Plus Jakarta Sans',sans-serif;font-size:1.05rem;font-weight:700;color:var(--blue);}
        .s2b-item{background:rgba(255,255,255,.75);backdrop-filter:blur(12px);border:1px solid var(--gb);
          border-radius:16px;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;
          box-shadow:0 2px 8px rgba(33,119,209,.05),inset 0 1px 0 rgba(255,255,255,.9);
          transform:translateX(14px);opacity:0;transition:transform .45s cubic-bezier(.34,1.56,.64,1),opacity .4s;}
        .s2b-item.sh{transform:translateX(0);opacity:1;}
        .s2bn{font-size:1.05rem;font-weight:700;color:var(--text);}
        .s2bd{font-size:.88rem;color:var(--muted);margin-top:4px;}
        .s2ba{font-size:1.1rem;font-weight:700;color:var(--blue);}

        /* Screen 3 */
        .s3h{text-align:center;margin-bottom:24px;}
        .s3av{width:58px;height:58px;border-radius:50%;margin:0 auto 12px;
          background:linear-gradient(135deg,var(--blue),var(--blue-m));
          display:flex;align-items:center;justify-content:center;
          font-size:1.5rem;font-weight:800;color:white;font-family:'Plus Jakarta Sans',sans-serif;
          box-shadow:0 4px 12px var(--blue-glow);}
        .s3n{font-size:1.1rem;font-weight:700;color:var(--text);}
        .s3sub{font-size:.9rem;color:var(--muted);}
        .s3bbl{border-radius:18px 18px 6px 18px;padding:16px 18px;margin-bottom:12px;font-size:1.05rem;line-height:1.7;
          transform:translateY(10px);opacity:0;transition:transform .45s cubic-bezier(.34,1.56,.64,1),opacity .4s;}
        .s3bbl.sh{transform:translateY(0);opacity:1;}
        .s3bbl.bb{background:linear-gradient(135deg,var(--blue),var(--blue-d));color:white;box-shadow:0 4px 14px var(--blue-glow);}
        .s3bbl.gb{background:linear-gradient(135deg,var(--gold),#a07820);color:white;border-radius:18px 18px 18px 6px;margin-left:20px;box-shadow:0 4px 14px rgba(195,154,53,.25);}
        .s3time{font-size:.88rem;color:var(--muted);text-align:center;margin-top:10px;}

        /* Screen 4 */
        .s4hd{font-size:.9rem;font-weight:700;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;text-align:center;margin-bottom:16px;}
        .s4n{background:rgba(255,255,255,.72);backdrop-filter:blur(20px) saturate(2.5);
          border:1px solid rgba(255,255,255,.92);border-radius:16px;padding:14px 16px;
          display:flex;align-items:center;gap:14px;margin-bottom:10px;
          box-shadow:0 2px 10px rgba(33,119,209,.07),inset 0 1px 0 rgba(255,255,255,.95);
          transform:translateY(14px) scale(.96);opacity:0;transition:transform .4s cubic-bezier(.34,1.56,.64,1),opacity .4s;}
        .s4n.sh{transform:translateY(0) scale(1);opacity:1;}
        .s4ic{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;}
        .s4tx{flex:1;min-width:0;}
        .s4ap{font-size:.82rem;font-weight:700;color:var(--muted);letter-spacing:.04em;}
        .s4ms{font-size:1rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .s4ck{color:#34c759;font-size:1.2rem;font-weight:700;}

        /* TEXT SIDE */
        .text-side{height:100vh;display:flex;align-items:center;padding:0 80px 0 68px;position:relative;}
        .story-ch{position:absolute;width:calc(100% - 148px);
          opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s ease;pointer-events:none;}
        .story-ch.active{opacity:1;transform:translateY(0);pointer-events:auto;}
        .ch-ey{display:flex;align-items:center;gap:14px;font-size:.9rem;font-weight:700;
          letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:26px;}
        .ch-ey::before{content:'';width:26px;height:2.5px;background:var(--gold);opacity:.5;}
        .ch-num{color:rgba(195,154,53,.4);}
        .ch-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;
          font-size:clamp(2.4rem,4vw,3.4rem);line-height:1.08;letter-spacing:-.03em;color:var(--text);margin-bottom:24px;}
        .ch-p{font-size:1.1rem;font-weight:400;color:var(--text2);line-height:1.85;max-width:500px;margin-bottom:34px;}
        .ch-bullets{list-style:none;margin-bottom:34px;max-width:500px;}
        .ch-bullets li{position:relative;padding-left:24px;margin-bottom:12px;font-size:1.08rem;color:var(--text2);line-height:1.7;}
        .ch-bullets li::before{content:'→';position:absolute;left:0;color:var(--blue);font-weight:700;}

        /* PRE-AUTH */
        .preauth-section{position:relative;z-index:1;padding:140px 52px;
          background:linear-gradient(135deg,rgba(33,119,209,.04) 0%,rgba(195,154,53,.03) 100%);
          border-top:1px solid var(--border);}
        .pa-inner{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;}
        .eyebrow{display:flex;align-items:center;gap:14px;font-size:.9rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:26px;}
        .eyebrow::before{content:'';width:26px;height:2.5px;background:var(--gold);opacity:.5;}
        .pa-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:clamp(2rem,3vw,2.8rem);letter-spacing:-.03em;color:var(--text);line-height:1.12;margin-bottom:26px;}
        .pa-p{font-size:1.1rem;color:var(--text2);line-height:1.85;margin-bottom:28px;}
        .pa-bullets{list-style:none;margin-bottom:28px;}
        .pa-bullets li{position:relative;padding-left:24px;margin-bottom:10px;font-size:1.05rem;color:var(--text2);line-height:1.7;}
        .pa-bullets li::before{content:'→';position:absolute;left:0;color:var(--blue);font-weight:700;}
        .pa-cards{display:flex;flex-direction:column;gap:20px;}
        .pa-card{background:var(--glass);backdrop-filter:blur(24px) saturate(2);border:1px solid var(--gb);
          border-radius:22px;padding:28px 30px;box-shadow:var(--gs);display:flex;gap:20px;align-items:flex-start;}
        .pa-card-icon{font-size:1.7rem;flex-shrink:0;margin-top:2px;}
        .pa-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-size:1.08rem;font-weight:700;color:var(--text);margin-bottom:6px;}
        .pa-card-text{font-size:1rem;color:var(--text2);line-height:1.75;}
        .pa-nsf{display:inline-flex;align-items:center;gap:12px;
          background:rgba(255,100,80,.08);border:1px solid rgba(255,100,80,.15);
          border-radius:14px;padding:14px 22px;margin-top:22px;
          font-size:1rem;color:#c04030;font-weight:500;}

        /* FEATURES */
        .features-section{position:relative;z-index:1;padding:140px 52px;max-width:1220px;margin:0 auto;}
        .sec-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:clamp(2rem,3.2vw,2.8rem);letter-spacing:-.03em;color:var(--text);margin-bottom:20px;line-height:1.12;}
        .sec-p{font-size:1.12rem;color:var(--text2);max-width:540px;line-height:1.85;margin-bottom:68px;}
        .f-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
        .f-card{background:var(--glass);backdrop-filter:blur(24px) saturate(2);-webkit-backdrop-filter:blur(24px) saturate(2);
          border:1px solid var(--gb);border-radius:24px;padding:36px 32px;box-shadow:var(--gs);
          transition:transform .25s,box-shadow .25s;}
        .f-card:hover{transform:translateY(-5px);box-shadow:var(--gsl);}
        .f-ic{width:56px;height:56px;border-radius:15px;background:var(--blue-pale);border:1px solid rgba(33,119,209,.14);
          display:flex;align-items:center;justify-content:center;font-size:1.4rem;margin-bottom:24px;}
        .f-ti{font-family:'Plus Jakarta Sans',sans-serif;font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:10px;}
        .f-de{font-size:1.02rem;color:var(--text2);line-height:1.8;}

        /* PRICING */
        .pricing-section{position:relative;z-index:1;padding:140px 52px;
          background:linear-gradient(180deg,rgba(33,119,209,.03) 0%,rgba(195,154,53,.02) 100%);
          border-top:1px solid var(--border);}
        .pricing-inner{max-width:1100px;margin:0 auto;}
        .plans-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:64px;}
        .plan-card{background:var(--glass);backdrop-filter:blur(24px) saturate(2);-webkit-backdrop-filter:blur(24px) saturate(2);
          border:1px solid var(--gb);border-radius:28px;padding:42px 38px;box-shadow:var(--gs);
          display:flex;flex-direction:column;position:relative;overflow:hidden;transition:transform .25s,box-shadow .25s;}
        .plan-card:hover{transform:translateY(-6px);box-shadow:var(--gsl);}
        .plan-card.featured{border-color:rgba(33,119,209,.28);box-shadow:var(--gsl),0 0 0 1px rgba(33,119,209,.07);background:rgba(255,255,255,.72);}
        .plan-shine{position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,transparent,var(--blue),var(--blue-m),transparent);opacity:0;}
        .plan-card.featured .plan-shine{opacity:1;}
        .plan-badge{display:inline-block;background:var(--blue);color:white;font-size:.78rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:6px 18px;border-radius:100px;margin-bottom:24px;box-shadow:0 3px 10px var(--blue-glow);}
        .plan-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.8rem;letter-spacing:-.03em;color:var(--text);margin-bottom:6px;}
        .plan-sub{font-size:1rem;color:var(--muted);margin-bottom:28px;}
        .plan-price{display:flex;align-items:flex-start;gap:5px;margin-bottom:30px;}
        .p-dollar{font-size:1.6rem;color:var(--blue);font-weight:700;margin-top:10px;font-family:'Plus Jakarta Sans',sans-serif;}
        .p-amt{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:4.5rem;line-height:1;letter-spacing:-.04em;color:var(--text);}
        .p-per{font-size:1rem;color:var(--muted);margin-top:20px;}
        .plan-div{height:1px;background:var(--border);margin-bottom:26px;}
        .plan-list{list-style:none;margin-bottom:32px;flex:1;}
        .plan-list li{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(33,119,209,.06);font-size:1rem;color:var(--text2);}
        .plan-list li:last-child{border-bottom:none;}
        .pck{width:22px;height:22px;flex-shrink:0;border-radius:50%;background:var(--blue-pale);border:1px solid rgba(33,119,209,.18);display:flex;align-items:center;justify-content:center;color:var(--blue);font-size:.65rem;font-weight:700;}
        .plan-btn{display:block;width:100%;text-align:center;padding:18px;border-radius:16px;
          font-family:'Plus Jakarta Sans',sans-serif;font-size:1.1rem;font-weight:700;
          letter-spacing:-.01em;text-decoration:none;margin-top:auto;
          transition:background .2s,transform .15s,box-shadow .2s;cursor:pointer;border:none;}
        .pb-pri{background:var(--blue);color:white;box-shadow:0 4px 18px var(--blue-glow);}
        .pb-pri:hover{background:var(--blue-d);transform:translateY(-2px);box-shadow:0 8px 26px var(--blue-glow);}
        .pb-gh{background:transparent;color:var(--blue);border:2px solid rgba(33,119,209,.22) !important;}
        .pb-gh:hover{background:var(--blue-pale);}

        /* FOOTER */
        .nyra-footer{position:relative;z-index:1;padding:48px 52px;border-top:1px solid var(--border);
          background:var(--glass);backdrop-filter:blur(20px);
          display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:24px;}
        .f-logo-wrap{display:flex;flex-direction:column;gap:8px;}
        .f-logo-text{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.5rem;letter-spacing:-.03em;color:var(--blue);}
        .f-logo-text span{color:var(--gold);}
        .f-tagline{font-size:.9rem;color:var(--muted);}
        .f-links{display:flex;gap:30px;}
        .f-link{font-size:1rem;color:var(--muted);text-decoration:none;font-weight:500;transition:color .2s;}
        .f-link:hover{color:var(--blue);}
        .f-copy{font-size:.95rem;color:var(--muted);}

        /* SCROLL REVEAL */
        .reveal,.reveal-s{opacity:0;transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1);}
        .reveal{transform:translateY(26px);}.reveal-s{transform:scale(.97) translateY(12px);}
        .reveal.vis,.reveal-s.vis{opacity:1;transform:none;}
        .d1{transition-delay:.1s;}.d2{transition-delay:.2s;}.d3{transition-delay:.3s;}
        .d4{transition-delay:.4s;}.d5{transition-delay:.5s;}.d6{transition-delay:.6s;}

        @media(max-width:900px){
          .story-sticky{grid-template-columns:1fr;grid-template-rows:auto 1fr;}
          .phone-side{height:auto;padding:40px 24px;border-right:none;border-bottom:1px solid var(--border);}
          .text-side{padding:40px 28px;}
          .pa-inner{grid-template-columns:1fr;}
          .f-grid{grid-template-columns:repeat(2,1fr);}
          .plans-grid{grid-template-columns:1fr;}
        }
        @media(max-width:640px){
          .nyra-nav{width:calc(100% - 28px);padding:0 14px;}
          .nl{display:none;}.ffe-link{display:none;}
          .hero{padding:88px 24px 76px;}
          .features-section,.pricing-section,.preauth-section{padding:80px 24px;}
          .sf-section{padding:72px 24px 40px;}
          .nyra-footer{padding:28px 24px;flex-direction:column;text-align:center;}
          .f-grid{grid-template-columns:1fr;}
          .impact-banner{padding:26px 24px;}
          .hero-sub{font-size:1.15rem;}
          .hero-btn{padding:14px 26px;font-size:1rem;}
        }
      `}</style>

      {/* Background blobs */}
      <div className="bg-blob b1" />
      <div className="bg-blob b2" />
      <div className="bg-blob b3" />

      {/* Scroll to top */}
      <button className={`stt${sttVisible ? ' vis' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>

      {/* NAV */}
      <nav className="nyra-nav">
        <a href="#" className="logo">Nyra<span className="logo-gem" /></a>
        <a href="https://financialfutureseducation.com/" className="ffe-link" target="_blank" rel="noreferrer">Financial Futures Education ↗</a>
        <div className="nav-right">
          <a href="/how-it-works" className="nl">How it works</a>
          <a href="#features" className="nl">Features</a>
          <a href="#pricing" className="nl">Pricing</a>
          <a href="/login" className="nl">Sign in</a>
          <a href="#pricing" className="nbtn">Get started</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="top" ref={heroRef}>
        <div className="hero-grid" />
        <div className="hero-inner">
          <div className="nyra-stage">
            <span className="nyra-ghost" id="nyraGhost">Nyra</span>
            <span className="nyra-fill" id="nyraFill">Nyra</span>
            <div className="sparkles">{[...Array(6)].map((_, i) => <span key={i} className="sp" />)}</div>
            <div className="nyra-underline" id="nyraLine" />
          </div>
          <div className="hero-pill"><span className="pill-dot" /> Bill Reminders That Actually Work</div>
          <p className="hero-sub">
            Stop missing bills. Stop paying late fees. <span className="nyra-brand">Nyra</span> sends you a text before every due date — so you never forget again. It&apos;s like having a financially responsible friend who actually remembers things.
          </p>
          <div className="hero-btns">
            <a href="#pricing" className="hero-btn">Start for $3/month</a>
            <a href="/how-it-works" className="hero-btn hero-btn-sec">See how Nyra works</a>
          </div>
          <div className="hero-scroll"><span>↓</span> Scroll to see the magic</div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...Array(2)].map((_, k) => (
            <div key={k} style={{ display: 'flex' }}>
              {['SMS Reminders', 'AI-Powered Setup', 'Auto-Rolling Due Dates', 'Credit Card Cycles', 'Cancel Anytime', 'No App Needed'].map(t => (
                <div key={t} className="m-item"><span className="m-gem">◆</span>{t}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* SOUND FAMILIAR */}
      <div className="sf-section">
        <div className="sf-inner reveal">
          <div className="sf-eyebrow">Sound Familiar?</div>
          <h2 className="sf-h">Why Nyra exists</h2>
          <p className="sf-p">
            Late fees are the worst tax on being human. You&apos;re not irresponsible — you&apos;re just busy. <span className="nyra-brand">Nyra</span> sends one simple text before each bill. Problem solved.
          </p>
          <div className="ch-stat">
            <div className="sv">54%</div>
            <div className="sl">of Canadians have missed at least one bill payment</div>
          </div>
          <div className="sf-source">Source: Canadian Payroll Association survey</div>
        </div>
      </div>

      {/* SCROLL STORY */}
      <div className="story-section" ref={storyRef}>
        <div className="story-sticky">
          <div className="s-prog"><div className="s-prog-fill" id="progFill" /></div>

          {/* Phone side */}
          <div className="phone-side">
            <div className="phone-glow" id="pglow" />
            <div className="phone-wrap" id="pwrap">
              <div className="phone-frame">
                <div className="phone-screen">
                  {/* Screen 1: Chaos */}
                  <div className={`screen-state${currentChapter === 0 ? ' active' : ''}`} id="sc1">
                    <div className="s1n" id="n1a">
                      <div className="s1a">⚠️ PAST DUE</div>
                      <div className="s1t">Hydro Bill — $142.50</div>
                      <div className="s1b">Due 3 days ago. A $25 late fee was added. Ouch.</div>
                    </div>
                    <div className="s1n" id="n1b">
                      <div className="s1a">⚠️ PAST DUE</div>
                      <div className="s1t">Credit Card Min — $87.00</div>
                      <div className="s1b">Due yesterday. Interest now compounding. Your wallet is crying.</div>
                    </div>
                  </div>
                  {/* Screen 2: Setup */}
                  <div className={`screen-state${currentChapter === 1 ? ' active' : ''}`} id="sc2">
                    <div className="s2h">
                      <div className="s2t">Your Nyra Bills</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>3 tracked</div>
                    </div>
                    {[
                      { name: 'Netflix', due: 'Due in 5 days', amt: '$16.99' },
                      { name: 'Rent', due: 'Due in 12 days', amt: '$1,850' },
                      { name: 'Car Insurance', due: 'Due in 18 days', amt: '$215' },
                    ].map(({ name, due, amt }, i) => (
                      <div key={name} className="s2b-item" id={`sb${i + 1}`}>
                        <div><div className="s2bn">{name}</div><div className="s2bd">{due}</div></div>
                        <div className="s2ba">{amt}</div>
                      </div>
                    ))}
                  </div>
                  {/* Screen 3: Reminder */}
                  <div className={`screen-state${currentChapter === 2 ? ' active' : ''}`} id="sc3">
                    <div className="s3h">
                      <div className="s3av">N</div>
                      <div className="s3n">Nyra</div>
                      <div className="s3sub">Your bill buddy</div>
                    </div>
                    <div className="s3bbl bb" id="sm1">Hey! 👋 Just a heads-up: your Netflix ($16.99) is due in 3 days. Time to check that your account is topped up!</div>
                    <div className="s3bbl gb" id="sm2">Thanks Nyra, you beautiful genius. On it! 🙌</div>
                    <div className="s3time">Today, 9:00 AM</div>
                  </div>
                  {/* Screen 4: Results */}
                  <div className={`screen-state${currentChapter === 3 ? ' active' : ''}`} id="sc4">
                    <div className="s4hd">This Month with Nyra</div>
                    {[
                      { icon: '🎬', bg: '#e5324222', app: 'Netflix', msg: 'Paid on time ✓' },
                      { icon: '🏠', bg: '#2177d122', app: 'Rent', msg: 'Paid on time ✓' },
                      { icon: '🚗', bg: '#34c75922', app: 'Car Insurance', msg: 'Paid on time ✓' },
                      { icon: '⚡', bg: '#f5a62322', app: 'Hydro', msg: 'Paid on time ✓' },
                      { icon: '📱', bg: '#0071e322', app: 'Phone Bill', msg: 'Paid on time ✓' },
                    ].map(({ icon, bg, app, msg }, i) => (
                      <div key={app} className="s4n" id={`p${i + 1}`}>
                        <div className="s4ic" style={{ background: bg }}>{icon}</div>
                        <div className="s4tx"><div className="s4ap">{app}</div><div className="s4ms">{msg}</div></div>
                        <div className="s4ck">✓</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="ch-dots">
                {['d0','d1','d2','d3'].map((id, i) => (
                  <div key={id} className={`cd${currentChapter === i ? ' active' : ''}`} id={id} />
                ))}
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="text-side">
            {[
              { id: 'ch1', num: '01', tag: 'The Problem', title: 'Life without\nNyra', bullets: ['54% of Canadians have missed a bill', 'Due dates scattered everywhere', 'Email reminders you ignore', 'Calendar alerts that blend in'], stat: '54%', statLabel: 'of Canadians have missed at least one bill payment', cta: null },
              { id: 'ch2', num: '02', tag: 'The Solution', title: 'Meet Nyra', bullets: ['Add bills once — Nyra remembers forever', 'Nyra auto-rolls dates each month', 'Nyra AI suggests billing cycles', '3-minute setup (we timed it)'], stat: '3 min', statLabel: 'average Nyra setup time', cta: null },
              { id: 'ch3', num: '03', tag: 'How Nyra Works', title: 'Nyra\nReminds You', bullets: ['No app to open — just SMS', 'Nyra texts before every bill', 'You pick: 1, 3, or 7 days notice', 'Reply to confirm you paid'], stat: '0', statLabel: 'late fees with Nyra', cta: null },
              { id: 'ch4', num: '04', tag: 'The Nyra Result', title: 'Nyra\nDelivers', bullets: ['Every bill paid on time', 'Credit score climbs', 'Mental load disappears', 'Future you says thanks'], stat: null, statLabel: null, cta: 'Get Nyra for $3/month →' },
            ].map(({ id, num, tag, title, bullets, stat, statLabel, cta }, i) => (
              <div key={id} className={`story-ch${i === 0 ? ' active' : ''}`} id={id}>
                <div className="ch-ey"><span className="ch-num">{num} ·</span> {tag}</div>
                <h2 className="ch-h">{title.split('\n').map((line, j) => <span key={j}>{line}{j < 2 && <br />}</span>)}</h2>
                <ul className="ch-bullets">
                  {bullets.map((b, idx) => <li key={idx}>{b}</li>)}
                </ul>
                {stat && (
                  <div className="ch-stat">
                    <div className="sv">{stat}</div>
                    <div className="sl">{statLabel}</div>
                  </div>
                )}
                {cta && (
                  <a href="#pricing" className="cta-p" style={{ display: 'inline-flex', marginTop: 8 }}>{cta}</a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRE-AUTH */}
      <div className="preauth-section">
        <div className="pa-inner">
          <div className="pa-left reveal">
            <div className="eyebrow">Nyra + Pre-Authorized Payments</div>
            <h2 className="pa-h">Why Nyra beats<br />&quot;set it and forget it&quot;</h2>
            <ul className="pa-bullets">
              <li>PADs pull money automatically — no balance check</li>
              <li>Low balance = bounced payment + NSF fee</li>
              <li><span className="nyra-brand">Nyra</span> warns you days ahead</li>
              <li><span className="nyra-brand">Nyra</span> prevents the double whammy</li>
            </ul>
            <div className="pa-nsf">⚠️ Banks charge up to $10 per NSF — <span className="nyra-brand">Nyra</span> helps you avoid it</div>
          </div>
          <div className="pa-cards reveal d2">
            {[
              { icon: '💸', title: 'Nyra catches low balances', text: 'Nyra reminds you days before PADs hit — time to top up.' },
              { icon: '📋', title: 'Nyra tracks multiple PADs', text: 'Nyra shows everything coming this week. No surprises.' },
              { icon: '🔔', title: 'Nyra gives you the heads up', text: 'Check balance → top up → payment clears. Nyra saves the day.' },
            ].map(({ icon, title, text }) => (
              <div key={title} className="pa-card">
                <div className="pa-card-icon">{icon}</div>
                <div>
                  <div className="pa-card-title">{title}</div>
                  <div className="pa-card-text">{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="features-section" id="features">
        <div className="eyebrow reveal">Nyra Features</div>
        <h2 className="sec-h reveal d1">What Nyra does for you</h2>
        <p className="sec-p reveal d2"><span className="nyra-brand">Nyra</span> keeps you one step ahead — automatically.</p>
        <div className="f-grid">
          {[
            { icon: '🔔', d: 'd1', title: 'Nyra Custom Reminders', desc: 'Different timing for every bill. Rent = 7 days. Spotify = 1 day. Nyra remembers your rules.' },
            { icon: '🤖', d: 'd2', title: 'Nyra AI Suggestions', desc: 'Type a bill name → Nyra suggests the billing cycle. Autocomplete for adulting.' },
            { icon: '🔄', d: 'd3', title: 'Nyra Auto-Rolling', desc: 'Nyra updates due dates each month automatically. Set once, Nyra handles forever.' },
            { icon: '📱', d: 'd4', title: 'Nyra SMS', desc: 'No app. No notification settings. Just a Nyra text when it matters.' },
            { icon: '💳', d: 'd5', title: 'Nyra Credit Card Mode', desc: 'Nyra handles statement dates + due dates separately. Details matter.' },
            { icon: '🔒', d: 'd6', title: 'Nyra Easy Cancel', desc: 'Remove your last bill → Nyra cancels your subscription. No forms. No guilt.' },
          ].map(({ icon, d, title, desc }) => (
            <div key={title} className={`f-card reveal ${d}`}>
              <div className="f-ic">{icon}</div>
              <div className="f-ti">{title}</div>
              <div className="f-de">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div className="pricing-section" id="pricing">
        <div className="pricing-inner">
          <div className="eyebrow reveal">Nyra Pricing</div>
          <h2 className="sec-h reveal d1">Choose your Nyra plan</h2>
          <p className="sec-p reveal d2">Every <span className="nyra-brand">Nyra</span> plan funds financial literacy across Canada. You&apos;re basically a hero.</p>
          <div className="plans-grid">
            {[
              { name: 'Basic', sub: 'Up to 5 bills tracked', price: 3, features: ['Track up to 5 bills','Nyra SMS reminders','Nyra custom timing','Nyra Money IQ score','Starter badges'], featured: false, delay: 'd1' },
              { name: 'Plus', sub: 'Up to 15 bills tracked', price: 5, features: ['Track up to 15 bills','Everything in Nyra Basic','Nyra AI coach (10 msg/mo)','Statement upload','Nyra payday timeline','Nyra analytics & charts','Full badge collection','Nyra Learn tab'], featured: true, delay: 'd2' },
              { name: 'Power', sub: 'Unlimited bills', price: 8, features: ['Unlimited bills','Everything in Nyra Plus','Unlimited Nyra AI coach','Nyra AI memory','Proactive Nyra insights','Secret badges','Priority support'], featured: false, delay: 'd3' },
            ].map(({ name, sub, price, features, featured, delay }) => (
              <div key={name} className={`plan-card reveal ${delay}${featured ? ' featured' : ''}`}>
                <div className="plan-shine" />
                {featured && <div className="plan-badge">Most Popular</div>}
                <div className="plan-name">Nyra {name}</div>
                <div className="plan-sub">{sub}</div>
                <div className="plan-price">
                  <span className="p-dollar">$</span>
                  <span className="p-amt">{price}</span>
                  <span className="p-per">/month</span>
                </div>
                <div className="plan-div" />
                <ul className="plan-list">
                  {features.map(f => <li key={f}><span className="pck">✓</span>{f}</li>)}
                </ul>
                <button className={`plan-btn ${featured ? 'pb-pri' : 'pb-gh'}`} onClick={() => goSignup(name, price)}>
                  Choose Nyra {name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="nyra-footer">
        <div className="f-logo-wrap">
          <div className="f-logo-text">Nyra<span>.</span></div>
          <div className="f-tagline">A Financial Futures Education initiative</div>
        </div>
        <div className="f-links">
          <a href="https://financialfutureseducation.com/" className="f-link" target="_blank" rel="noreferrer">Financial Futures Education ↗</a>
          <a href="#features" className="f-link">Features</a>
          <a href="#pricing" className="f-link">Pricing</a>
        </div>
        <div className="f-copy">© 2026 Financial Futures Education</div>
      </footer>
    </>
  );
}
