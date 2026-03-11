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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');

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
        body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;overflow-x:hidden;line-height:1.6;}

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
          padding:0 10px 0 20px;height:52px;
          width:calc(100% - 56px);max-width:980px;
          background:var(--glass);backdrop-filter:blur(28px) saturate(2);-webkit-backdrop-filter:blur(28px) saturate(2);
          border:1px solid var(--gb);border-radius:100px;box-shadow:var(--gs);
          opacity:0;animation:navIn .6s ease 2.1s forwards;}
        @keyframes navIn{to{opacity:1;}}
        .logo{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.2rem;letter-spacing:-.03em;color:var(--blue);text-decoration:none;}
        .logo-gem{display:inline-block;width:5px;height:5px;background:var(--gold);border-radius:50%;margin-left:2px;margin-bottom:5px;box-shadow:0 0 8px var(--gold);animation:gp 3s ease infinite;vertical-align:middle;}
        @keyframes gp{0%,100%{box-shadow:0 0 6px var(--gold);}50%{box-shadow:0 0 16px var(--gold),0 0 28px rgba(195,154,53,.3);}}
        .ffe-link{font-size:0.75rem;font-weight:500;color:var(--text2);text-decoration:none;padding:6px 14px;border-radius:100px;border:1px solid var(--border);background:rgba(255,255,255,0.4);transition:all .2s;}
        .ffe-link:hover{color:var(--blue);background:var(--blue-pale);border-color:rgba(33,119,209,0.2);}
        .nav-right{display:flex;align-items:center;gap:4px;}
        .nl{font-size:0.8rem;font-weight:500;color:var(--text2);text-decoration:none;padding:7px 14px;border-radius:100px;transition:background .2s,color .2s;}
        .nl:hover{background:var(--blue-pale);color:var(--blue);}
        .nbtn{background:var(--blue);color:white;padding:8px 20px;border-radius:100px;font-size:0.8rem;font-weight:600;text-decoration:none;box-shadow:0 4px 14px var(--blue-glow);transition:background .2s,transform .15s;}
        .nbtn:hover{background:var(--blue-d);transform:translateY(-1px);}

        /* SCROLL-TO-TOP */
        .stt{position:fixed;bottom:28px;right:28px;z-index:300;
          width:44px;height:44px;border-radius:50%;
          background:var(--glass2);backdrop-filter:blur(20px);
          box-shadow:var(--gs);cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          font-size:1rem;color:var(--blue);
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
        .hero-inner{position:relative;z-index:1;max-width:820px;}
        .hero-pill{display:inline-flex;align-items:center;gap:8px;
          background:var(--glass);backdrop-filter:blur(16px);border:1px solid var(--gb);
          border-radius:100px;padding:6px 18px 6px 12px;
          font-size:0.7rem;font-weight:500;color:var(--blue);letter-spacing:.06em;text-transform:uppercase;
          box-shadow:var(--gs);margin-bottom:48px;
          opacity:0;animation:fup .7s ease .1s forwards;}
        .pill-dot{width:5px;height:5px;background:var(--gold);border-radius:50%;box-shadow:0 0 8px var(--gold);animation:gp 2.5s ease infinite;}

        /* NYRA ANIMATION */
        .nyra-stage{position:relative;display:inline-block;}
        .nyra-ghost{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;
          font-size:clamp(6rem,18vw,13rem);line-height:.9;letter-spacing:-.04em;
          color:transparent;-webkit-text-stroke:1.5px rgba(33,119,209,0.14);
          display:block;opacity:0;animation:ghostIn .5s ease .4s forwards;}
        @keyframes ghostIn{to{opacity:1;}}
        .nyra-fill{position:absolute;inset:0;
          font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;
          font-size:clamp(6rem,18vw,13rem);line-height:.9;letter-spacing:-.04em;
          background:linear-gradient(135deg,#1a5fb0 0%,var(--blue) 25%,var(--blue-m) 50%,#5ba3ec 65%,var(--blue) 80%,#1a5fb0 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;background-size:300% 300%;
          clip-path:inset(0 100% 0 0);
          animation:nyraR 1.3s cubic-bezier(.77,0,.18,1) .75s forwards,nyraS 8s ease infinite 2.5s;
          filter:drop-shadow(0 0 48px rgba(33,119,209,.22));}
        @keyframes nyraR{from{clip-path:inset(0 100% 0 0);}to{clip-path:inset(0 0% 0 0);}}
        @keyframes nyraS{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
        .sparkles{position:absolute;inset:0;pointer-events:none;}
        .sp{position:absolute;width:4px;height:4px;border-radius:50%;background:var(--gold);opacity:0;animation:sparkle 2.5s ease forwards;}
        .sp:nth-child(1){top:15%;left:10%;animation-delay:1.9s;}
        .sp:nth-child(2){top:70%;left:20%;animation-delay:2.05s;}
        .sp:nth-child(3){top:20%;right:12%;animation-delay:2.15s;}
        .sp:nth-child(4){top:75%;right:18%;animation-delay:2.0s;}
        .sp:nth-child(5){top:45%;left:5%;animation-delay:2.2s;}
        .sp:nth-child(6){top:50%;right:8%;animation-delay:1.95s;}
        @keyframes sparkle{0%{opacity:0;transform:scale(0);}40%{opacity:1;transform:scale(1.5);}80%{opacity:.8;transform:scale(1);}100%{opacity:0;transform:scale(0) translateY(-20px);}}
        .nyra-underline{display:block;height:2px;width:0;margin:14px auto 0;
          background:linear-gradient(90deg,transparent,var(--gold),var(--blue-m),var(--gold),transparent);
          animation:dl .8s cubic-bezier(.77,0,.18,1) 1.95s forwards;}
        @keyframes dl{to{width:65%;}}
        .hero-tagline{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;
          font-size:clamp(1.1rem,2.2vw,1.5rem);color:var(--text2);letter-spacing:-.02em;margin-top:22px;
          opacity:0;animation:fup .7s ease 2.1s forwards;}
        .hero-sub{font-size:.9rem;font-weight:400;color:var(--muted);line-height:1.85;max-width:360px;margin:16px auto 44px;
          opacity:0;animation:fup .7s ease 2.25s forwards;}
        .hero-ctas{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;
          opacity:0;animation:fup .7s ease 2.4s forwards;}
        .cta-p{display:inline-flex;align-items:center;gap:8px;background:var(--blue);color:white;
          padding:13px 30px;border-radius:100px;
          font-family:'Plus Jakarta Sans',sans-serif;font-size:.88rem;font-weight:700;
          text-decoration:none;letter-spacing:-.01em;
          box-shadow:0 6px 26px var(--blue-glow);transition:background .2s,transform .15s,box-shadow .2s;}
        .cta-p:hover{background:var(--blue-d);transform:translateY(-2px);box-shadow:0 10px 34px var(--blue-glow);}
        .cta-g{display:inline-flex;align-items:center;gap:7px;color:var(--text2);font-size:.88rem;font-weight:500;
          text-decoration:none;padding:13px 22px;border-radius:100px;
          background:var(--glass);backdrop-filter:blur(16px);border:1px solid var(--gb);box-shadow:var(--gs);
          transition:color .2s,background .2s;}
        .cta-g:hover{color:var(--blue);background:var(--glass2);}
        .arr{transition:transform .2s;}.cta-g:hover .arr{transform:translateX(3px);}
        .scroll-hint{position:absolute;bottom:34px;left:50%;transform:translateX(-50%);
          display:flex;flex-direction:column;align-items:center;gap:8px;
          opacity:0;animation:fup .8s ease 2.9s forwards;}
        .scroll-hint span{font-size:.58rem;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);}
        .scroll-line{width:1px;height:38px;background:linear-gradient(to bottom,var(--blue),transparent);
          animation:sdrop 2s ease infinite 3.1s;opacity:0;}
        @keyframes sdrop{0%{transform:scaleY(0);transform-origin:top;opacity:0;}30%{opacity:1;}60%{transform:scaleY(1);transform-origin:top;opacity:1;}100%{transform:scaleY(1);transform-origin:bottom;opacity:0;}}
        @keyframes fup{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}

        /* 20% BANNER */
        .impact-banner{position:relative;z-index:1;
          background:linear-gradient(135deg,var(--blue) 0%,var(--blue-d) 50%,#1245a0 100%);
          padding:28px 52px;
          display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;text-align:center;
          box-shadow:0 4px 32px rgba(33,119,209,0.25);}
        .ib-icon{font-size:1.8rem;flex-shrink:0;}
        .ib-text{color:white;}
        .ib-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.1rem;letter-spacing:-.02em;margin-bottom:4px;}
        .ib-sub{font-size:.82rem;font-weight:400;opacity:.85;max-width:480px;line-height:1.6;}
        .ib-badge{display:inline-flex;align-items:center;gap:8px;
          background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);
          border:1px solid rgba(255,255,255,0.3);border-radius:100px;
          padding:8px 20px;color:white;font-size:.78rem;font-weight:700;white-space:nowrap;flex-shrink:0;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.2);}
        .ib-badge-dot{width:7px;height:7px;background:var(--gold);border-radius:50%;box-shadow:0 0 8px var(--gold);animation:gp 2s ease infinite;}

        /* MARQUEE */
        .marquee-wrap{overflow:hidden;padding:14px 0;position:relative;z-index:1;
          background:var(--glass);backdrop-filter:blur(20px) saturate(2);
          border-top:1px solid var(--gb);border-bottom:1px solid var(--gb);box-shadow:var(--gs);}
        .marquee-track{display:flex;width:max-content;animation:mq 28s linear infinite;}
        .m-item{display:flex;align-items:center;gap:13px;padding:0 26px;border-right:1px solid var(--border);
          font-size:.66rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);}
        .m-gem{color:var(--gold);}
        @keyframes mq{from{transform:translateX(0);}to{transform:translateX(-50%);}}

        /* SOUND FAMILIAR */
        .sf-section{position:relative;z-index:1;padding:80px 52px 40px;text-align:center;}
        .sf-inner{max-width:640px;margin:0 auto;}
        .sf-eyebrow{display:inline-flex;align-items:center;gap:10px;
          font-size:.65rem;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:20px;}
        .sf-eyebrow::before,.sf-eyebrow::after{content:'';width:28px;height:1.5px;background:var(--gold);opacity:.5;}
        .sf-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;
          font-size:clamp(2rem,4vw,3.2rem);letter-spacing:-.03em;color:var(--text);margin-bottom:16px;line-height:1.08;}
        .sf-p{font-size:.92rem;color:var(--text2);line-height:1.85;margin-bottom:36px;}
        .ch-stat{display:inline-flex;align-items:center;gap:12px;
          background:var(--glass);backdrop-filter:blur(20px) saturate(2);border:1px solid var(--gb);
          border-radius:16px;padding:14px 22px;box-shadow:var(--gs);}
        .sv{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.8rem;letter-spacing:-.03em;color:var(--blue);}
        .sl{font-size:.76rem;color:var(--text2);max-width:160px;line-height:1.4;}
        .sf-source{font-size:.62rem;color:var(--muted);margin-top:12px;}

        /* SCROLL STORY */
        .story-section{position:relative;z-index:1;height:480vh;}
        .story-sticky{position:sticky;top:0;height:100vh;
          display:grid;grid-template-columns:1fr 1fr;align-items:center;overflow:hidden;
          background:linear-gradient(180deg,var(--bg) 0%,var(--bg2) 100%);}
        .s-prog{position:absolute;top:0;left:0;right:0;height:2.5px;z-index:10;background:rgba(33,119,209,.1);}
        .s-prog-fill{height:100%;width:0%;background:linear-gradient(90deg,var(--blue),var(--gold));transition:width .3s ease;}
        .phone-side{height:100vh;display:flex;align-items:center;justify-content:center;position:relative;
          background:linear-gradient(135deg,rgba(33,119,209,.04) 0%,rgba(195,154,53,.03) 100%);
          border-right:1px solid var(--border);}
        .phone-glow{position:absolute;width:380px;height:380px;border-radius:50%;filter:blur(60px);transition:background 1s ease;}
        .phone-wrap{position:relative;z-index:1;transition:transform .15s ease;}
        .phone-frame{width:340px;height:460px;border-radius:28px;
          border:1.5px solid rgba(255,255,255,.88);
          background:var(--glass);backdrop-filter:blur(32px) saturate(2.5);-webkit-backdrop-filter:blur(32px) saturate(2.5);
          box-shadow:0 0 0 .5px rgba(33,119,209,.14),0 28px 72px rgba(33,119,209,.18),0 8px 22px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.95),inset 0 -1px 0 rgba(33,119,209,.07);
          position:relative;overflow:hidden;}
        .phone-frame::before{content:'';position:absolute;top:14px;left:50%;transform:translateX(-50%);
          width:8px;height:8px;border-radius:50%;background:rgba(33,119,209,.25);z-index:20;}
        .phone-frame::after{content:'';position:absolute;inset:0;
          background:linear-gradient(145deg,rgba(255,255,255,.5) 0%,transparent 35%,transparent 65%,rgba(255,255,255,.1) 100%);
          pointer-events:none;z-index:15;border-radius:27px;}
        .phone-screen{position:absolute;inset:6px;border-radius:23px;overflow:hidden;background:linear-gradient(160deg,#f0f6ff 0%,#e8f0fc 100%);}
        .screen-state{position:absolute;inset:0;padding:28px 18px 18px;opacity:0;transition:opacity .5s ease;display:flex;flex-direction:column;}
        .screen-state.active{opacity:1;}
        .ch-dots{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);display:flex;gap:6px;}
        .cd{width:6px;height:6px;border-radius:50%;background:rgba(33,119,209,.18);transition:background .3s,transform .3s;}
        .cd.active{background:var(--blue);transform:scale(1.35);}

        /* Screen 1 */
        .s1n{background:rgba(255,255,255,.75);backdrop-filter:blur(16px);border:1px solid rgba(255,100,100,.14);
          border-radius:13px;padding:14px;margin-bottom:10px;
          box-shadow:0 2px 10px rgba(255,80,80,.07),inset 0 1px 0 rgba(255,255,255,.9);
          transform:translateY(10px);opacity:0;transition:transform .5s,opacity .5s;}
        .s1n.sh{transform:translateY(0);opacity:1;}
        .s1a{font-size:.7rem;font-weight:700;color:#d04040;letter-spacing:.07em;text-transform:uppercase;margin-bottom:4px;}
        .s1t{font-size:.88rem;font-weight:700;color:#b03030;margin-bottom:4px;}
        .s1b{font-size:.78rem;color:#c05050;line-height:1.5;}

        /* Screen 2 */
        .s2h{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
        .s2t{font-family:'Plus Jakarta Sans',sans-serif;font-size:.85rem;font-weight:700;color:var(--blue);}
        .s2b-item{background:rgba(255,255,255,.75);backdrop-filter:blur(12px);border:1px solid var(--gb);
          border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;
          box-shadow:0 2px 8px rgba(33,119,209,.05),inset 0 1px 0 rgba(255,255,255,.9);
          transform:translateX(14px);opacity:0;transition:transform .45s cubic-bezier(.34,1.56,.64,1),opacity .4s;}
        .s2b-item.sh{transform:translateX(0);opacity:1;}
        .s2bn{font-size:.82rem;font-weight:700;color:var(--text);}
        .s2bd{font-size:.68rem;color:var(--muted);margin-top:2px;}
        .s2ba{font-size:.88rem;font-weight:700;color:var(--blue);}

        /* Screen 3 */
        .s3h{text-align:center;margin-bottom:18px;}
        .s3av{width:46px;height:46px;border-radius:50%;margin:0 auto 8px;
          background:linear-gradient(135deg,var(--blue),var(--blue-m));
          display:flex;align-items:center;justify-content:center;
          font-size:1.1rem;font-weight:800;color:white;font-family:'Plus Jakarta Sans',sans-serif;
          box-shadow:0 4px 12px var(--blue-glow);}
        .s3n{font-size:.9rem;font-weight:700;color:var(--text);}
        .s3sub{font-size:.7rem;color:var(--muted);}
        .s3bbl{border-radius:15px 15px 4px 15px;padding:12px 14px;margin-bottom:8px;font-size:.82rem;line-height:1.6;
          transform:translateY(10px);opacity:0;transition:transform .45s cubic-bezier(.34,1.56,.64,1),opacity .4s;}
        .s3bbl.sh{transform:translateY(0);opacity:1;}
        .s3bbl.bb{background:linear-gradient(135deg,var(--blue),var(--blue-d));color:white;box-shadow:0 4px 14px var(--blue-glow);}
        .s3bbl.gb{background:linear-gradient(135deg,var(--gold),#a07820);color:white;border-radius:15px 15px 15px 4px;margin-left:20px;box-shadow:0 4px 14px rgba(195,154,53,.25);}
        .s3time{font-size:.68rem;color:var(--muted);text-align:center;margin-top:6px;}

        /* Screen 4 */
        .s4hd{font-size:.7rem;font-weight:700;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;text-align:center;margin-bottom:12px;}
        .s4n{background:rgba(255,255,255,.72);backdrop-filter:blur(20px) saturate(2.5);
          border:1px solid rgba(255,255,255,.92);border-radius:13px;padding:10px 12px;
          display:flex;align-items:center;gap:10px;margin-bottom:7px;
          box-shadow:0 2px 10px rgba(33,119,209,.07),inset 0 1px 0 rgba(255,255,255,.95);
          transform:translateY(14px) scale(.96);opacity:0;transition:transform .4s cubic-bezier(.34,1.56,.64,1),opacity .4s;}
        .s4n.sh{transform:translateY(0) scale(1);opacity:1;}
        .s4ic{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0;}
        .s4tx{flex:1;min-width:0;}
        .s4ap{font-size:.64rem;font-weight:700;color:var(--muted);letter-spacing:.04em;}
        .s4ms{font-size:.76rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .s4ck{color:#34c759;font-size:.95rem;font-weight:700;}

        /* TEXT SIDE */
        .text-side{height:100vh;display:flex;align-items:center;padding:0 68px 0 56px;position:relative;}
        .story-ch{position:absolute;width:calc(100% - 124px);
          opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s ease;pointer-events:none;}
        .story-ch.active{opacity:1;transform:translateY(0);pointer-events:auto;}
        .ch-ey{display:flex;align-items:center;gap:10px;font-size:.64rem;font-weight:600;
          letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:18px;}
        .ch-ey::before{content:'';width:18px;height:1.5px;background:var(--gold);opacity:.5;}
        .ch-num{color:rgba(195,154,53,.4);}
        .ch-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;
          font-size:clamp(2.2rem,3.8vw,3.4rem);line-height:1.07;letter-spacing:-.03em;color:var(--text);margin-bottom:16px;}
        .ch-p{font-size:.93rem;font-weight:400;color:var(--text2);line-height:1.85;max-width:420px;margin-bottom:26px;}

        /* PRE-AUTH */
        .preauth-section{position:relative;z-index:1;padding:100px 52px;
          background:linear-gradient(135deg,rgba(33,119,209,.04) 0%,rgba(195,154,53,.03) 100%);
          border-top:1px solid var(--border);}
        .pa-inner{max-width:1020px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;}
        .eyebrow{display:flex;align-items:center;gap:12px;font-size:.63rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:18px;}
        .eyebrow::before{content:'';width:18px;height:1.5px;background:var(--gold);opacity:.5;}
        .pa-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:clamp(1.8rem,2.8vw,2.6rem);letter-spacing:-.03em;color:var(--text);line-height:1.1;margin-bottom:16px;}
        .pa-p{font-size:.9rem;color:var(--text2);line-height:1.85;margin-bottom:20px;}
        .pa-cards{display:flex;flex-direction:column;gap:12px;}
        .pa-card{background:var(--glass);backdrop-filter:blur(24px) saturate(2);border:1px solid var(--gb);
          border-radius:18px;padding:20px 22px;box-shadow:var(--gs);display:flex;gap:14px;align-items:flex-start;}
        .pa-card-icon{font-size:1.3rem;flex-shrink:0;margin-top:2px;}
        .pa-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-size:.88rem;font-weight:700;color:var(--text);margin-bottom:5px;}
        .pa-card-text{font-size:.8rem;color:var(--text2);line-height:1.75;}
        .pa-nsf{display:inline-flex;align-items:center;gap:8px;
          background:rgba(255,100,80,.08);border:1px solid rgba(255,100,80,.15);
          border-radius:10px;padding:8px 14px;margin-top:14px;
          font-size:.76rem;color:#c04030;font-weight:500;}

        /* FEATURES */
        .features-section{position:relative;z-index:1;padding:100px 52px;max-width:1060px;margin:0 auto;}
        .sec-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:clamp(1.9rem,3vw,2.7rem);letter-spacing:-.03em;color:var(--text);margin-bottom:12px;line-height:1.1;}
        .sec-p{font-size:.88rem;color:var(--text2);max-width:400px;line-height:1.85;margin-bottom:52px;}
        .f-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
        .f-card{background:var(--glass);backdrop-filter:blur(24px) saturate(2);-webkit-backdrop-filter:blur(24px) saturate(2);
          border:1px solid var(--gb);border-radius:20px;padding:28px 24px;box-shadow:var(--gs);
          transition:transform .25s,box-shadow .25s;}
        .f-card:hover{transform:translateY(-3px);box-shadow:var(--gsl);}
        .f-ic{width:40px;height:40px;border-radius:11px;background:var(--blue-pale);border:1px solid rgba(33,119,209,.14);
          display:flex;align-items:center;justify-content:center;font-size:1.05rem;margin-bottom:16px;}
        .f-ti{font-family:'Plus Jakarta Sans',sans-serif;font-size:.88rem;font-weight:700;color:var(--text);margin-bottom:6px;}
        .f-de{font-size:.8rem;color:var(--text2);line-height:1.8;}

        /* PRICING */
        .pricing-section{position:relative;z-index:1;padding:100px 52px;
          background:linear-gradient(180deg,rgba(33,119,209,.03) 0%,rgba(195,154,53,.02) 100%);
          border-top:1px solid var(--border);}
        .pricing-inner{max-width:920px;margin:0 auto;}
        .plans-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:48px;}
        .plan-card{background:var(--glass);backdrop-filter:blur(24px) saturate(2);-webkit-backdrop-filter:blur(24px) saturate(2);
          border:1px solid var(--gb);border-radius:24px;padding:34px 30px;box-shadow:var(--gs);
          display:flex;flex-direction:column;position:relative;overflow:hidden;transition:transform .25s,box-shadow .25s;}
        .plan-card:hover{transform:translateY(-4px);box-shadow:var(--gsl);}
        .plan-card.featured{border-color:rgba(33,119,209,.28);box-shadow:var(--gsl),0 0 0 1px rgba(33,119,209,.07);background:rgba(255,255,255,.72);}
        .plan-shine{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--blue),var(--blue-m),transparent);opacity:0;}
        .plan-card.featured .plan-shine{opacity:1;}
        .plan-badge{display:inline-block;background:var(--blue);color:white;font-size:.58rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 13px;border-radius:100px;margin-bottom:18px;box-shadow:0 3px 10px var(--blue-glow);}
        .plan-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.45rem;letter-spacing:-.03em;color:var(--text);margin-bottom:3px;}
        .plan-sub{font-size:.75rem;color:var(--muted);margin-bottom:20px;}
        .plan-price{display:flex;align-items:flex-start;gap:3px;margin-bottom:22px;}
        .p-dollar{font-size:1.2rem;color:var(--blue);font-weight:700;margin-top:7px;font-family:'Plus Jakarta Sans',sans-serif;}
        .p-amt{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:3.6rem;line-height:1;letter-spacing:-.04em;color:var(--text);}
        .p-per{font-size:.76rem;color:var(--muted);margin-top:13px;}
        .plan-div{height:1px;background:var(--border);margin-bottom:18px;}
        .plan-list{list-style:none;margin-bottom:24px;flex:1;}
        .plan-list li{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid rgba(33,119,209,.06);font-size:.8rem;color:var(--text2);}
        .plan-list li:last-child{border-bottom:none;}
        .pck{width:16px;height:16px;flex-shrink:0;border-radius:50%;background:var(--blue-pale);border:1px solid rgba(33,119,209,.18);display:flex;align-items:center;justify-content:center;color:var(--blue);font-size:.52rem;font-weight:700;}
        .plan-btn{display:block;width:100%;text-align:center;padding:13px;border-radius:12px;
          font-family:'Plus Jakarta Sans',sans-serif;font-size:.86rem;font-weight:700;
          letter-spacing:-.01em;text-decoration:none;margin-top:auto;
          transition:background .2s,transform .15s,box-shadow .2s;cursor:pointer;border:none;}
        .pb-pri{background:var(--blue);color:white;box-shadow:0 4px 18px var(--blue-glow);}
        .pb-pri:hover{background:var(--blue-d);transform:translateY(-1px);box-shadow:0 8px 26px var(--blue-glow);}
        .pb-gh{background:transparent;color:var(--blue);border:1.5px solid rgba(33,119,209,.22) !important;}
        .pb-gh:hover{background:var(--blue-pale);}

        /* FOOTER */
        .nyra-footer{position:relative;z-index:1;padding:32px 52px;border-top:1px solid var(--border);
          background:var(--glass);backdrop-filter:blur(20px);
          display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;}
        .f-logo-wrap{display:flex;flex-direction:column;gap:4px;}
        .f-logo-text{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.1rem;letter-spacing:-.03em;color:var(--blue);}
        .f-logo-text span{color:var(--gold);}
        .f-tagline{font-size:.65rem;color:var(--muted);}
        .f-links{display:flex;gap:22px;}
        .f-link{font-size:.75rem;color:var(--muted);text-decoration:none;font-weight:400;transition:color .2s;}
        .f-link:hover{color:var(--blue);}
        .f-copy{font-size:.7rem;color:var(--muted);}

        /* SCROLL REVEAL */
        .reveal,.reveal-s{opacity:0;transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1);}
        .reveal{transform:translateY(26px);}.reveal-s{transform:scale(.97) translateY(12px);}
        .reveal.vis,.reveal-s.vis{opacity:1;transform:none;}
        .d1{transition-delay:.1s;}.d2{transition-delay:.2s;}.d3{transition-delay:.3s;}
        .d4{transition-delay:.4s;}.d5{transition-delay:.5s;}.d6{transition-delay:.6s;}

        @media(max-width:900px){
          .story-sticky{grid-template-columns:1fr;grid-template-rows:auto 1fr;}
          .phone-side{height:auto;padding:36px 20px;border-right:none;border-bottom:1px solid var(--border);}
          .text-side{padding:36px 24px;}
          .pa-inner{grid-template-columns:1fr;}
          .f-grid{grid-template-columns:repeat(2,1fr);}
          .plans-grid{grid-template-columns:1fr;}
        }
        @media(max-width:640px){
          .nyra-nav{width:calc(100% - 28px);padding:0 14px;}
          .nl{display:none;}.ffe-link{display:none;}
          .hero{padding:88px 20px 76px;}
          .features-section,.pricing-section,.preauth-section{padding:68px 20px;}
          .sf-section{padding:60px 20px 32px;}
          .nyra-footer{padding:24px 20px;flex-direction:column;text-align:center;}
          .f-grid{grid-template-columns:1fr;}
          .impact-banner{padding:22px 20px;}
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
          <a href="#pricing" className="nbtn">Get started</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="top" ref={heroRef}>
        <div className="hero-grid" />
        <div className="hero-inner">
          <div className="hero-pill"><span className="pill-dot" />Bill reminders · by Financial Futures Education</div>
          <div className="nyra-stage" id="nyraStage">
            <span className="nyra-ghost" id="nyraGhost">Nyra</span>
            <span className="nyra-fill" id="nyraFill">Nyra</span>
            <div className="sparkles">
              {[...Array(6)].map((_, i) => <div key={i} className="sp" />)}
            </div>
            <span className="nyra-underline" id="nyraLine" />
          </div>
          <div className="hero-tagline">Never miss a bill again.</div>
          <p className="hero-sub">Track every bill. Get a personal text before anything is due. Stay ahead — without thinking about it.</p>
          <div className="hero-ctas">
            <a href="#pricing" className="cta-p">Get started today →</a>
            <a href="/how-it-works" className="cta-g">See how it works <span className="arr">↓</span></a>
          </div>
        </div>
        <div className="scroll-hint"><span>Scroll</span><div className="scroll-line" /></div>
      </section>

      {/* 20% BANNER */}
      <div className="impact-banner">
        <div className="ib-icon">💙</div>
        <div className="ib-text">
          <div className="ib-title">Every subscription gives back.</div>
          <div className="ib-sub">20% of all Nyra profits go directly toward Financial Futures Education — delivering financial literacy sessions to youth in nonprofits and children&apos;s aid societies across Canada.</div>
        </div>
        <div className="ib-badge"><span className="ib-badge-dot" />20% to FFE</div>
      </div>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {['SMS Reminders','AI Suggestions','Auto-Rolling Dates','Cancel Anytime','No App Required','Financial Futures Education','Credit Card Cycles','20% to FFE',
            'SMS Reminders','AI Suggestions','Auto-Rolling Dates','Cancel Anytime','No App Required','Financial Futures Education','Credit Card Cycles','20% to FFE'].map((item, i) => (
            <div key={i} className="m-item"><span className="m-gem">✦</span>{item}</div>
          ))}
        </div>
      </div>

      {/* SOUND FAMILIAR */}
      <div className="sf-section">
        <div className="sf-inner reveal">
          <div className="sf-eyebrow">Sound familiar?</div>
          <h2 className="sf-h">Over half of Canadians<br />have missed a bill payment.</h2>
          <p className="sf-p">It&apos;s not a money problem — it&apos;s a memory problem. Life gets busy, due dates slip by, and suddenly you&apos;re hit with a late fee or a hit to your credit score.</p>
          <div className="ch-stat" style={{ display: 'inline-flex' }}>
            <div className="sv">54%</div>
            <div className="sl">of Canadians have missed a bill payment — and 73% of those missed 1–3 payments per year.</div>
          </div>
          <div className="sf-source">Source: Wellington Advertiser / TD Bank research</div>
        </div>
      </div>

      {/* SCROLL STORY */}
      <div className="story-section" id="story" ref={storyRef}>
        <div className="story-sticky">
          <div className="s-prog"><div className="s-prog-fill" id="progFill" /></div>

          {/* Phone */}
          <div className="phone-side">
            <div className="phone-glow" id="pglow" />
            <div className="phone-wrap" id="pwrap">
              <div className="phone-frame">
                <div className="phone-screen">
                  {/* Screen 1: Problem */}
                  <div className="screen-state active" id="sc1">
                    <div className="s1n" id="n1a">
                      <div className="s1a">🏦 Bank of Canada</div>
                      <div className="s1t">Late Payment Fee — $35.00</div>
                      <div className="s1b">Your credit card payment was overdue. A fee has been charged to your account.</div>
                    </div>
                    <div className="s1n" id="n1b" style={{ marginTop: 6 }}>
                      <div className="s1a">📱 Rogers</div>
                      <div className="s1t">Service Interruption Notice</div>
                      <div className="s1b">Your bill is 5 days overdue. Pay now to restore service.</div>
                    </div>
                  </div>

                  {/* Screen 2: Dashboard */}
                  <div className="screen-state" id="sc2">
                    <div className="s2h">
                      <div className="s2t">Your Bills</div>
                      <div style={{ background: 'var(--blue-pale)', border: '1px solid rgba(33,119,209,.14)', borderRadius: '100px', padding: '2px 9px', fontSize: '.56rem', fontWeight: 700, color: 'var(--blue)' }}>3 tracked</div>
                    </div>
                    <div className="s2b-item" id="sb1"><div><div className="s2bn">Rent</div><div className="s2bd">Due Mar 1 · 3d reminder</div></div><div className="s2ba">$1,800</div></div>
                    <div className="s2b-item" id="sb2"><div><div className="s2bn">Netflix</div><div className="s2bd">Due Mar 12 · 3d reminder</div></div><div className="s2ba">$18</div></div>
                    <div className="s2b-item" id="sb3"><div><div className="s2bn">Rogers</div><div className="s2bd">Due Mar 18 · 5d reminder</div></div><div className="s2ba">$85</div></div>
                  </div>

                  {/* Screen 3: SMS */}
                  <div className="screen-state" id="sc3">
                    <div className="s3h">
                      <div className="s3av">N</div>
                      <div className="s3n">Nyra</div>
                      <div className="s3sub">Bill reminder service</div>
                    </div>
                    <div className="s3bbl bb" id="sm1">👋 Hey! Your <strong>Rent</strong> of <strong>$1,800</strong> is due in <strong>3 days</strong> on March 1st. Don&apos;t get caught off guard.</div>
                    <div className="s3bbl gb" id="sm2">— Nyra · Never miss a bill.</div>
                    <div className="s3time">Today · 9:00 AM</div>
                  </div>

                  {/* Screen 4: All paid */}
                  <div className="screen-state" id="sc4">
                    <div className="s4hd">March · All Paid ✓</div>
                    {[
                      { id: 'p1', icon: '🎵', bg: 'rgba(30,215,96,.11)', app: 'Spotify', msg: 'Payment successful · $11.99' },
                      { id: 'p2', icon: '🎬', bg: 'rgba(229,9,20,.09)', app: 'Netflix', msg: 'Payment successful · $18.00' },
                      { id: 'p3', icon: '✨', bg: 'rgba(0,115,240,.09)', app: 'Disney+', msg: 'Payment successful · $14.99' },
                      { id: 'p4', icon: '🏠', bg: 'rgba(195,154,53,.1)', app: 'Rent', msg: 'Payment successful · $1,800' },
                      { id: 'p5', icon: '📱', bg: 'rgba(33,119,209,.09)', app: 'Rogers', msg: 'Payment successful · $85.00' },
                    ].map(({ id, icon, bg, app, msg }) => (
                      <div key={id} className="s4n" id={id}>
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
              { id: 'ch1', num: '01', tag: 'The Problem', title: 'Late fees.\nMissed bills.\nEndless stress.', body: "Over half of Canadians have missed a bill. It's not carelessness — it's that there's no system. Due dates pile up, get lost in email, and hit you at the worst time.", stat: '54%', statLabel: 'of Canadians have missed at least one bill payment', cta: null },
              { id: 'ch2', num: '02', tag: 'Meet Nyra', title: 'Your bills.\nTracked.\nHandled.', body: 'Add your bills once. Nyra remembers every due date, rolls them forward each month automatically, and uses AI to suggest billing cycles. Setup takes minutes.', stat: '3 min', statLabel: 'average setup time for all your bills', cta: null },
              { id: 'ch3', num: '03', tag: 'The Reminder', title: 'A text.\nRight on time.\nEvery time.', body: 'No app to open. No notification settings to dig through. Nyra sends a personal SMS before each bill is due — exactly when you chose, 1, 3, or 7 days in advance.', stat: '0', statLabel: 'late fees since using Nyra', cta: null },
              { id: 'ch4', num: '04', tag: 'The Result', title: 'Every bill.\nPaid on time.\nEvery month.', body: "This is what financial life looks like with Nyra. Every subscription, every bill — paid before it's due. Your credit score climbs. The mental load disappears entirely.", stat: null, statLabel: null, cta: 'Get started for $3/month →' },
            ].map(({ id, num, tag, title, body, stat, statLabel, cta }, i) => (
              <div key={id} className={`story-ch${i === 0 ? ' active' : ''}`} id={id}>
                <div className="ch-ey"><span className="ch-num">{num} ·</span> {tag}</div>
                <h2 className="ch-h">{title.split('\n').map((line, j) => <span key={j}>{line}{j < 2 && <br />}</span>)}</h2>
                <p className="ch-p">{body}</p>
                {stat && (
                  <div className="ch-stat">
                    <div className="sv">{stat}</div>
                    <div className="sl">{statLabel}</div>
                  </div>
                )}
                {cta && (
                  <a href="#pricing" className="cta-p" style={{ display: 'inline-flex', marginTop: 6 }}>{cta}</a>
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
            <div className="eyebrow">Pre-authorized payments</div>
            <h2 className="pa-h">Set it and forget it?<br />Not always.</h2>
            <p className="pa-p">Pre-authorized payments (PADs) are convenient — you set them up once and your bank pulls the money automatically on your billing date. But there&apos;s a catch most people don&apos;t think about until it&apos;s too late.</p>
            <p className="pa-p">A pre-authorized payment doesn&apos;t guarantee the money is there. If your balance runs low before the pull date, the payment bounces — and you get hit with an NSF fee from your bank on top of any late charge from the biller.</p>
            <div className="pa-nsf">⚠️ Canadian banks charged up to $50 per NSF incident — now capped at $10 as of March 2026, but the payment still fails and the bill still goes unpaid.</div>
          </div>
          <div className="pa-cards reveal d2">
            {[
              { icon: '💸', title: 'Low balance? The payment fails.', text: "Pre-authorized debits are rejected when your account has insufficient funds. Your bank declines the transaction and may charge an NSF fee — even for small shortfalls." },
              { icon: '📋', title: 'Multiple PADs can stack up.', text: "If several bills hit around the same time — rent, Rogers, your credit card minimum — one low-balance day can cascade into multiple failed payments and fees." },
              { icon: '🔔', title: 'Nyra gives you the heads-up.', text: "A reminder days before your bill is due means you can check your balance, top it up if needed, and make sure the payment actually goes through — whether it's automatic or manual." },
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
        <div className="eyebrow reveal">Features</div>
        <h2 className="sec-h reveal d1">Built for people<br />who value their time.</h2>
        <p className="sec-p reveal d2">Every feature in Nyra is designed to keep you one step ahead — automatically.</p>
        <div className="f-grid">
          {[
            { icon: '🔔', d: 'd1', title: 'Custom Reminders', desc: 'Set different reminder timing for every bill. Rent gets 7 days, Spotify gets 1. Your rules.' },
            { icon: '🤖', d: 'd2', title: 'AI Suggestions', desc: "Type a bill name and Nyra's AI instantly suggests the billing cycle and typical due date." },
            { icon: '🔄', d: 'd3', title: 'Auto-Rolling Dates', desc: 'Due dates update automatically each month — including smart end-of-month handling.' },
            { icon: '📱', d: 'd4', title: 'SMS Only', desc: 'No app to download. No settings to configure. Just a text to your phone when it matters.' },
            { icon: '💳', d: 'd5', title: 'Credit Card Cycles', desc: 'Credit cards bill differently in Canada. Nyra handles statement dates and payment due dates separately.' },
            { icon: '🔒', d: 'd6', title: 'Cancel Anytime', desc: 'Remove your last bill and your subscription cancels itself. No emails, no forms, no friction.' },
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
          <div className="eyebrow reveal">Pricing</div>
          <h2 className="sec-h reveal d1">Simple plans.<br />No surprises.</h2>
          <p className="sec-p reveal d2">Pick the plan that fits your life. Every plan helps fund financial literacy across Canada.</p>
          <div className="plans-grid">
            {[
              { name: 'Basic', sub: 'Up to 5 bills tracked', price: 3, features: ['Up to 5 bills','SMS reminders','Custom reminder timing','Auto-rolling dates'], featured: false, delay: 'd1' },
              { name: 'Plus', sub: 'Up to 15 bills tracked', price: 5, features: ['Up to 15 bills','SMS reminders','Custom reminder timing','Auto-rolling dates','AI billing suggestions','Credit card cycles'], featured: true, delay: 'd2' },
              { name: 'Power', sub: 'Unlimited bills', price: 8, features: ['Unlimited bills','SMS reminders','Custom reminder timing','Auto-rolling dates','AI billing suggestions','Credit card cycles'], featured: false, delay: 'd3' },
            ].map(({ name, sub, price, features, featured, delay }) => (
              <div key={name} className={`plan-card reveal ${delay}${featured ? ' featured' : ''}`}>
                <div className="plan-shine" />
                {featured && <div className="plan-badge">Most Popular</div>}
                <div className="plan-name">{name}</div>
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
                  Choose {name}
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
