'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MobileNav } from '@/components/mobile-nav';

interface Bill { id:string;name:string;amount:number;due_date:string;recurring:string;remind_days_before:number; }

// ─── Static literacy cards ────────────────────────────────────────────────────
const LITERACY_CARDS = [
  { id:'credit-payment', flag:'🟢', title:'Payment history = 35% of your credit score', body:'That\'s literally the biggest slice. Every on-time payment is a W. Every late one stays on your report for up to 6 years in Canada. Nyra\'s whole job is to protect this number for you.', tag:'Credit Score', tagColor:'rgba(34,197,94,.12)', tagText:'#16a34a' },
  { id:'nsf-fees', flag:'🚩', title:'NSF fees average $45–$48 per bounce in Canada', body:'Your bank charges YOU when a payment bounces because your account was low. That\'s basically paying extra for being broke. A 3-day reminder gives you time to move money before it hits.', tag:'NSF Fees', tagColor:'rgba(239,68,68,.1)', tagText:'#dc2626' },
  { id:'pad-risk', flag:'🚩', title:'Pre-authorized payments don\'t check your balance', body:'PADs are convenient but they pull money whether it\'s there or not. One low-balance day = NSF fee + possible returned payment + potential hit to your credit. Nyra gives you the heads-up so you can top up first.', tag:'PAD / Auto-pay', tagColor:'rgba(239,68,68,.1)', tagText:'#dc2626' },
  { id:'credit-util', flag:'🟢', title:'Keep credit card usage under 30% for a healthy score', body:'If your credit limit is $5,000, try to keep your balance under $1,500. High utilization = lower score, even if you pay it off every month. Your usage is reported at statement close, not payment date.', tag:'Credit Score', tagColor:'rgba(34,197,94,.12)', tagText:'#16a34a' },
  { id:'savings-bill', flag:'🟢', title:'Treat savings like a bill — pay yourself first', body:'Add a "savings transfer" as a Nyra bill. $50/month, $100/month — whatever. Automating it means you never have to decide to save, it just happens. Future you will be so grateful rn.', tag:'Money Habits', tagColor:'rgba(33,119,209,.1)', tagText:'#2177d1' },
  { id:'rent-credit', flag:'💡', title:'Rent payments don\'t automatically build credit in Canada', body:'Unlike mortgages, rent isn\'t reported to Equifax or TransUnion by default. But services like Chexi and Landlord Credit Bureau let you report it. If homeownership is the goal, this is worth looking into.', tag:'Credit Score', tagColor:'rgba(33,119,209,.1)', tagText:'#2177d1' },
  { id:'late-fee-math', flag:'🚩', title:'One late fee can cost more than a month of Nyra', body:'The average late fee in Canada is $25–$40. That\'s up to 10x what Nyra costs per month. Literally the best ROI on $3–$8 you\'ll ever see. The math is not mathing in favour of skipping reminders.', tag:'Late Fees', tagColor:'rgba(239,68,68,.1)', tagText:'#dc2626' },
  { id:'closing-cards', flag:'🚩', title:'Closing a credit card actually hurts your score', body:'It reduces your available credit (raises utilization) AND shortens your credit history. Even if you don\'t use a card, keeping it open with a $0 balance is usually the move. The more you know 🌈', tag:'Credit Score', tagColor:'rgba(34,197,94,.12)', tagText:'#16a34a' },
];

function daysUntil(d:string){const t=new Date();t.setHours(0,0,0,0);return Math.ceil((new Date(d+'T00:00:00').getTime()-t.getTime())/86400000);}

export default function LearnPage(){
  const[userName,setUserName]=useState('there');
  const[userPlan,setUserPlan]=useState('Plus');
  const[bills,setBills]=useState<Bill[]>([]);
  const[insightLoading,setInsightLoading]=useState(false);
  const[insight,setInsight]=useState('');
  const[insightLoaded,setInsightLoaded]=useState(false);
  const[activeCard,setActiveCard]=useState<string|null>(null);
  const[wrapLoading,setWrapLoading]=useState(false);
  const[wrap,setWrap]=useState('');
  const[wrapLoaded,setWrapLoaded]=useState(false);
  const[streakMonths,setStreakMonths]=useState(0);

  useEffect(()=>{
    async function load(){
      const{data:{user}}=await supabase.auth.getUser();if(!user)return;
      const{data:prof}=await supabase.from('profiles').select('full_name,plan,created_at').eq('id',user.id).single();
      if(prof){
        setUserName(prof.full_name?.split(' ')[0]||'there');
        setUserPlan(prof.plan||'Plus');
        const created=new Date(prof.created_at);
        setStreakMonths(Math.floor((Date.now()-created.getTime())/(1000*60*60*24*30)));
      }
      const{data:bd}=await supabase.from('bills').select('*').eq('user_id',user.id);
      setBills(bd||[]);
    }
    load();
  },[]);

  async function loadInsight(){
    if(insightLoaded||userPlan==='Basic')return;
    setInsightLoading(true);
    const billSummary=bills.map(b=>`${b.name} $${b.amount} (${b.recurring}, remind ${b.remind_days_before}d before, due in ${daysUntil(b.due_date)} days)`).join(', ')||'No bills added yet';
    const totalDue=bills.reduce((s,b)=>s+b.amount,0);
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:1000,
          system:`You are Nyra's Gen Z financial coach. You're real, direct, funny, and genuinely helpful. Use emojis naturally. Use 🟢 for green flags (good habits) and 🚩 for red flags (risks). Keep it casual — like a smart friend who actually knows finance. No corporate speak. Format as 3–4 short punchy paragraphs.`,
          messages:[{role:'user',content:`Give me a personalized weekly financial insight for this user. Their bills: ${billSummary}. Total due this month: $${totalDue}. Streak: ${streakMonths} months. Cover: how their reminder timing looks, any bills coming up that need attention, one money habit tip relevant to their specific bills, and a motivational closer. Keep it under 200 words and make it feel personal, not generic.`}]
        })
      });
      const data=await res.json();
      setInsight(data.content?.map((c:any)=>c.text||'').join('')||'Could not load insight.');
      setInsightLoaded(true);
    }catch(e){
      setInsight('Something went wrong. Try refreshing!');
    }
    setInsightLoading(false);
  }

  async function loadWrap(){
    if(wrapLoaded||userPlan==='Basic')return;
    setWrapLoading(true);
    const month=new Date().toLocaleString('en-CA',{month:'long'});
    const totalDue=bills.reduce((s,b)=>s+b.amount,0);
    const overdue=bills.filter(b=>daysUntil(b.due_date)<0).length;
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:600,
          system:`You are Nyra's Gen Z financial coach writing a monthly wrap-up. Think Spotify Wrapped energy but for bills. Keep it short, punchy, celebratory if things went well, real if they didn't. Use emojis. Max 100 words.`,
          messages:[{role:'user',content:`Write a ${month} monthly wrap for this user. Bills tracked: ${bills.length}. Total amount: $${totalDue}. Overdue bills: ${overdue}. Streak: ${streakMonths} months. Make it feel like a personalized recap they'd actually want to share.`}]
        })
      });
      const data=await res.json();
      setWrap(data.content?.map((c:any)=>c.text||'').join('')||'Could not load wrap.');
      setWrapLoaded(true);
    }catch(e){
      setWrap('Something went wrong. Try refreshing!');
    }
    setWrapLoading(false);
  }

  const isPlus=userPlan!=='Basic';
  const month=new Date().toLocaleString('en-CA',{month:'long',year:'numeric'});

  return(<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');
      :root{--blue:#2177d1;--blue-d:#1658a8;--blue-m:#3a8ee0;--blue-pale:rgba(33,119,209,0.08);--blue-glow:rgba(33,119,209,0.18);--gold:#c39a35;--gold-pale:rgba(195,154,53,0.09);--bg:#eef3fb;--text:#0c1524;--text2:#3a4f6a;--muted:#7a90aa;--border:rgba(33,119,209,0.1);--success:#22c55e;--warn:#f59e0b;--danger:#ef4444;--glass:rgba(255,255,255,0.62);--glass2:rgba(255,255,255,0.80);--gb:rgba(255,255,255,0.86);--gs:0 4px 24px rgba(33,119,209,.08),0 1px 4px rgba(0,0,0,.04),inset 0 1px 0 rgba(255,255,255,.9);--gsl:0 16px 60px rgba(33,119,209,.13),0 4px 16px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.9);}
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
      body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;min-height:100vh;overflow-x:hidden;}
      .blob{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
      .b1{width:600px;height:600px;background:radial-gradient(circle,rgba(33,119,209,.09) 0%,transparent 70%);top:-150px;left:-150px;animation:bd1 20s ease-in-out infinite;}
      .b2{width:450px;height:450px;background:radial-gradient(circle,rgba(195,154,53,.07) 0%,transparent 70%);bottom:0;right:-100px;animation:bd2 24s ease-in-out infinite;}
      @keyframes bd1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,50px)}}
      @keyframes bd2{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,-30px)}}
      /* SIDEBAR */
      .sb{position:fixed;top:0;left:0;bottom:0;width:240px;z-index:50;background:var(--glass);backdrop-filter:blur(28px) saturate(2);border-right:1px solid var(--gb);display:flex;flex-direction:column;padding:24px 16px;box-shadow:4px 0 24px rgba(33,119,209,.06);}
      .sb-logo{display:flex;align-items:center;gap:8px;padding:4px 8px 24px;border-bottom:1px solid var(--border);margin-bottom:20px;}
      .sb-logo-txt{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.3rem;letter-spacing:-.03em;color:var(--blue);}
      .sb-gem{width:6px;height:6px;background:var(--gold);border-radius:50%;box-shadow:0 0 8px var(--gold);margin-bottom:4px;animation:gp 3s ease infinite;}
      @keyframes gp{0%,100%{box-shadow:0 0 6px var(--gold);}50%{box-shadow:0 0 14px var(--gold),0 0 24px rgba(195,154,53,.3);}}
      .nav-lbl{font-size:.58rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);padding:0 8px;margin:8px 0 6px;}
      .ni{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;font-size:.84rem;font-weight:500;color:var(--text2);text-decoration:none;margin-bottom:2px;cursor:pointer;transition:background .2s,color .2s;position:relative;}
      .ni:hover{background:var(--blue-pale);color:var(--blue);}
      .ni.on{background:var(--blue-pale);color:var(--blue);font-weight:600;}
      .ni.on::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:60%;background:var(--blue);border-radius:0 3px 3px 0;}
      .ni-ic{font-size:1rem;flex-shrink:0;width:20px;text-align:center;}
      .sb-bot{margin-top:auto;padding-top:16px;border-top:1px solid var(--border);}
      .plan-pill{display:flex;align-items:center;justify-content:space-between;background:var(--blue-pale);border:1px solid rgba(33,119,209,.15);border-radius:12px;padding:10px 12px;margin-bottom:12px;}
      .pp-name{font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;font-weight:700;color:var(--blue);}
      .pp-ct{font-size:.68rem;color:var(--muted);}
      .pp-badge{font-size:.62rem;font-weight:700;color:var(--gold);background:var(--gold-pale);border:1px solid rgba(195,154,53,.2);border-radius:100px;padding:2px 8px;}
      .u-row{display:flex;align-items:center;gap:10px;padding:8px 4px;}
      .u-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--blue-m));display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;font-size:.75rem;font-weight:800;color:white;flex-shrink:0;}
      .u-name{font-size:.8rem;font-weight:600;color:var(--text);}
      /* MAIN */
      .main{margin-left:240px;padding:28px 32px;min-height:100vh;position:relative;z-index:1;}
      @keyframes fu{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
      .page-header{margin-bottom:32px;opacity:0;animation:fu .5s ease .1s forwards;}
      .page-eyebrow{font-size:.62rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;display:flex;align-items:center;gap:8px;}
      .page-eyebrow::before{content:'';width:16px;height:1.5px;background:var(--gold);opacity:.6;}
      .page-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:2rem;letter-spacing:-.04em;color:var(--text);margin-bottom:8px;}
      .page-sub{font-size:.88rem;color:var(--text2);line-height:1.7;max-width:500px;}
      /* SECTIONS */
      .learn-grid{display:grid;grid-template-columns:1fr 360px;gap:24px;}
      .learn-left{display:flex;flex-direction:column;gap:20px;}
      .learn-right{display:flex;flex-direction:column;gap:20px;}
      .panel{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:22px;box-shadow:var(--gs);overflow:hidden;opacity:0;animation:fu .5s ease .2s forwards;}
      .p-hd{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--border);}
      .p-t{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;color:var(--text);}
      .p-s{font-size:.72rem;color:var(--muted);margin-top:1px;}
      .p-body{padding:20px 24px;}
      /* AI INSIGHT */
      .insight-locked{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center;gap:12px;}
      .insight-lock-em{font-size:2.5rem;}
      .insight-lock-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1rem;color:var(--text);}
      .insight-lock-s{font-size:.8rem;color:var(--muted);max-width:280px;line-height:1.6;}
      .insight-unlock-btn{background:var(--blue);color:white;border:none;padding:10px 24px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px var(--blue-glow);}
      .insight-load-btn{display:flex;align-items:center;gap:8px;background:var(--blue);color:white;border:none;padding:10px 20px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px var(--blue-glow);transition:background .2s;}
      .insight-load-btn:hover{background:var(--blue-d);}
      .insight-text{font-size:.86rem;color:var(--text2);line-height:1.85;white-space:pre-wrap;}
      .insight-spinner{width:24px;height:24px;border:3px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .8s linear infinite;}
      @keyframes spin{to{transform:rotate(360deg);}}
      /* LITERACY CARDS */
      .cards-grid{display:flex;flex-direction:column;gap:10px;padding:16px 24px 20px;}
      .lit-card{border-radius:16px;border:1px solid var(--border);overflow:hidden;cursor:pointer;transition:box-shadow .2s;}
      .lit-card:hover{box-shadow:var(--gsl);}
      .lit-card-header{display:flex;align-items:center;gap:12px;padding:14px 16px;}
      .lit-flag{font-size:1.2rem;flex-shrink:0;}
      .lit-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.85rem;color:var(--text);flex:1;}
      .lit-tag{font-size:.58rem;font-weight:700;padding:3px 9px;border-radius:100px;white-space:nowrap;}
      .lit-chevron{font-size:.7rem;color:var(--muted);transition:transform .3s;flex-shrink:0;}
      .lit-chevron.open{transform:rotate(180deg);}
      .lit-body{max-height:0;overflow:hidden;transition:max-height .35s ease,padding .3s;}
      .lit-body.open{max-height:200px;padding:0 16px 16px;}
      .lit-body-text{font-size:.82rem;color:var(--text2);line-height:1.8;background:var(--bg);border-radius:10px;padding:12px 14px;}
      /* MONTHLY WRAP */
      .wrap-card{background:linear-gradient(135deg,var(--blue),var(--blue-d));border-radius:18px;padding:28px 24px;text-align:center;margin:16px 24px 20px;position:relative;overflow:hidden;}
      .wrap-card::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:28px 28px;}
      .wrap-inner{position:relative;z-index:1;}
      .wrap-month{font-size:.65rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:10px;}
      .wrap-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.4rem;color:white;letter-spacing:-.03em;margin-bottom:16px;}
      .wrap-text{font-size:.84rem;color:rgba(255,255,255,.88);line-height:1.75;text-align:left;white-space:pre-wrap;}
      .wrap-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;}
      .wrap-stat{background:rgba(255,255,255,.1);border-radius:12px;padding:12px 8px;text-align:center;}
      .wrap-stat-val{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.3rem;color:white;}
      .wrap-stat-lbl{font-size:.6rem;color:rgba(255,255,255,.6);margin-top:2px;}
      .wrap-load-btn{background:white;color:var(--blue);border:none;padding:10px 24px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15);transition:transform .15s;}
      .wrap-load-btn:hover{transform:translateY(-1px);}
      .wrap-spinner{width:22px;height:22px;border:3px solid rgba(33,119,209,.2);border-top-color:var(--blue);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto;}
      /* FFE SPOTLIGHT */
      .ffe-panel{background:linear-gradient(135deg,rgba(195,154,53,.06),rgba(33,119,209,.04));border:1px solid rgba(195,154,53,.18);border-radius:22px;padding:24px;box-shadow:var(--gs);opacity:0;animation:fu .5s ease .4s forwards;}
      .ffe-logo-row{display:flex;align-items:center;gap:12px;margin-bottom:16px;}
      .ffe-logo-icon{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--gold),#a07820);display:flex;align-items:center;justify-content:center;font-size:1.3rem;box-shadow:0 4px 12px rgba(195,154,53,.25);}
      .ffe-logo-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.95rem;color:var(--text);}
      .ffe-logo-sub{font-size:.68rem;color:var(--muted);}
      .ffe-desc{font-size:.82rem;color:var(--text2);line-height:1.8;margin-bottom:18px;}
      .ffe-stat-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;}
      .ffe-stat{background:rgba(255,255,255,.6);border:1px solid var(--gb);border-radius:12px;padding:12px 14px;text-align:center;}
      .ffe-stat-val{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.2rem;color:var(--gold);}
      .ffe-stat-lbl{font-size:.62rem;color:var(--muted);margin-top:2px;}
      .ffe-quote{background:rgba(255,255,255,.5);border-left:3px solid var(--gold);border-radius:0 12px 12px 0;padding:12px 16px;font-size:.8rem;color:var(--text2);line-height:1.7;font-style:italic;margin-bottom:18px;}
      .ffe-link-btn{display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,var(--gold),#a07820);color:white;padding:12px 20px;border-radius:12px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(195,154,53,.3);transition:transform .15s;}
      .ffe-link-btn:hover{transform:translateY(-1px);}
      /* UPGRADE GATE */
      .gate{background:linear-gradient(135deg,rgba(33,119,209,.05),rgba(195,154,53,.03));border:1px dashed rgba(33,119,209,.2);border-radius:16px;padding:28px 24px;text-align:center;margin:16px 24px 20px;}
      .gate-em{font-size:2rem;margin-bottom:10px;}
      .gate-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1rem;color:var(--text);margin-bottom:6px;}
      .gate-s{font-size:.8rem;color:var(--muted);line-height:1.6;margin-bottom:16px;}
      .gate-btn{background:var(--blue);color:white;border:none;padding:10px 24px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px var(--blue-glow);}
      @media(max-width:1100px){.learn-grid{grid-template-columns:1fr;}}
      @media(max-width:700px){.sb{display:none;}.main{margin-left:0;padding:16px;}}
    `}</style>

    <div className="blob b1"/><div className="blob b2"/>

    {/* SIDEBAR */}
    <aside className="sb">
      <div className="sb-logo"><span className="sb-logo-txt">Nyra</span><span className="sb-gem"/></div>
      <div className="nav-lbl">Menu</div>
      <a className="ni" href="/dashboard"><span className="ni-ic">📋</span>My Bills</a>
      <div className="ni"><span className="ni-ic">🔔</span>Reminders</div>
      <div className="ni"><span className="ni-ic">🏆</span>Achievements</div>
      <a className="ni on" href="/learn"><span className="ni-ic">🧠</span>Learn</a>
      <div className="ni"><span className="ni-ic">📊</span>Analytics</div>
      <div className="ni"><span className="ni-ic">⚙️</span>Settings</div>
      <div className="nav-lbl">Resources</div>
      <a className="ni" href="https://financialfutureseducation.com/" target="_blank" rel="noreferrer"><span className="ni-ic">🎓</span>FFE Website</a>
      <div className="sb-bot">
        <div className="plan-pill">
          <div><div className="pp-name">{userPlan} Plan</div><div className="pp-ct">Learn tab</div></div>
          <div className="pp-badge">{isPlus?'Full Access':'Limited'}</div>
        </div>
        <div className="u-row">
          <div className="u-av">{userName[0]?.toUpperCase()}</div>
          <div><div className="u-name">{userName}</div></div>
        </div>
      </div>
    </aside>

    {/* MAIN */}
    <main className="main">
      <MobileNav activePage="/learn" userName={userName} userPlan={userPlan}/>
      <div className="page-header">
        <div className="page-eyebrow">Financial literacy</div>
        <div className="page-title">🧠 Learn</div>
        <div className="page-sub">Real talk about credit, fees, and money habits — personalized to your actual bills. No boring textbook stuff.</div>
      </div>

      <div className="learn-grid">
        <div className="learn-left">

          {/* AI WEEKLY INSIGHT */}
          <div className="panel">
            <div className="p-hd">
              <div>
                <div className="p-t">✦ Nyra Insights</div>
                <div className="p-s">Personalized weekly analysis — just for you</div>
              </div>
              {isPlus && <span style={{fontSize:'.62rem',fontWeight:700,color:'var(--blue)',background:'var(--blue-pale)',border:'1px solid rgba(33,119,209,.15)',borderRadius:100,padding:'3px 10px'}}>AI-powered</span>}
            </div>
            {!isPlus ? (
              <div className="gate">
                <div className="gate-em">✦</div>
                <div className="gate-h">AI insights are a Plus feature</div>
                <div className="gate-s">Get a personalized weekly breakdown of your bills, reminder timing, and money habits — powered by Claude AI.</div>
                <button className="gate-btn" onClick={()=>window.location.href='/signup?plan=Plus&price=5'}>Upgrade to Plus →</button>
              </div>
            ) : !insightLoaded ? (
              <div className="p-body" style={{display:'flex',flexDirection:'column',gap:12}}>
                <p style={{fontSize:'.84rem',color:'var(--text2)',lineHeight:1.7}}>
                  Hey {userName} 👋 Nyra is ready to analyze your bills and give you a real talk about your financial habits this week. Takes about 5 seconds.
                </p>
                <button className="insight-load-btn" onClick={loadInsight} disabled={insightLoading}>
                  {insightLoading ? <><div className="insight-spinner"/>Analyzing your bills...</> : <>✦ Generate my weekly insight</>}
                </button>
              </div>
            ) : (
              <div className="p-body">
                <div className="insight-text">{insight}</div>
                <button className="insight-load-btn" style={{marginTop:16}} onClick={()=>{setInsightLoaded(false);setInsight('');}}>↺ Refresh insight</button>
              </div>
            )}
          </div>

          {/* FINANCIAL LITERACY CARDS */}
          <div className="panel">
            <div className="p-hd">
              <div>
                <div className="p-t">🟢🚩 Financial Literacy</div>
                <div className="p-s">The stuff they never taught you in school</div>
              </div>
            </div>
            <div className="cards-grid">
              {LITERACY_CARDS.map(c=>(
                <div key={c.id} className="lit-card" style={{background:c.tagColor}}>
                  <div className="lit-card-header" onClick={()=>setActiveCard(activeCard===c.id?null:c.id)}>
                    <span className="lit-flag">{c.flag}</span>
                    <span className="lit-title">{c.title}</span>
                    <span style={{fontSize:'.62rem',fontWeight:700,padding:'3px 9px',borderRadius:100,background:'rgba(255,255,255,.7)',color:c.tagText,whiteSpace:'nowrap'}}>{c.tag}</span>
                    <span className={`lit-chevron ${activeCard===c.id?'open':''}`}>▼</span>
                  </div>
                  <div className={`lit-body ${activeCard===c.id?'open':''}`}>
                    <div className="lit-body-text">{c.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="learn-right">

          {/* MONTHLY WRAP */}
          <div className="panel">
            <div className="p-hd">
              <div>
                <div className="p-t">🎵 Monthly Wrap</div>
                <div className="p-s">{month}</div>
              </div>
            </div>
            <div className="wrap-card">
              <div className="wrap-inner">
                <div className="wrap-month">{month.toUpperCase()}</div>
                <div className="wrap-title">Your month in bills</div>
                <div className="wrap-stats">
                  <div className="wrap-stat"><div className="wrap-stat-val">{bills.length}</div><div className="wrap-stat-lbl">Bills tracked</div></div>
                  <div className="wrap-stat"><div className="wrap-stat-val">{streakMonths}</div><div className="wrap-stat-lbl">Month streak</div></div>
                  <div className="wrap-stat"><div className="wrap-stat-val">${bills.reduce((s,b)=>s+b.amount,0).toLocaleString()}</div><div className="wrap-stat-lbl">Total due</div></div>
                </div>
                {!isPlus ? (
                  <div style={{background:'rgba(255,255,255,.12)',borderRadius:12,padding:'14px 16px',fontSize:'.78rem',color:'rgba(255,255,255,.85)',marginBottom:0}}>
                    Upgrade to Plus to unlock your personalized AI monthly wrap ✨
                    <button style={{display:'block',marginTop:10,background:'white',color:'var(--blue)',border:'none',padding:'8px 20px',borderRadius:100,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:'.78rem',cursor:'pointer'}} onClick={()=>window.location.href='/signup?plan=Plus&price=5'}>Upgrade →</button>
                  </div>
                ) : !wrapLoaded ? (
                  <button className="wrap-load-btn" onClick={loadWrap} disabled={wrapLoading}>
                    {wrapLoading?<><div className="wrap-spinner" style={{display:'inline-block',marginRight:8,verticalAlign:'middle'}}/>Generating...</>:'✦ Generate my wrap'}
                  </button>
                ) : (
                  <div className="wrap-text">{wrap}</div>
                )}
              </div>
            </div>
          </div>

          {/* FFE SPOTLIGHT */}
          <div className="ffe-panel">
            <div className="ffe-logo-row">
              <div className="ffe-logo-icon">🎓</div>
              <div>
                <div className="ffe-logo-name">Financial Futures Education</div>
                <div className="ffe-logo-sub">The mission behind Nyra</div>
              </div>
            </div>
            <div className="ffe-desc">
              20% of all Nyra profits go directly to FFE — delivering financial literacy sessions to youth in nonprofits and children&apos;s aid societies across Canada. Every bill you track contributes to that mission.
            </div>
            <div className="ffe-stat-row">
              <div className="ffe-stat"><div className="ffe-stat-val">20%</div><div className="ffe-stat-lbl">of profits donated</div></div>
              <div className="ffe-stat"><div className="ffe-stat-val">🍁</div><div className="ffe-stat-lbl">Across Canada</div></div>
            </div>
            <div className="ffe-quote">
              &ldquo;Financial literacy isn&apos;t just for people who already have money — it&apos;s for everyone who&apos;s building toward it.&rdquo;
            </div>
            <a className="ffe-link-btn" href="https://financialfutureseducation.com/" target="_blank" rel="noreferrer">
              🎓 Visit FFE Website ↗
            </a>
          </div>

        </div>
      </div>
    </main>
  </>);
}
