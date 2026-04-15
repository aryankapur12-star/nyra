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
  if(!name) return 'other';
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
  const[hoveredPoint,setHoveredPoint]=useState<number|null>(null);
  const[hoveredSlice,setHoveredSlice]=useState<string|null>(null);
  const[timeRange,setTimeRange]=useState<'6m'|'12m'>('6m');

  useEffect(()=>{
    async function load(){
      const{data:{user}}=await supabase.auth.getUser();
      // Use logged in user or fallback for testing
      const uid = user?.id || 'ef38b136-4454-4599-9eb8-06a4197dfed5';
      
      const{data:prof}=await supabase.from('profiles').select('full_name,first_name,plan').eq('id',uid).single();
      if(prof){setUserName(prof.first_name||prof.full_name?.split(' ')[0]||'there');setUserPlan(prof.plan||'Plus');}
      const{data:bd}=await supabase.from('bills').select('*').eq('user_id',uid);
      setBills((bd||[]).map(b=>({...b,name:b.bill_name||b.name||'Untitled'})));
      setLoading(false);
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
  
  // Canadian benchmarks for comparison
  const CAN_BENCHMARKS: Record<string,{avg:number;source:string}>={
    housing:{avg:1800,source:'CMHC'},
    telecom:{avg:150,source:'CRTC'},
    streaming:{avg:45,source:'StatsCan'},
    utilities:{avg:180,source:'StatsCan'},
    insurance:{avg:250,source:'IBC'},
  };
  
  // Subscription tracking (used by multiple sections)
  const subCats=['streaming','subscriptions','fitness'];
  const subTotal=subCats.reduce((s,c)=>s+(catTotals[c]||0),0);
  const subCount=bills.filter(b=>subCats.includes(getBillCat(b))).length;
  
  // Generate AI insights based on spending patterns
  const aiInsights = (() => {
    const insights: {type:'warning'|'tip'|'success'|'info';title:string;detail:string;icon:string}[] = [];
    
    // 1. Check biggest category
    if(catEntries.length>0){
      const[topCat,topAmt]=catEntries[0];
      const topPct=(topAmt/totalMonthly*100).toFixed(0);
      const catInfo=CAT_MAP[topCat];
      if(parseFloat(topPct)>50){
        insights.push({type:'warning',icon:'⚠️',title:`${catInfo?.label||topCat} dominates your spending`,detail:`At ${topPct}% of your budget, consider if there's room to reduce ${catInfo?.label?.toLowerCase()||topCat} costs.`});
      }
    }
    
    // 2. Compare to Canadian benchmarks
    for(const[cat,amt]of catEntries){
      const bench=CAN_BENCHMARKS[cat];
      if(bench&&amt>bench.avg*1.3){
        const catInfo=CAT_MAP[cat];
        insights.push({type:'tip',icon:'💡',title:`${catInfo?.label} above Canadian average`,detail:`You're spending $${amt.toLocaleString()}/mo vs the Canadian average of $${bench.avg} (${bench.source}). Potential savings: $${(amt-bench.avg).toLocaleString()}/mo.`});
      }
    }
    
    // 3. Subscription creep detection
    if(subCount>=4){
      insights.push({type:'warning',icon:'🔄',title:`${subCount} recurring subscriptions detected`,detail:`You're spending $${subTotal.toLocaleString()}/mo on subscriptions ($${(subTotal*12).toLocaleString()}/year). Review if you're using all of them.`});
    }
    
    // 4. High projected annual
    if(projectedAnnual>50000){
      insights.push({type:'info',icon:'📊',title:'Significant annual outflow',detail:`At $${projectedAnnual.toLocaleString()}/year in bills, small percentage savings can have big impact. Even 5% = $${(projectedAnnual*0.05).toLocaleString()} saved.`});
    }
    
    // 5. Positive feedback
    if(catEntries.length>=3&&insights.filter(i=>i.type==='warning').length===0){
      insights.push({type:'success',icon:'✅',title:'Balanced spending profile',detail:'Your bills are well-distributed across categories. Keep monitoring for any category creeping up over time.'});
    }
    
    // 6. Telecom bundling opportunity
    const telecomBills=bills.filter(b=>getBillCat(b)==='telecom');
    if(telecomBills.length>=2){
      const telecomTotal=telecomBills.reduce((s,b)=>s+b.amount,0);
      insights.push({type:'tip',icon:'📱',title:'Telecom bundling opportunity',detail:`You have ${telecomBills.length} telecom bills totaling $${telecomTotal}/mo. Bundling with one provider could save 15-25%.`});
    }
    
    return insights.slice(0,4); // Max 4 insights
  })();

  // Financial Literacy Tips based on user's spending
  const finLiteracyTips = (() => {
    const tips: {title:string;content:string;icon:string;category:string;actionable:string}[] = [];
    
    // Housing tips
    if(catTotals['housing']){
      const housingPct = (catTotals['housing']/totalMonthly*100);
      if(housingPct > 30){
        tips.push({
          icon:'🏠',
          category:'Housing',
          title:'The 30% Rule',
          content:`Your housing costs are ${housingPct.toFixed(0)}% of your tracked bills. Financial experts recommend keeping housing under 30% of gross income to maintain financial flexibility.`,
          actionable:'Consider if refinancing, roommates, or a housing change could help.'
        });
      }
    }
    
    // Emergency fund tip based on total bills
    tips.push({
      icon:'🛡️',
      category:'Emergency Fund',
      title:'3-6 Month Safety Net',
      content:`Based on your bills, you'd need $${(totalMonthly*3).toLocaleString()} to $${(totalMonthly*6).toLocaleString()} to cover 3-6 months of expenses — the recommended emergency fund size.`,
      actionable:'Start with $1,000, then build to 1 month of bills, then grow from there.'
    });
    
    // Insurance tip
    if(catTotals['insurance']){
      tips.push({
        icon:'📋',
        category:'Insurance',
        title:'Annual Policy Review',
        content:'Reviewing insurance policies annually can save 10-20%. Rates change, and bundling home + auto often unlocks discounts.',
        actionable:'Set a calendar reminder to shop around before each renewal.'
      });
    }
    
    // Credit score tip for finance category
    if(catTotals['finance']){
      tips.push({
        icon:'📈',
        category:'Credit Health',
        title:'Payment History = 35% of Credit Score',
        content:'Your payment history is the biggest factor in your credit score. Even one late payment can drop your score 50-100 points and stay on record for 6 years in Canada.',
        actionable:'Use Nyra reminders to never miss a payment deadline.'
      });
    }
    
    // Utility saving tip
    if(catTotals['utilities']){
      tips.push({
        icon:'💡',
        category:'Utilities',
        title:'Time-of-Use Savings',
        content:'In Ontario, electricity rates vary by time of day. Off-peak hours (7pm-7am weekdays, all day weekends) can be 50% cheaper.',
        actionable:'Run dishwashers, laundry, and EV charging during off-peak hours.'
      });
    }
    
    // Subscription audit tip
    if(subCount>=2){
      tips.push({
        icon:'🔍',
        category:'Subscriptions',
        title:'The Subscription Audit',
        content:`The average Canadian has 5+ subscriptions and wastes $200+/year on unused ones. You have ${subCount} subscriptions totaling $${subTotal}/mo.`,
        actionable:'Do a quarterly "subscription audit" — cancel anything unused for 30+ days.'
      });
    }
    
    // 50/30/20 rule
    tips.push({
      icon:'📊',
      category:'Budgeting',
      title:'The 50/30/20 Rule',
      content:'A popular budgeting framework: 50% of income to needs (bills, groceries), 30% to wants (entertainment, dining), 20% to savings/debt.',
      actionable:'Track where your spending falls and adjust categories accordingly.'
    });
    
    return tips.slice(0,6); // Max 6 tips
  })();

  // Smart Savings Opportunities
  const savingsOpportunities = (() => {
    const opps: {title:string;potentialSavings:string;difficulty:'Easy'|'Medium'|'Hard';description:string}[] = [];
    
    // Negotiate telecom
    if(catTotals['telecom'] && catTotals['telecom'] > 100){
      opps.push({
        title:'Negotiate telecom rates',
        potentialSavings:`$${Math.round(catTotals['telecom']*0.2)}/mo`,
        difficulty:'Easy',
        description:'Call retention departments and ask for loyalty discounts. Success rate: ~70%.'
      });
    }
    
    // Switch to annual billing
    const annualSavings = Math.round(totalMonthly * 0.15);
    opps.push({
      title:'Switch to annual billing',
      potentialSavings:`$${annualSavings}/year`,
      difficulty:'Easy',
      description:'Many services offer 15-20% off for annual vs monthly billing.'
    });
    
    // Streaming rotation
    if(catTotals['streaming'] && catTotals['streaming'] > 30){
      opps.push({
        title:'Rotate streaming services',
        potentialSavings:`$${Math.round(catTotals['streaming']*0.5)}/mo`,
        difficulty:'Easy',
        description:'Subscribe to one service at a time, binge, cancel, rotate to next.'
      });
    }
    
    // Insurance bundling
    if(catTotals['insurance'] && catTotals['insurance'] > 200){
      opps.push({
        title:'Bundle insurance policies',
        potentialSavings:`$${Math.round(catTotals['insurance']*0.15)}/mo`,
        difficulty:'Medium',
        description:'Combining home, auto, and life with one insurer typically saves 10-25%.'
      });
    }
    
    // Energy audit
    if(catTotals['utilities'] && catTotals['utilities'] > 150){
      opps.push({
        title:'Home energy audit',
        potentialSavings:`$${Math.round(catTotals['utilities']*0.2)}/mo`,
        difficulty:'Medium',
        description:'Many utilities offer free audits. LED bulbs, smart thermostats, and sealing drafts add up.'
      });
    }
    
    return opps.slice(0,4);
  })();

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

  // Line chart — simulate historical data based on current bills
  // Use seeded variation so it doesn't change on every render
  const now=new Date();
  const monthCount=timeRange==='12m'?12:6;
  const lineData=Array.from({length:monthCount},(_,i)=>{
    const m=new Date(now.getFullYear(),now.getMonth()-(monthCount-1)+i,1);
    // Seeded variation based on month index
    const seed=(m.getMonth()+1)*0.1;
    const variation=0.85+((Math.sin(seed*10)+1)/2)*0.3;
    // Add slight growth trend
    const growthFactor=1+(i*0.02);
    return{
      month:MONTHS[m.getMonth()],
      year:m.getFullYear(),
      amount:Math.round(totalMonthly*variation*growthFactor),
      isProjected:i>=monthCount-1
    };
  });
  const maxLine=Math.max(...lineData.map(d=>d.amount),1);
  const minLine=Math.min(...lineData.map(d=>d.amount));
  const lineW=560,lineH=140,linePad=30;
  const points=lineData.map((d,i)=>({
    x:linePad+(i/(lineData.length-1))*(lineW-linePad*2),
    y:lineH-linePad-((d.amount-minLine*0.9)/((maxLine-minLine*0.9)||1))*(lineH-linePad*2-10),
    ...d
  }));
  const pathD=points.map((p,i)=>i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`).join(' ');
  // Smooth bezier curve
  const smoothPath=points.reduce((acc,p,i,arr)=>{
    if(i===0)return`M${p.x},${p.y}`;
    const prev=arr[i-1];
    const cpx1=prev.x+(p.x-prev.x)/2;
    const cpx2=prev.x+(p.x-prev.x)/2;
    return`${acc} C${cpx1},${prev.y} ${cpx2},${p.y} ${p.x},${p.y}`;
  },'');
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
        .main{margin-left:240px;padding:28px 32px;min-height:100vh;position:relative;z-index:1;}
        @keyframes fu{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        
        /* Gate Layout */
        .gate-container{display:grid;grid-template-columns:1fr 1fr;gap:40px;max-width:1100px;margin:0 auto;align-items:center;min-height:calc(100vh - 120px);}
        .gate-left{opacity:0;animation:fu .5s ease .1s forwards;}
        .gate-badge{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,var(--gold),#d4a84b);color:white;padding:6px 14px;border-radius:100px;font-size:.7rem;font-weight:700;letter-spacing:.05em;margin-bottom:20px;}
        .gate-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:2.4rem;letter-spacing:-.04em;color:var(--text);margin-bottom:14px;line-height:1.2;}
        .gate-title span{background:linear-gradient(135deg,var(--blue),#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
        .gate-sub{font-size:1rem;color:var(--text2);line-height:1.8;margin-bottom:32px;}
        .gate-features{display:flex;flex-direction:column;gap:12px;margin-bottom:32px;}
        .gate-feat{display:flex;align-items:flex-start;gap:14px;padding:16px 18px;background:var(--glass);border:1px solid var(--gb);border-radius:16px;transition:all .2s;}
        .gate-feat:hover{transform:translateX(4px);border-color:rgba(33,119,209,.2);}
        .gate-feat-ic{font-size:1.3rem;flex-shrink:0;margin-top:2px;}
        .gate-feat-content{flex:1;}
        .gate-feat-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.9rem;color:var(--text);margin-bottom:3px;}
        .gate-feat-desc{font-size:.78rem;color:var(--muted);line-height:1.5;}
        .gate-cta{display:flex;align-items:center;gap:16px;}
        .gate-btn{background:linear-gradient(135deg,var(--blue),#4f8ed9);color:white;border:none;padding:16px 32px;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.95rem;font-weight:700;cursor:pointer;box-shadow:0 8px 24px var(--blue-glow);transition:all .2s;}
        .gate-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px var(--blue-glow);}
        .gate-price{font-size:.82rem;color:var(--muted);}
        .gate-price strong{color:var(--text);font-weight:700;}
        
        /* Preview Panel */
        .gate-right{opacity:0;animation:fu .5s ease .2s forwards;}
        .gate-preview{background:var(--glass);backdrop-filter:blur(20px) saturate(2);border:1px solid var(--gb);border-radius:24px;padding:24px;box-shadow:var(--gs);position:relative;overflow:hidden;}
        .gate-preview::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,transparent 40%,rgba(33,119,209,.03) 100%);pointer-events:none;}
        .gate-preview-badge{position:absolute;top:16px;right:16px;background:rgba(33,119,209,.1);color:var(--blue);padding:4px 10px;border-radius:6px;font-size:.68rem;font-weight:700;}
        .gate-preview-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.85rem;color:var(--text);margin-bottom:16px;display:flex;align-items:center;gap:8px;}
        
        /* Blurred Preview Charts */
        .preview-chart{background:linear-gradient(135deg,rgba(33,119,209,.08),rgba(99,102,241,.05));border-radius:16px;padding:20px;margin-bottom:16px;position:relative;}
        .preview-chart::after{content:'';position:absolute;inset:0;backdrop-filter:blur(3px);background:rgba(255,255,255,.4);border-radius:16px;}
        .preview-donut{width:100px;height:100px;border-radius:50%;background:conic-gradient(#2177d1 0% 35%,#7c3aed 35% 55%,#f59e0b 55% 75%,#059669 75% 100%);margin:0 auto 12px;position:relative;}
        .preview-donut::before{content:'';position:absolute;inset:20px;background:white;border-radius:50%;}
        .preview-bars{display:flex;flex-direction:column;gap:8px;}
        .preview-bar{height:8px;border-radius:4px;background:linear-gradient(90deg,var(--blue) var(--w),var(--border) var(--w));}
        .preview-legend{display:flex;gap:12px;justify-content:center;margin-top:12px;}
        .preview-legend span{font-size:.68rem;color:var(--muted);display:flex;align-items:center;gap:4px;}
        .preview-legend span::before{content:'';width:8px;height:8px;border-radius:50%;}
        
        .gate-lock-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:10;}
        .gate-lock{width:48px;height:48px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.4rem;box-shadow:0 4px 20px rgba(0,0,0,.1);}
        
        @media(max-width:900px){.gate-container{grid-template-columns:1fr;}.gate-right{order:-1;}.gate-preview{max-width:400px;margin:0 auto;}}
        @media(max-width:700px){.sb{display:none;}.main{margin-left:0;padding:20px;}.gate-title{font-size:1.8rem;}}
      `}</style>
      <div className="blob b1"/><div className="blob b2"/>
      <aside className="sb">
        <a href="/dashboard" className="sb-logo" style={{textDecoration:"none"}}><span className="sb-logo-txt">Nyra</span><span className="sb-gem"/></a>
        <div className="nav-lbl">Menu</div>
        <a className="ni" href="/dashboard"><span className="ni-ic">📋</span>My Bills</a>
        <a className="ni" href="/reminders"><span className="ni-ic">🔔</span>Reminders</a>
        <a className="ni" href="/learn"><span className="ni-ic">🧠</span>Learn</a>
        <a className="ni" href="/achievements"><span className="ni-ic">🏆</span>Achievements</a>
        <a className="ni on" href="/analytics"><span className="ni-ic">📊</span>Analytics</a>
        <a className="ni" href="/settings"><span className="ni-ic">⚙️</span>Settings</a>
        <div className="nav-lbl">Resources</div>
        <a className="ni" href="https://financialfutureseducation.com/" target="_blank" rel="noreferrer"><span className="ni-ic">🎓</span>FFE Website</a>
        <div className="sb-bot">
          <div className="plan-pill"><div><div className="pp-name">Basic Plan</div><div className="pp-ct">Analytics locked</div></div><div className="pp-badge">Upgrade</div></div>
          <div className="u-row"><div className="u-av">{userName[0]?.toUpperCase()}</div><div><div className="u-name">{userName}</div></div></div>
        </div>
      </aside>
      <main className="main">
        <div className="gate-container">
          <div className="gate-left">
            <div className="gate-badge">✦ PLUS & POWER FEATURE</div>
            <div className="gate-title">Unlock <span>Analytics</span> to see where your money goes</div>
            <div className="gate-sub">Get deep insights into your spending patterns, track trends over time, and discover opportunities to save with AI-powered analysis.</div>
            <div className="gate-features">
              <div className="gate-feat">
                <span className="gate-feat-ic">📈</span>
                <div className="gate-feat-content">
                  <div className="gate-feat-title">Spending Trend Charts</div>
                  <div className="gate-feat-desc">Interactive line charts showing your spending over 6-12 months</div>
                </div>
              </div>
              <div className="gate-feat">
                <span className="gate-feat-ic">🍩</span>
                <div className="gate-feat-content">
                  <div className="gate-feat-title">Category Breakdown</div>
                  <div className="gate-feat-desc">See exactly where your money goes with auto-categorized bills</div>
                </div>
              </div>
              <div className="gate-feat">
                <span className="gate-feat-ic">🏷️</span>
                <div className="gate-feat-content">
                  <div className="gate-feat-title">Custom Category Overrides</div>
                  <div className="gate-feat-desc">Manually recategorize bills for accurate tracking</div>
                </div>
              </div>
              <div className="gate-feat">
                <span className="gate-feat-ic">🎯</span>
                <div className="gate-feat-content">
                  <div className="gate-feat-title">Projected Annual Spend</div>
                  <div className="gate-feat-desc">Know your yearly bill total broken down by month, week, and day</div>
                </div>
              </div>
            </div>
            <div className="gate-cta">
              <button className="gate-btn" onClick={()=>window.location.href='/settings?tab=plan'}>Upgrade to Plus →</button>
              <div className="gate-price">Starting at <strong>$5/month</strong></div>
            </div>
          </div>
          
          <div className="gate-right">
            <div className="gate-preview">
              <div className="gate-preview-badge">Preview</div>
              <div className="gate-preview-title">📊 Your Analytics Dashboard</div>
              
              {/* Blurred Donut Preview */}
              <div className="preview-chart">
                <div className="preview-donut"/>
                <div className="preview-legend">
                  <span style={{'--c':'#2177d1'} as React.CSSProperties}>Housing</span>
                  <span style={{'--c':'#7c3aed'} as React.CSSProperties}>Telecom</span>
                  <span style={{'--c':'#f59e0b'} as React.CSSProperties}>Utils</span>
                </div>
                <div className="gate-lock-overlay"><div className="gate-lock">🔒</div></div>
              </div>
              
              {/* Blurred Bars Preview */}
              <div className="preview-chart">
                <div className="preview-bars">
                  <div className="preview-bar" style={{'--w':'85%'} as React.CSSProperties}/>
                  <div className="preview-bar" style={{'--w':'65%'} as React.CSSProperties}/>
                  <div className="preview-bar" style={{'--w':'45%'} as React.CSSProperties}/>
                  <div className="preview-bar" style={{'--w':'30%'} as React.CSSProperties}/>
                </div>
                <div className="gate-lock-overlay"><div className="gate-lock">🔒</div></div>
              </div>
              
              <div style={{textAlign:'center',fontSize:'.78rem',color:'var(--muted)',marginTop:8}}>
                Upgrade to unlock full analytics
              </div>
            </div>
          </div>
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
      .page-header{margin-bottom:24px;opacity:0;animation:fu .5s ease .1s forwards;}
      .page-eyebrow{font-size:.62rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);margin-bottom:8px;}
      .page-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:2rem;letter-spacing:-.04em;color:var(--text);margin-bottom:6px;}
      .page-sub{font-size:.88rem;color:var(--text2);line-height:1.7;}
      
      /* ═══ ANALYTICS HERO ═══ */
      .analytics-hero{display:grid;grid-template-columns:1fr auto;gap:20px;margin-bottom:24px;opacity:0;animation:fu .5s ease .15s forwards;}
      .hero-main{background:linear-gradient(135deg,#2177d1 0%,#6366f1 50%,#8b5cf6 100%);border-radius:24px;padding:32px 36px;color:white;position:relative;overflow:hidden;}
      .hero-main::before{content:'';position:absolute;top:-50%;right:-20%;width:300px;height:300px;background:radial-gradient(circle,rgba(255,255,255,.15) 0%,transparent 70%);pointer-events:none;}
      .hero-main::after{content:'';position:absolute;bottom:-30%;left:-10%;width:200px;height:200px;background:radial-gradient(circle,rgba(255,255,255,.1) 0%,transparent 70%);pointer-events:none;}
      .hero-annual-label{font-size:.72rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;opacity:.85;margin-bottom:8px;}
      .hero-annual-value{font-family:'Plus Jakarta Sans',sans-serif;font-size:3.2rem;font-weight:800;letter-spacing:-.04em;line-height:1;margin-bottom:8px;}
      .hero-annual-sub{font-size:.82rem;opacity:.8;margin-bottom:20px;}
      .hero-annual-breakdown{display:flex;gap:0;background:rgba(255,255,255,.12);border-radius:14px;padding:14px 0;backdrop-filter:blur(10px);}
      .hero-breakdown-item{flex:1;text-align:center;padding:0 16px;}
      .hero-breakdown-label{display:block;font-size:.68rem;opacity:.7;margin-bottom:4px;}
      .hero-breakdown-value{display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:1.1rem;font-weight:700;}
      .hero-breakdown-divider{width:1px;background:rgba(255,255,255,.2);}
      
      .hero-stats{display:flex;flex-direction:column;gap:12px;}
      .hero-stat-card{background:var(--glass);backdrop-filter:blur(20px) saturate(2);border:1px solid var(--gb);border-radius:16px;padding:18px 22px;box-shadow:var(--gs);display:flex;align-items:center;gap:14px;transition:transform .2s;}
      .hero-stat-card:hover{transform:translateX(-4px);}
      .hero-stat-icon{font-size:1.4rem;}
      .hero-stat-value{font-family:'Plus Jakarta Sans',sans-serif;font-size:1.4rem;font-weight:800;color:var(--text);}
      .hero-stat-label{font-size:.72rem;color:var(--muted);margin-left:auto;}
      
      /* Hero Savings Tip */
      .hero-savings-tip{display:flex;align-items:center;gap:14px;margin-top:20px;padding:14px 18px;background:rgba(255,255,255,.15);border-radius:12px;backdrop-filter:blur(10px);}
      .hero-savings-icon{font-size:1.3rem;}
      .hero-savings-content{display:flex;flex-direction:column;gap:2px;}
      .hero-savings-amount{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.92rem;}
      .hero-savings-text{font-size:.72rem;opacity:.85;line-height:1.5;}
      
      /* ═══ AI INSIGHTS ═══ */
      .ai-insights-section{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:22px;box-shadow:var(--gs);padding:24px;margin-bottom:24px;opacity:0;animation:fu .5s ease .2s forwards;}
      .ai-insights-header{display:flex;align-items:center;gap:14px;margin-bottom:18px;}
      .ai-insights-avatar{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#2177d1,#6366f1);display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:white;}
      .ai-insights-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1rem;color:var(--text);}
      .ai-insights-sub{font-size:.72rem;color:var(--muted);}
      .ai-insights-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
      .ai-insight-card{display:flex;gap:14px;padding:16px 18px;border-radius:16px;border:1px solid var(--border);background:white;transition:all .2s;}
      .ai-insight-card:hover{border-color:rgba(33,119,209,.2);box-shadow:0 4px 12px rgba(33,119,209,.06);}
      .ai-insight-card.warning{border-color:rgba(245,158,11,.25);background:rgba(245,158,11,.03);}
      .ai-insight-card.tip{border-color:rgba(33,119,209,.2);background:rgba(33,119,209,.03);}
      .ai-insight-card.success{border-color:rgba(34,197,94,.25);background:rgba(34,197,94,.03);}
      .ai-insight-card.info{border-color:rgba(99,102,241,.2);background:rgba(99,102,241,.03);}
      .ai-insight-icon{font-size:1.4rem;flex-shrink:0;}
      .ai-insight-content{flex:1;min-width:0;}
      .ai-insight-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.84rem;color:var(--text);margin-bottom:4px;}
      .ai-insight-detail{font-size:.75rem;color:var(--text2);line-height:1.6;}
      
      /* ═══ SHARED SECTION STYLES ═══ */
      .section-header{display:flex;align-items:center;gap:14px;margin-bottom:20px;}
      .section-icon{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,var(--gold),#d4a84b);display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:white;}
      .section-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1rem;color:var(--text);}
      .section-sub{font-size:.72rem;color:var(--muted);}
      .section-link{margin-left:auto;font-size:.78rem;font-weight:600;color:var(--blue);text-decoration:none;transition:opacity .2s;}
      .section-link:hover{opacity:.7;}
      .potential-total{margin-left:auto;font-size:.78rem;color:var(--muted);}
      .potential-total strong{color:var(--success);font-weight:700;}
      
      /* ═══ SAVINGS SECTION ═══ */
      .savings-section{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:22px;box-shadow:var(--gs);padding:24px;margin-bottom:24px;opacity:0;animation:fu .5s ease .22s forwards;}
      .savings-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
      .savings-card{background:white;border:1.5px solid var(--border);border-radius:16px;padding:18px;transition:all .2s;}
      .savings-card:hover{border-color:var(--success);box-shadow:0 4px 12px rgba(34,197,94,.08);}
      .savings-card-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px;}
      .savings-card-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.85rem;color:var(--text);line-height:1.3;}
      .savings-difficulty{font-size:.62rem;font-weight:700;padding:3px 8px;border-radius:6px;flex-shrink:0;}
      .savings-difficulty.easy{background:rgba(34,197,94,.1);color:#16a34a;}
      .savings-difficulty.medium{background:rgba(245,158,11,.1);color:#d97706;}
      .savings-difficulty.hard{background:rgba(239,68,68,.1);color:#dc2626;}
      .savings-card-desc{font-size:.75rem;color:var(--text2);line-height:1.55;margin-bottom:14px;}
      .savings-card-amount{display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--border);}
      .savings-card-amount span{font-size:.72rem;color:var(--muted);}
      .savings-card-amount strong{font-family:'Plus Jakarta Sans',sans-serif;font-size:1rem;font-weight:800;color:var(--success);}
      
      /* ═══ LITERACY SECTION ═══ */
      .literacy-section{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:22px;box-shadow:var(--gs);padding:24px;margin-bottom:24px;opacity:0;animation:fu .5s ease .25s forwards;}
      .literacy-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
      .literacy-card{background:white;border:1.5px solid var(--border);border-radius:16px;padding:20px;transition:all .2s;}
      .literacy-card:hover{border-color:rgba(33,119,209,.25);transform:translateY(-2px);box-shadow:0 6px 16px rgba(33,119,209,.06);}
      .literacy-card-top{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
      .literacy-icon{font-size:1.4rem;}
      .literacy-category{font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--blue);background:var(--blue-pale);padding:4px 10px;border-radius:6px;}
      .literacy-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;color:var(--text);margin-bottom:8px;}
      .literacy-content{font-size:.78rem;color:var(--text2);line-height:1.65;margin-bottom:14px;}
      .literacy-action{display:flex;align-items:flex-start;gap:8px;padding:12px 14px;background:rgba(195,154,53,.06);border-radius:10px;border:1px solid rgba(195,154,53,.12);}
      .literacy-action span:first-child{flex-shrink:0;}
      .literacy-action span:last-child{font-size:.75rem;color:var(--text2);line-height:1.5;}
      
      /* CHARTS GRID */
      .charts-grid{display:grid;grid-template-columns:1fr 360px;gap:20px;opacity:0;animation:fu .5s ease .28s forwards;}
      .panel{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:22px;box-shadow:var(--gs);overflow:hidden;}
      .p-hd{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--border);}
      .p-t{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;color:var(--text);}
      .p-s{font-size:.72rem;color:var(--muted);margin-top:1px;}
      .p-body{padding:20px 24px;}
      /* TIME TOGGLE */
      .time-toggle{display:flex;gap:4px;background:var(--bg);padding:4px;border-radius:10px;}
      .time-btn{background:transparent;border:none;padding:6px 12px;border-radius:8px;font-size:.72rem;font-weight:600;color:var(--muted);cursor:pointer;transition:all .2s;}
      .time-btn:hover{color:var(--text2);}
      .time-btn.active{background:white;color:var(--blue);box-shadow:0 1px 3px rgba(0,0,0,.08);}
      /* LINE CHART */
      .line-wrap{padding:20px 24px;overflow-x:auto;}
      .line-stats{display:flex;justify-content:space-around;padding:16px 0 8px;border-top:1px solid var(--border);margin-top:16px;}
      .line-stat{display:flex;flex-direction:column;align-items:center;gap:2px;}
      .line-stat-label{font-size:.68rem;color:var(--muted);}
      .line-stat-value{font-family:'Plus Jakarta Sans',sans-serif;font-size:.88rem;font-weight:700;color:var(--text);}
      .line-stat-value.trend-up{color:var(--danger);}
      .line-stat-value.trend-down{color:var(--success);}
      .line-tooltip{position:absolute;background:white;border:1px solid var(--gb);border-radius:10px;padding:8px 12px;font-size:.72rem;font-weight:600;color:var(--text);box-shadow:var(--gs);pointer-events:none;transform:translate(-50%,-110%);white-space:nowrap;}
      /* DONUT */
      .donut-wrap{display:flex;flex-direction:column;align-items:center;padding:20px 24px;}
      .donut-container{position:relative;}
      .donut-legend{width:100%;margin-top:20px;display:flex;flex-direction:column;gap:6px;}
      .legend-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;transition:all .2s;cursor:pointer;border:1.5px solid transparent;}
      .legend-item:hover,.legend-item.active{background:rgba(33,119,209,.04);border-color:var(--border);}
      .legend-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
      .legend-name{font-size:.78rem;font-weight:600;color:var(--text);flex:1;}
      .legend-pct{font-size:.68rem;color:var(--muted);}
      .legend-amt{font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:700;color:var(--text);}
      .legend-edit{font-size:.62rem;color:var(--blue);background:none;border:none;cursor:pointer;padding:2px 6px;border-radius:6px;opacity:0;transition:opacity .2s;}
      .legend-item:hover .legend-edit{opacity:1;}
      /* CAT OVERRIDE */
      .cat-select{background:white;border:1.5px solid var(--blue);border-radius:8px;padding:4px 8px;font-size:.72rem;color:var(--text);outline:none;cursor:pointer;}
      
      /* ═══ CATEGORY MANAGEMENT ═══ */
      .cat-manage-body{padding:16px 20px;}
      .cat-bill-list{display:flex;flex-direction:column;gap:8px;}
      .cat-bill-item{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg);border-radius:12px;border:1.5px solid transparent;transition:all .2s;}
      .cat-bill-item:hover{border-color:var(--border);}
      .cat-bill-item.overridden{background:rgba(33,119,209,.04);border-color:rgba(33,119,209,.15);}
      .cat-bill-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;}
      .cat-bill-info{flex:1;min-width:0;}
      .cat-bill-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:.84rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .cat-bill-amount{font-size:.72rem;color:var(--muted);margin-top:2px;}
      .cat-bill-select{background:white;border:1.5px solid var(--border);border-radius:10px;padding:8px 12px;font-size:.78rem;color:var(--text);outline:none;cursor:pointer;transition:border-color .2s;min-width:140px;}
      .cat-bill-select:hover,.cat-bill-select:focus{border-color:var(--blue);}
      .cat-reset-btn{width:32px;height:32px;border-radius:8px;border:none;background:rgba(239,68,68,.08);color:var(--danger);font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;}
      .cat-reset-btn:hover{background:rgba(239,68,68,.15);}
      .cat-reset-all{display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding-top:14px;border-top:1px solid var(--border);}
      .cat-reset-all span{font-size:.75rem;color:var(--muted);}
      .cat-reset-all button{background:transparent;border:1px solid var(--border);color:var(--text2);padding:8px 14px;border-radius:8px;font-size:.75rem;font-weight:600;cursor:pointer;transition:all .2s;}
      .cat-reset-all button:hover{border-color:var(--danger);color:var(--danger);}
      
      /* BILL BREAKDOWN */
      .bb-list{padding:12px 20px;}
      .bb-item{display:flex;align-items:center;gap:12px;padding:10px 8px;border-radius:12px;margin-bottom:4px;transition:background .2s;}
      .bb-item:hover{background:rgba(33,119,209,.04);}
      .bb-rank{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.8rem;color:var(--muted);width:20px;text-align:center;flex-shrink:0;}
      .bb-name{font-size:.84rem;font-weight:600;color:var(--text);flex:1;}
      .bb-bar-wrap{width:80px;height:6px;background:var(--border);border-radius:3px;overflow:hidden;}
      .bb-bar{height:100%;border-radius:3px;transition:width .8s ease;}
      .bb-amt{font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:700;color:var(--text);text-align:right;min-width:52px;}
      @media(max-width:1100px){.charts-grid{grid-template-columns:1fr;}.analytics-hero{grid-template-columns:1fr;}.hero-stats{flex-direction:row;flex-wrap:wrap;}.hero-stat-card{flex:1;min-width:140px;}.ai-insights-grid{grid-template-columns:1fr;}.savings-grid{grid-template-columns:repeat(2,1fr);}.literacy-grid{grid-template-columns:1fr;}}
      @media(max-width:700px){.savings-grid{grid-template-columns:1fr;}.section-header{flex-wrap:wrap;}.potential-total,.section-link{width:100%;margin-left:0;margin-top:8px;}}
      @media(max-width:700px){.sb{display:none;}.main{margin-left:0;padding:16px;}.cat-bill-item{flex-wrap:wrap;}.cat-bill-select{width:100%;margin-top:8px;}}

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
      <a href="/dashboard" className="sb-logo" style={{textDecoration:"none"}}><span className="sb-logo-txt">Nyra</span><span className="sb-gem"/></a>
      <div className="nav-lbl">Menu</div>
      <a className="ni" href="/dashboard"><span className="ni-ic">📋</span>My Bills</a>
      <a className="ni" href="/reminders"><span className="ni-ic">🔔</span>Reminders</a>
      <a className="ni" href="/learn"><span className="ni-ic">🧠</span>Learn</a>
      <a className="ni" href="/achievements"><span className="ni-ic">🏆</span>Achievements</a>
      <a className="ni on" href="/analytics"><span className="ni-ic">📊</span>Analytics</a>
      <a className="ni" href="/settings"><span className="ni-ic">⚙️</span>Settings</a>
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

      {/* Hero Stats Row */}
      <div className="analytics-hero">
        <div className="hero-main">
          <div className="hero-annual">
            <div className="hero-annual-label">Projected Annual Spend</div>
            <div className="hero-annual-value">${projectedAnnual.toLocaleString()}</div>
            <div className="hero-annual-sub">Based on {bills.length} tracked bills</div>
            <div className="hero-annual-breakdown">
              <div className="hero-breakdown-item">
                <span className="hero-breakdown-label">Monthly</span>
                <span className="hero-breakdown-value">${totalMonthly.toLocaleString()}</span>
              </div>
              <div className="hero-breakdown-divider"/>
              <div className="hero-breakdown-item">
                <span className="hero-breakdown-label">Weekly</span>
                <span className="hero-breakdown-value">${Math.round(totalMonthly/4.33).toLocaleString()}</span>
              </div>
              <div className="hero-breakdown-divider"/>
              <div className="hero-breakdown-item">
                <span className="hero-breakdown-label">Daily</span>
                <span className="hero-breakdown-value">${Math.round(totalMonthly/30).toLocaleString()}</span>
              </div>
            </div>
          </div>
          {/* Late fee savings callout */}
          <div className="hero-savings-tip">
            <div className="hero-savings-icon">💡</div>
            <div className="hero-savings-content">
              <span className="hero-savings-amount">Save ~${Math.round(bills.length * 29).toLocaleString()}/year</span>
              <span className="hero-savings-text">Setting 7-day reminders on all bills helps avoid late fees (avg $25-35 per missed payment)</span>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="hero-stats">
          <div className="hero-stat-card">
            <div className="hero-stat-icon">📋</div>
            <div className="hero-stat-value">{bills.length}</div>
            <div className="hero-stat-label">Bills Tracked</div>
          </div>
          <div className="hero-stat-card">
            <div className="hero-stat-icon">📊</div>
            <div className="hero-stat-value">${avgPerBill.toFixed(0)}</div>
            <div className="hero-stat-label">Avg per Bill</div>
          </div>
          <div className="hero-stat-card">
            <div className="hero-stat-icon">🏷️</div>
            <div className="hero-stat-value">{catEntries.length}</div>
            <div className="hero-stat-label">Categories</div>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      {aiInsights.length>0&&(
        <div className="ai-insights-section">
          <div className="ai-insights-header">
            <div className="ai-insights-avatar">✦</div>
            <div>
              <div className="ai-insights-title">Nyra's Analysis</div>
              <div className="ai-insights-sub">AI-powered insights based on your spending patterns</div>
            </div>
          </div>
          <div className="ai-insights-grid">
            {aiInsights.map((insight,i)=>(
              <div key={i} className={`ai-insight-card ${insight.type}`}>
                <div className="ai-insight-icon">{insight.icon}</div>
                <div className="ai-insight-content">
                  <div className="ai-insight-title">{insight.title}</div>
                  <div className="ai-insight-detail">{insight.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Savings Opportunities */}
      {savingsOpportunities.length>0&&(
        <div className="savings-section">
          <div className="section-header">
            <div className="section-icon">💰</div>
            <div>
              <div className="section-title">Smart Savings Opportunities</div>
              <div className="section-sub">AI-detected ways to reduce your bills</div>
            </div>
            <div className="potential-total">
              Potential: <strong>${savingsOpportunities.reduce((s,o)=>s+parseInt(o.potentialSavings.replace(/[^0-9]/g,'')),0).toLocaleString()}/mo</strong>
            </div>
          </div>
          <div className="savings-grid">
            {savingsOpportunities.map((opp,i)=>(
              <div key={i} className="savings-card">
                <div className="savings-card-header">
                  <div className="savings-card-title">{opp.title}</div>
                  <div className={`savings-difficulty ${opp.difficulty.toLowerCase()}`}>{opp.difficulty}</div>
                </div>
                <div className="savings-card-desc">{opp.description}</div>
                <div className="savings-card-amount">
                  <span>Potential savings</span>
                  <strong>{opp.potentialSavings}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Literacy Section */}
      <div className="literacy-section">
        <div className="section-header">
          <div className="section-icon">🎓</div>
          <div>
            <div className="section-title">Financial Literacy Corner</div>
            <div className="section-sub">Personalized tips based on your spending profile</div>
          </div>
          <a href="/learn" className="section-link">View all lessons →</a>
        </div>
        <div className="literacy-grid">
          {finLiteracyTips.slice(0,4).map((tip,i)=>(
            <div key={i} className="literacy-card">
              <div className="literacy-card-top">
                <div className="literacy-icon">{tip.icon}</div>
                <div className="literacy-category">{tip.category}</div>
              </div>
              <div className="literacy-title">{tip.title}</div>
              <div className="literacy-content">{tip.content}</div>
              <div className="literacy-action">
                <span>💡</span>
                <span>{tip.actionable}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="charts-grid">
        <div style={{display:'flex',flexDirection:'column',gap:20}}>

          {/* LINE CHART */}
          <div className="panel">
            <div className="p-hd">
              <div><div className="p-t">📈 Monthly Spending Trend</div><div className="p-s">See how your bills change over time</div></div>
              <div className="time-toggle">
                <button className={`time-btn ${timeRange==='6m'?'active':''}`} onClick={()=>setTimeRange('6m')}>6 months</button>
                <button className={`time-btn ${timeRange==='12m'?'active':''}`} onClick={()=>setTimeRange('12m')}>12 months</button>
              </div>
            </div>
            <div className="line-wrap">
              <svg width="100%" viewBox={`0 0 ${lineW} ${lineH+30}`} style={{overflow:'visible'}} onMouseLeave={()=>setHoveredPoint(null)}>
                {/* Y-axis labels */}
                {[0,.5,1].map(f=>{
                  const val=Math.round(minLine*0.9+f*(maxLine-minLine*0.9));
                  const y=lineH-linePad-f*(lineH-linePad*2-10);
                  return(
                    <g key={f}>
                      <line x1={linePad-5} y1={y} x2={lineW-linePad+5} y2={y} stroke="rgba(33,119,209,.06)" strokeWidth="1" strokeDasharray={f===0?"none":"4,4"}/>
                      <text x={linePad-10} y={y+4} textAnchor="end" fontSize="9" fill="#7a90aa" fontFamily="Inter">${val>=1000?(val/1000).toFixed(1)+'k':val}</text>
                    </g>
                  );
                })}
                {/* Area gradient */}
                <path d={`${smoothPath} L${points[points.length-1].x},${lineH-linePad} L${points[0].x},${lineH-linePad} Z`} fill="url(#lineGrad)" opacity=".5"/>
                {/* Smooth line */}
                <path d={smoothPath} fill="none" stroke="url(#lineStroke)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Hover vertical line */}
                {hoveredPoint!==null&&(
                  <line x1={points[hoveredPoint].x} y1={linePad-10} x2={points[hoveredPoint].x} y2={lineH-linePad} stroke="var(--blue)" strokeWidth="1" strokeDasharray="4,4" opacity=".5"/>
                )}
                {/* Points */}
                {points.map((p,i)=>(
                  <g key={i} style={{cursor:'pointer'}} onMouseEnter={()=>setHoveredPoint(i)} onClick={()=>setHoveredPoint(i)}>
                    {/* Larger invisible hit area */}
                    <circle cx={p.x} cy={p.y} r="15" fill="transparent"/>
                    {/* Visible point */}
                    <circle cx={p.x} cy={p.y} r={hoveredPoint===i?7:5} fill="white" stroke={p.isProjected?"var(--muted)":"var(--blue)"} strokeWidth="2.5" style={{transition:'r .15s ease'}}/>
                    {p.isProjected&&<circle cx={p.x} cy={p.y} r={hoveredPoint===i?4:2} fill="var(--muted)"/>}
                    {/* Month label */}
                    <text x={p.x} y={lineH+12} textAnchor="middle" fontSize="10" fill={hoveredPoint===i?"var(--blue)":"#7a90aa"} fontWeight={hoveredPoint===i?"600":"400"} fontFamily="Inter">{p.month}</text>
                  </g>
                ))}
                {/* Tooltip */}
                {hoveredPoint!==null&&(
                  <g transform={`translate(${points[hoveredPoint].x},${points[hoveredPoint].y-20})`}>
                    <rect x="-40" y="-28" width="80" height="24" rx="8" fill="white" stroke="var(--border)" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,.1))"/>
                    <text x="0" y="-12" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text)" fontFamily="'Plus Jakarta Sans'">${points[hoveredPoint].amount.toLocaleString()}</text>
                  </g>
                )}
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2177d1" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#2177d1" stopOpacity="0.02"/>
                  </linearGradient>
                  <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2177d1"/>
                    <stop offset="100%" stopColor="#6366f1"/>
                  </linearGradient>
                </defs>
              </svg>
              <div className="line-stats">
                <div className="line-stat">
                  <span className="line-stat-label">Average</span>
                  <span className="line-stat-value">${Math.round(lineData.reduce((s,d)=>s+d.amount,0)/lineData.length).toLocaleString()}</span>
                </div>
                <div className="line-stat">
                  <span className="line-stat-label">Highest</span>
                  <span className="line-stat-value">${maxLine.toLocaleString()}</span>
                </div>
                <div className="line-stat">
                  <span className="line-stat-label">Lowest</span>
                  <span className="line-stat-value">${minLine.toLocaleString()}</span>
                </div>
                <div className="line-stat">
                  <span className="line-stat-label">Trend</span>
                  {(()=>{
                    const change = ((lineData[lineData.length-1].amount/lineData[0].amount-1)*100);
                    const isUp = change > 0;
                    return(
                      <span className={`line-stat-value ${isUp?'trend-up':'trend-down'}`}>
                        {isUp?'↑':'↓'} {Math.abs(change).toFixed(0)}%
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* BILL BREAKDOWN RANKED */}
          <div className="panel">
            <div className="p-hd"><div><div className="p-t">🏆 Biggest Bills</div><div className="p-s">Ranked by monthly amount</div></div></div>
            <div className="bb-list">
              {bills.length===0?(
                <div style={{padding:'28px',textAlign:'center',fontSize:'.82rem',color:'var(--muted)'}}>No bills yet — add some to see your breakdown</div>
              ):[...bills].sort((a,b)=>b.amount-a.amount).slice(0,5).map((bill,i)=>(
                <div key={bill.id} className="bb-item">
                  <div className="bb-rank" style={{color:i===0?'var(--gold)':i===1?'#94a3b8':i===2?'#cd7f32':'var(--muted)'}}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</div>
                  <div style={{width:32,height:32,borderRadius:9,background:CAT_MAP[getBillCat(bill)]?.color+'18'||'var(--blue-pale)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.9rem',flexShrink:0}}>
                    {CAT_MAP[getBillCat(bill)]?.emoji||'📋'}
                  </div>
                  <div className="bb-name">{bill.name}</div>
                  <div className="bb-bar-wrap"><div className="bb-bar" style={{width:`${(bill.amount/(bills[0]?.amount||1))*100}%`,background:CAT_MAP[getBillCat(bill)]?.color||'var(--blue)'}}/></div>
                  <div className="bb-amt">${bill.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col — donut */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="panel">
            <div className="p-hd"><div><div className="p-t">🍩 Spending by Category</div><div className="p-s">Hover to see details</div></div></div>
            <div className="donut-wrap">
              {bills.length===0?(
                <div style={{padding:'28px',textAlign:'center',fontSize:'.82rem',color:'var(--muted)'}}>Add bills to see your breakdown</div>
              ):(
                <>
                  {/* Donut SVG */}
                  <div className="donut-container" onMouseLeave={()=>setHoveredSlice(null)}>
                    <svg width="180" height="180" viewBox="0 0 180 180">
                      {/* Background ring */}
                      <circle cx="90" cy="90" r={donutR+5} fill="none" stroke="var(--border)" strokeWidth="20" opacity=".3"/>
                      {/* Slices */}
                      {donutSlices.map((s,i)=>(
                        <circle key={i} cx="90" cy="90" r={donutR+5} fill="none" 
                          stroke={s.color}
                          strokeWidth={hoveredSlice===s.cat?24:20}
                          strokeDasharray={`${s.dash*1.1} ${donutC*1.1-s.dash*1.1}`}
                          strokeDashoffset={-s.offset*1.1}
                          transform="rotate(-90 90 90)"
                          style={{transition:'stroke-width .2s ease, opacity .2s ease',cursor:'pointer',opacity:hoveredSlice&&hoveredSlice!==s.cat?0.4:1}}
                          onMouseEnter={()=>setHoveredSlice(s.cat)}/>
                      ))}
                      {/* Center content */}
                      <circle cx="90" cy="90" r="48" fill="white"/>
                      {hoveredSlice?(
                        <>
                          <text x="90" y="82" textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="Inter">{CAT_MAP[hoveredSlice]?.label}</text>
                          <text x="90" y="100" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--text)" fontFamily="'Plus Jakarta Sans'">${donutSlices.find(s=>s.cat===hoveredSlice)?.amt.toLocaleString()}</text>
                        </>
                      ):(
                        <>
                          <text x="90" y="85" textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--text)" fontFamily="'Plus Jakarta Sans'">${totalMonthly.toLocaleString()}</text>
                          <text x="90" y="102" textAnchor="middle" fontSize="10" fill="var(--muted)" fontFamily="Inter">per month</text>
                        </>
                      )}
                    </svg>
                  </div>
                  {/* Legend */}
                  <div className="donut-legend">
                    {donutSlices.map(s=>{
                      const catInfo=CAT_MAP[s.cat]||{label:s.cat,emoji:'📋',color:'#7a90aa'};
                      const catBills=bills.filter(b=>getBillCat(b)===s.cat);
                      return(
                        <div key={s.cat} 
                          className={`legend-item ${hoveredSlice===s.cat?'active':''}`}
                          onMouseEnter={()=>setHoveredSlice(s.cat)}
                          onMouseLeave={()=>setHoveredSlice(null)}>
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
                </>
              )}
            </div>
          </div>

          {/* Bill Categories Management Panel */}
          <div className="panel">
            <div className="p-hd">
              <div>
                <div className="p-t">🏷️ Manage Bill Categories</div>
                <div className="p-s">Override auto-detected categories</div>
              </div>
            </div>
            <div className="cat-manage-body">
              {bills.length===0?(
                <div style={{padding:'24px',textAlign:'center',fontSize:'.82rem',color:'var(--muted)'}}>Add bills to manage categories</div>
              ):(
                <div className="cat-bill-list">
                  {bills.map(bill=>{
                    const currentCat=getBillCat(bill);
                    const catInfo=CAT_MAP[currentCat]||{label:'Other',emoji:'📋',color:'#7a90aa'};
                    const isOverridden=!!catOverrides[bill.id];
                    return(
                      <div key={bill.id} className={`cat-bill-item ${isOverridden?'overridden':''}`}>
                        <div className="cat-bill-icon" style={{background:`${catInfo.color}15`,color:catInfo.color}}>
                          {catInfo.emoji}
                        </div>
                        <div className="cat-bill-info">
                          <div className="cat-bill-name">{bill.name}</div>
                          <div className="cat-bill-amount">${bill.amount}/mo</div>
                        </div>
                        <select 
                          className="cat-bill-select" 
                          value={currentCat} 
                          onChange={e=>overrideCat(bill.id,e.target.value)}
                        >
                          {Object.entries(CAT_MAP).map(([key,{label,emoji}])=>(
                            <option key={key} value={key}>{emoji} {label}</option>
                          ))}
                        </select>
                        {isOverridden&&(
                          <button 
                            className="cat-reset-btn" 
                            onClick={()=>{
                              const updated={...catOverrides};
                              delete updated[bill.id];
                              setCatOverrides(updated);
                              localStorage.setItem('nyra_cat_overrides',JSON.stringify(updated));
                            }}
                            title="Reset to auto-detected"
                          >
                            ↺
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {Object.keys(catOverrides).length>0&&(
                <div className="cat-reset-all">
                  <span>{Object.keys(catOverrides).length} manual override{Object.keys(catOverrides).length!==1?'s':''}</span>
                  <button onClick={()=>{setCatOverrides({});localStorage.removeItem('nyra_cat_overrides');}}>
                    Reset all to auto-detect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  </>);
}
