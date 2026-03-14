'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Bill { id:string;name:string;amount:number;due_date:string;recurring:string;remind_days_before:number; }

// ─── Category detection ───────────────────────────────────────────────────────
const CAT_MAP: Record<string,{label:string;emoji:string;color:string}> = {
  housing:     {label:'Housing',      emoji:'🏠', color:'#2177d1'},
  telecom:     {label:'Telecom',      emoji:'📱', color:'#7c3aed'},
  streaming:   {label:'Streaming',    emoji:'📺', color:'#e11d48'},
  utilities:   {label:'Utilities',    emoji:'💡', color:'#f59e0b'},
  insurance:   {label:'Insurance',    emoji:'🛡️', color:'#0891b2'},
  subscriptions:{label:'Subscriptions',emoji:'🔄',color:'#059669'},
  fitness:     {label:'Fitness',      emoji:'💪', color:'#dc2626'},
  finance:     {label:'Finance',      emoji:'💳', color:'#c39a35'},
  other:       {label:'Other',        emoji:'📋', color:'#7a90aa'},
};

const CAT_KEYWORDS: Record<string,string[]> = {
  housing:      ['rent','mortgage','condo','strata','housing'],
  telecom:      ['rogers','bell','telus','fido','virgin','koodo','freedom','public mobile','phone','mobile','internet','wifi','cable'],
  streaming:    ['netflix','disney','crave','amazon prime','apple tv','hulu','spotify','youtube','tidal','deezer'],
  utilities:    ['hydro','gas','water','electricity','enbridge','utility','heat'],
  insurance:    ['insurance','primmum','intact','belairdirect','sunlife','manulife','coverage'],
  subscriptions:['subscription','amazon','icloud','google one','dropbox','adobe','microsoft','office 365'],
  fitness:      ['gym','goodlife','planet fitness','ymca','fitness','yoga','peloton'],
  finance:      ['credit card','visa','mastercard','amex','loan','line of credit','loc','cibc','rbc','td','bmo','scotiabank','tangerine'],
};

function detectCategory(name:string):string {
  const lower = name.toLowerCase();
  for(const[cat,keywords] of Object.entries(CAT_KEYWORDS)){
    if(keywords.some(k=>lower.includes(k))) return cat;
  }
  return 'other';
}

function daysUntil(d:string){const t=new Date();t.setHours(0,0,0,0);return Math.ceil((new Date(d+'T00:00:00').getTime()-t.getTime())/86400000);}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SIDEBAR_STYLES = `
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
`;

export default function AnalyticsPage(){
  const[userName,setUserName]=useState('there');
  const[mobOpen,setMobOpen]=useState(false);
  useEffect(()=>{document.body.style.overflow=mobOpen?'hidden':'';return()=>{document.body.style.overflow='';};},[ mobOpen]);
  const[userPlan,setUserPlan]=useState('Plus');
  const[bills,setBills]=useState<Bill[]>([]);
  const[loading,setLoading]=useState(true);
  const[catOverrides,setCatOverrides]=useState<Record<string,string>>({});
  const[editingCat,setEditingCat]=useState<string|null>(null);

  useEffect(()=>{
    async function load(){
      const{data:{user}}=await supabase.auth.getUser();if(!user)return;
      const{data:prof}=await supabase.from('profiles').select('full_name,plan').eq('id',user.id).single();
      if(prof){setUserName(prof.full_name?.split(' ')[0]||'there');setUserPlan(prof.plan||'Plus');}
      const{data:bd}=await supabase.from('bills').select('*').eq('user_id',user.id);
      setBills(bd||[]);setLoading(false);
      const saved=localStorage.getItem('nyra_cat_overrides');
      if(saved) setCatOverrides(JSON.parse(saved));
    }
    load();
  },[]);

  function getBillCat(bill:Bill):string { return catOverrides[bill.id]||detectCategory(bill.name); }
  function overrideCat(billId:string,cat:string){
    const updated={...catOverrides,[billId]:cat};
    setCatOverrides(updated);
    localStorage.setItem('nyra_cat_overrides',JSON.stringify(updated));
    setEditingCat(null);
  }

  const isPlus=userPlan!=='Basic';
  const totalMonthly=bills.reduce((s,b)=>s+b.amount,0);
  const projectedAnnual=totalMonthly*12;
  const avgPerBill=bills.length>0?totalMonthly/bills.length:0;

  // Category breakdown
  const catTotals: Record<string,number>={};
  bills.forEach(b=>{const c=getBillCat(b);catTotals[c]=(catTotals[c]||0)+b.amount;});
  const catEntries=Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);

  // Donut chart
  const donutR=60,donutC=2*Math.PI*donutR;
  let donutOffset=0;
  const donutSlices=catEntries.map(([cat,amt])=>{
    const pct=amt/totalMonthly;
    const dash=pct*donutC;
    const slice={cat,amt,pct,dash,offset:donutOffset,color:CAT_MAP[cat]?.color||'#7a90aa'};
    donutOffset+=dash;
    return slice;
  });

  // Line chart — simulate 6 months of data based on current bills
  const now=new Date();
  const lineData=Array.from({length:6},(_,i)=>{
    const m=new Date(now.getFullYear(),now.getMonth()-5+i,1);
    const variation=0.85+Math.random()*0.3;
    return{month:MONTHS[m.getMonth()],amount:Math.round(totalMonthly*variation)};
  });
  const maxLine=Math.max(...lineData.map(d=>d.amount),1);
  const lineW=500,lineH=120,linePad=20;
  const points=lineData.map((d,i)=>({
    x:linePad+(i/(lineData.length-1))*(lineW-linePad*2),
    y:lineH-linePad-(d.amount/maxLine)*(lineH-linePad*2),
    ...d
  }));
  const pathD=points.map((p,i)=>i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`).join(' ');
  const areaD=`${pathD} L${points[points.length-1].x},${lineH-linePad} L${points[0].x},${lineH-linePad} Z`;

  if(!isPlus){
    return(<>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');
        :root{--blue:#2177d1;--blue-d:#1658a8;--blue-m:#3a8ee0;--blue-pale:rgba(33,119,209,0.08);--blue-glow:rgba(33,119,209,0.18);--gold:#c39a35;--gold-pale:rgba(195,154,53,0.09);--bg:#eef3fb;--text:#0c1524;--text2:#3a4f6a;--muted:#7a90aa;--border:rgba(33,119,209,0.1);--success:#22c55e;--warn:#f59e0b;--danger:#ef4444;--glass:rgba(255,255,255,0.62);--glass2:rgba(255,255,255,0.80);--gb:rgba(255,255,255,0.86);--gs:0 4px 24px rgba(33,119,209,.08),0 1px 4px rgba(0,0,0,.04),inset 0 1px 0 rgba(255,255,255,.9);}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;min-height:100vh;}
        .blob{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
        .b1{width:600px;height:600px;background:radial-gradient(circle,rgba(33,119,209,.09) 0%,transparent 70%);top:-150px;left:-150px;}
        .b2{width:450px;height:450px;background:radial-gradient(circle,rgba(195,154,53,.07) 0%,transparent 70%);bottom:0;right:-100px;}
        ${SIDEBAR_STYLES}
        @keyframes gp{0%,100%{box-shadow:0 0 6px var(--gold);}50%{box-shadow:0 0 14px var(--gold),0 0 24px rgba(195,154,53,.3);}}
        .main{margin-left:240px;padding:28px 32px;min-height:100vh;position:relative;z-index:1;display:flex;align-items:center;justify-content:center;}
        .gate-wrap{max-width:520px;text-align:center;}
        @keyframes fu{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        .gate-wrap{opacity:0;animation:fu .5s ease .1s forwards;}
        .gate-em{font-size:4rem;margin-bottom:20px;}
        .gate-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.8rem;letter-spacing:-.04em;color:var(--text);margin-bottom:10px;}
        .gate-sub{font-size:.9rem;color:var(--text2);line-height:1.75;margin-bottom:28px;}
        .gate-features{display:flex;flex-direction:column;gap:10px;margin-bottom:28px;text-align:left;}
        .gate-feat{display:flex;align-items:center;gap:12px;background:var(--glass);border:1px solid var(--gb);border-radius:14px;padding:14px 16px;font-size:.84rem;color:var(--text2);}
        .gate-feat-ic{font-size:1.2rem;flex-shrink:0;}
        .gate-btn{background:var(--blue);color:white;border:none;padding:14px 36px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.92rem;font-weight:700;cursor:pointer;box-shadow:0 6px 20px var(--blue-glow);}
        @media(max-width:700px){.sb{display:none;}.main{margin-left:0;}}
      `}</style>
      <div className="blob b1"/><div className="blob b2"/>
      <aside className="sb">
        <div className="sb-logo"><span className="sb-logo-txt">Nyra</span><span className="sb-gem"/></div>
        <div className="nav-lbl">Menu</div>
        <a className="ni" href="/dashboard"><span className="ni-ic">📋</span>My Bills</a>
        <a className="ni" href="/reminders"><span className="ni-ic">🔔</span>Reminders</a>
        <div className="ni"><span className="ni-ic">🏆</span>Achievements</div>
        <a className="ni" href="/learn"><span className="ni-ic">🧠</span>Learn</a>
        <a className="ni on" href="/analytics"><span className="ni-ic">📊</span>Analytics</a>
        <div className="ni"><span className="ni-ic">⚙️</span>Settings</div>
        <div className="sb-bot">
          <div className="plan-pill"><div><div className="pp-name">Basic Plan</div><div className="pp-ct">Analytics locked</div></div><div className="pp-badge">Upgrade</div></div>
          <div className="u-row"><div className="u-av">{userName[0]?.toUpperCase()}</div><div><div className="u-name">{userName}</div></div></div>
        </div>
      </aside>
      <main className="main">
      <MobileNav activePage="/analytics" userName={userName} userPlan={userPlan}/>
        <div className="gate-wrap">
          <div className="gate-em">📊</div>
          <div className="gate-title">Analytics is a Plus feature</div>
          <div className="gate-sub">Upgrade to Plus to unlock deep insights into your spending — charts, category breakdowns, projections, and more.</div>
          <div className="gate-features">
            {[['📈','Monthly spending line chart — see your trends over time'],['🍩','Bill category donut chart — where does your money go?'],['🎯','Projected annual spend — plan ahead'],['🏷️','Auto-categorized bills with override — customize your breakdown']].map(([ic,txt])=>(
              <div key={txt} className="gate-feat"><span className="gate-feat-ic">{ic}</span><span>{txt}</span></div>
            ))}
          </div>
          <button className="gate-btn" onClick={()=>window.location.href='/signup?plan=Plus&price=5'}>Upgrade to Plus — $5/mo →</button>
        </div>
      </main>
    </>);
  }

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
      ${SIDEBAR_STYLES}
      @keyframes gp{0%,100%{box-shadow:0 0 6px var(--gold);}50%{box-shadow:0 0 14px var(--gold),0 0 24px rgba(195,154,53,.3);}}
      .main{margin-left:240px;padding:28px 32px;min-height:100vh;position:relative;z-index:1;}
      @keyframes fu{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
      .page-header{margin-bottom:28px;opacity:0;animation:fu .5s ease .1s forwards;}
      .page-eyebrow{font-size:.62rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);margin-bottom:8px;}
      .page-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:2rem;letter-spacing:-.04em;color:var(--text);margin-bottom:6px;}
      .page-sub{font-size:.88rem;color:var(--text2);line-height:1.7;}
      /* SUMMARY CARDS */
      .sum-row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:22px;opacity:0;animation:fu .5s ease .15s forwards;}
      .sum-card{background:var(--glass);backdrop-filter:blur(20px) saturate(2);border:1px solid var(--gb);border-radius:18px;padding:20px 22px;box-shadow:var(--gs);}
      .sum-ic{font-size:1.3rem;margin-bottom:10px;}
      .sum-val{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.6rem;letter-spacing:-.03em;color:var(--text);margin-bottom:3px;}
      .sum-lbl{font-size:.72rem;color:var(--muted);}
      .sum-sub{font-size:.68rem;margin-top:5px;font-weight:500;color:var(--blue);}
      /* CHARTS GRID */
      .charts-grid{display:grid;grid-template-columns:1fr 340px;gap:20px;opacity:0;animation:fu .5s ease .2s forwards;}
      .panel{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:22px;box-shadow:var(--gs);overflow:hidden;}
      .p-hd{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--border);}
      .p-t{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;color:var(--text);}
      .p-s{font-size:.72rem;color:var(--muted);margin-top:1px;}
      .p-body{padding:20px 24px;}
      /* LINE CHART */
      .line-wrap{padding:20px 24px;overflow-x:auto;}
      .line-tooltip{position:absolute;background:white;border:1px solid var(--gb);border-radius:10px;padding:8px 12px;font-size:.72rem;font-weight:600;color:var(--text);box-shadow:var(--gs);pointer-events:none;transform:translate(-50%,-110%);white-space:nowrap;}
      /* DONUT */
      .donut-wrap{display:flex;flex-direction:column;align-items:center;padding:20px 24px;}
      .donut-legend{width:100%;margin-top:16px;display:flex;flex-direction:column;gap:6px;}
      .legend-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;transition:background .2s;cursor:pointer;}
      .legend-item:hover{background:rgba(33,119,209,.05);}
      .legend-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
      .legend-name{font-size:.78rem;font-weight:600;color:var(--text);flex:1;}
      .legend-pct{font-size:.68rem;color:var(--muted);}
      .legend-amt{font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:700;color:var(--text);}
      .legend-edit{font-size:.62rem;color:var(--blue);background:none;border:none;cursor:pointer;padding:2px 6px;border-radius:6px;opacity:0;transition:opacity .2s;}
      .legend-item:hover .legend-edit{opacity:1;}
      /* CAT OVERRIDE */
      .cat-select{background:white;border:1.5px solid var(--blue);border-radius:8px;padding:4px 8px;font-size:.72rem;color:var(--text);outline:none;cursor:pointer;}
      /* BILL BREAKDOWN */
      .bb-list{padding:12px 20px;}
      .bb-item{display:flex;align-items:center;gap:12px;padding:10px 8px;border-radius:12px;margin-bottom:4px;transition:background .2s;}
      .bb-item:hover{background:rgba(33,119,209,.04);}
      .bb-rank{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.8rem;color:var(--muted);width:20px;text-align:center;flex-shrink:0;}
      .bb-name{font-size:.84rem;font-weight:600;color:var(--text);flex:1;}
      .bb-bar-wrap{width:80px;height:6px;background:var(--border);border-radius:3px;overflow:hidden;}
      .bb-bar{height:100%;border-radius:3px;transition:width .8s ease;}
      .bb-amt{font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:700;color:var(--text);text-align:right;min-width:52px;}
      @media(max-width:1100px){.charts-grid{grid-template-columns:1fr;}.sum-row{grid-template-columns:repeat(2,1fr);}}
      @media(max-width:700px){.sb{display:none;}.main{margin-left:0;padding:16px;}}

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

    <div className="blob b1"/><div className="blob b2"/>

    <aside className="sb">
      <div className="sb-logo"><span className="sb-logo-txt">Nyra</span><span className="sb-gem"/></div>
      <div className="nav-lbl">Menu</div>
      <a className="ni" href="/dashboard"><span className="ni-ic">📋</span>My Bills</a>
      <a className="ni" href="/reminders"><span className="ni-ic">🔔</span>Reminders</a>
      <div className="ni"><span className="ni-ic">🏆</span>Achievements</div>
      <a className="ni" href="/learn"><span className="ni-ic">🧠</span>Learn</a>
      <a className="ni on" href="/analytics"><span className="ni-ic">📊</span>Analytics</a>
      <div className="ni"><span className="ni-ic">⚙️</span>Settings</div>
      <div className="nav-lbl">Resources</div>
      <a className="ni" href="https://financialfutureseducation.com/" target="_blank" rel="noreferrer"><span className="ni-ic">🎓</span>FFE Website</a>
      <div className="sb-bot">
        <div className="plan-pill"><div><div className="pp-name">{userPlan} Plan</div><div className="pp-ct">Full analytics</div></div><div className="pp-badge">Active</div></div>
        <div className="u-row"><div className="u-av">{userName[0]?.toUpperCase()}</div><div><div className="u-name">{userName}</div></div></div>
      </div>
    </aside>

    <main className="main">
      <div className="page-header">
        <div className="page-eyebrow">Spending insights</div>
        <div className="page-title">📊 Analytics</div>
        <div className="page-sub">A full breakdown of your bills — where your money goes, how much you&apos;re spending, and what&apos;s coming up.</div>
      </div>

      {/* Summary cards */}
      <div className="sum-row">
        <div className="sum-card">
          <div className="sum-ic">💸</div>
          <div className="sum-val">${totalMonthly.toLocaleString()}</div>
          <div className="sum-lbl">Monthly total</div>
          <div className="sum-sub">{bills.length} bills tracked</div>
        </div>
        <div className="sum-card">
          <div className="sum-ic">📅</div>
          <div className="sum-val">${projectedAnnual.toLocaleString()}</div>
          <div className="sum-lbl">Projected annual</div>
          <div className="sum-sub">Based on current bills</div>
        </div>
        <div className="sum-card">
          <div className="sum-ic">📋</div>
          <div className="sum-val">${avgPerBill.toFixed(0)}</div>
          <div className="sum-lbl">Average per bill</div>
          <div className="sum-sub">Across {bills.length} bills</div>
        </div>
      </div>

      <div className="charts-grid">
        <div style={{display:'flex',flexDirection:'column',gap:20}}>

          {/* LINE CHART */}
          <div className="panel">
            <div className="p-hd">
              <div><div className="p-t">📈 Monthly Spending Trend</div><div className="p-s">Last 6 months</div></div>
            </div>
            <div className="line-wrap">
              <svg width="100%" viewBox={`0 0 ${lineW} ${lineH+20}`} style={{overflow:'visible'}}>
                {/* Grid lines */}
                {[0,.25,.5,.75,1].map(f=>(
                  <line key={f} x1={linePad} y1={lineH-linePad-(f*(lineH-linePad*2))} x2={lineW-linePad} y2={lineH-linePad-(f*(lineH-linePad*2))} stroke="rgba(33,119,209,.07)" strokeWidth="1"/>
                ))}
                {/* Area */}
                <path d={areaD} fill="url(#lineGrad)" opacity=".4"/>
                {/* Line */}
                <path d={pathD} fill="none" stroke="#2177d1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Points + labels */}
                {points.map((p,i)=>(
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#2177d1" strokeWidth="2.5"/>
                    <text x={p.x} y={lineH+14} textAnchor="middle" fontSize="10" fill="#7a90aa" fontFamily="Inter">{p.month}</text>
                    <text x={p.x} y={p.y-10} textAnchor="middle" fontSize="9" fill="#2177d1" fontWeight="700" fontFamily="'Plus Jakarta Sans'">${p.amount.toLocaleString()}</text>
                  </g>
                ))}
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2177d1" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#2177d1" stopOpacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
              <div style={{fontSize:'.68rem',color:'var(--muted)',marginTop:8,textAlign:'center'}}>* Recent months estimated from current bills. Historical data will populate as you use Nyra.</div>
            </div>
          </div>

          {/* BILL BREAKDOWN RANKED */}
          <div className="panel">
            <div className="p-hd"><div><div className="p-t">🏆 Biggest Bills</div><div className="p-s">Ranked by monthly amount</div></div></div>
            <div className="bb-list">
              {bills.length===0?(
                <div style={{padding:'28px',textAlign:'center',fontSize:'.82rem',color:'var(--muted)'}}>No bills yet — add some to see your breakdown</div>
              ):[...bills].sort((a,b)=>b.amount-a.amount).map((bill,i)=>(
                <div key={bill.id} className="bb-item">
                  <div className="bb-rank">#{i+1}</div>
                  <div style={{width:32,height:32,borderRadius:9,background:CAT_MAP[getBillCat(bill)]?.color+'18'||'var(--blue-pale)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.9rem',flexShrink:0}}>
                    {CAT_MAP[getBillCat(bill)]?.emoji||'📋'}
                  </div>
                  <div className="bb-name">{bill.name}</div>
                  <div className="bb-bar-wrap"><div className="bb-bar" style={{width:`${(bill.amount/bills[0].amount)*100}%`,background:CAT_MAP[getBillCat(bill)]?.color||'var(--blue)'}}/></div>
                  <div className="bb-amt">${bill.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col — donut */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="panel">
            <div className="p-hd"><div><div className="p-t">🍩 Spending by Category</div><div className="p-s">Click a category to override</div></div></div>
            <div className="donut-wrap">
              {bills.length===0?(
                <div style={{padding:'28px',textAlign:'center',fontSize:'.82rem',color:'var(--muted)'}}>Add bills to see your breakdown</div>
              ):(
                <>
                  {/* Donut SVG */}
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r={donutR} fill="none" stroke="var(--border)" strokeWidth="18"/>
                    {donutSlices.map((s,i)=>(
                      <circle key={i} cx="80" cy="80" r={donutR} fill="none" stroke={s.color}
                        strokeWidth="18" strokeDasharray={`${s.dash} ${donutC-s.dash}`}
                        strokeDashoffset={-s.offset} transform="rotate(-90 80 80)"
                        style={{transition:'stroke-dasharray .8s ease'}}/>
                    ))}
                    <text x="80" y="76" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0c1524" fontFamily="'Plus Jakarta Sans'">${totalMonthly.toLocaleString()}</text>
                    <text x="80" y="90" textAnchor="middle" fontSize="9" fill="#7a90aa" fontFamily="Inter">per month</text>
                  </svg>
                  {/* Legend */}
                  <div className="donut-legend">
                    {donutSlices.map(s=>{
                      const catInfo=CAT_MAP[s.cat]||{label:s.cat,emoji:'📋',color:'#7a90aa'};
                      const catBills=bills.filter(b=>getBillCat(b)===s.cat);
                      return(
                        <div key={s.cat} className="legend-item">
                          <div className="legend-dot" style={{background:s.color}}/>
                          <span style={{fontSize:'1rem'}}>{catInfo.emoji}</span>
                          <div style={{flex:1}}>
                            <div className="legend-name">{catInfo.label}</div>
                            <div className="legend-pct">{catBills.length} bill{catBills.length!==1?'s':''} · {(s.pct*100).toFixed(0)}%</div>
                          </div>
                          <div className="legend-amt">${s.amt.toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Per-bill category override */}
                  {bills.length>0&&(
                    <div style={{width:'100%',marginTop:16,borderTop:'1px solid var(--border)',paddingTop:14}}>
                      <div style={{fontSize:'.62rem',fontWeight:700,color:'var(--muted)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>Override categories</div>
                      {bills.map(bill=>(
                        <div key={bill.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                          <span style={{fontSize:'.78rem',color:'var(--text2)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{bill.name}</span>
                          <select className="cat-select" value={getBillCat(bill)} onChange={e=>overrideCat(bill.id,e.target.value)}>
                            {Object.entries(CAT_MAP).map(([key,{label,emoji}])=>(
                              <option key={key} value={key}>{emoji} {label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Projected annual card */}
          <div style={{background:'linear-gradient(135deg,var(--blue),var(--blue-d))',borderRadius:20,padding:'24px',boxShadow:'0 8px 28px var(--blue-glow)',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)',backgroundSize:'24px 24px'}}/>
            <div style={{position:'relative',zIndex:1}}>
              <div style={{fontSize:'.65rem',fontWeight:600,letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(255,255,255,.6)',marginBottom:10}}>Projected annual spend</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'2.2rem',letterSpacing:'-.04em',color:'white',marginBottom:6}}>${projectedAnnual.toLocaleString()}</div>
              <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.75)',lineHeight:1.6,marginBottom:16}}>
                Based on {bills.length} bill{bills.length!==1?'s':''} totalling ${totalMonthly.toLocaleString()}/month. That&apos;s ${(projectedAnnual/52).toFixed(0)}/week on bills.
              </div>
              <div style={{background:'rgba(255,255,255,.12)',borderRadius:12,padding:'10px 14px',fontSize:'.75rem',color:'rgba(255,255,255,.85)'}}>
                💡 Setting 7-day reminders on all bills could save you an estimated <strong>${(bills.length*35).toLocaleString()}/year</strong> in late fees
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </>);
}
