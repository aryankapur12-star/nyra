'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Bill { id:string;name:string;amount:number;due_date:string;recurring:string;remind_days_before:number;end_of_month?:boolean; }
interface ReminderLog { id:string;bill_name:string;amount:number;sent_at:string; }
interface UserStats { billCount:number;reminderCount:number;streakMonths:number;totalTracked:number;monthsSubscribed:number;loggedInLate:boolean;loggedInEarly:boolean;addedBillWithinHour:boolean;upgraded:boolean; }
interface Badge { id:string;emoji:string;name:string;desc:string;tier:'Basic'|'Plus'|'Power';category:string;secret?:boolean;check:(s:UserStats)=>boolean; }

// ─── BADGE DEFINITIONS ────────────────────────────────────────────────────────
// Tier access:
//   Basic  → 4 earnable badges only (spark, coffee-run, first-step, heads-up) + greyed previews
//   Plus   → all non-secret badges + social sharing
//   Power  → everything including secret badges + social sharing
const ALL_BADGES: Badge[] = [
  // 🔥 Streak
  {id:'spark',         emoji:'✨',name:'Spark',            tier:'Basic', category:'Streak',   desc:'First month with zero late fees.',            check:s=>s.streakMonths>=1},
  {id:'on-fire',       emoji:'🔥',name:'On Fire',          tier:'Plus',  category:'Streak',   desc:'3-month streak — you\'re unstoppable.',       check:s=>s.streakMonths>=3},
  {id:'heatwave',      emoji:'🌊',name:'Heatwave',         tier:'Plus',  category:'Streak',   desc:'6 months strong, zero late fees.',            check:s=>s.streakMonths>=6},
  {id:'untouchable',   emoji:'💎',name:'Untouchable',      tier:'Plus',  category:'Streak',   desc:'12-month streak. Truly untouchable.',         check:s=>s.streakMonths>=12},
  {id:'legend',        emoji:'👑',name:'Legend',           tier:'Plus',  category:'Streak',   desc:'24 months. You are the bill boss.',           check:s=>s.streakMonths>=24},
  // 💰 Money Milestones
  {id:'coffee-run',    emoji:'☕',name:'Coffee Run',        tier:'Basic', category:'Milestone',desc:'Tracked $100 in bills. Small but mighty.',   check:s=>s.totalTracked>=100},
  {id:'grocery-haul',  emoji:'🛒',name:'Grocery Haul',     tier:'Plus',  category:'Milestone',desc:'Tracked $500 in bills.',                     check:s=>s.totalTracked>=500},
  {id:'car-payment',   emoji:'🚗',name:'Car Payment',      tier:'Plus',  category:'Milestone',desc:'Tracked $5,000 in bills.',                   check:s=>s.totalTracked>=5000},
  {id:'down-payment',  emoji:'🏠',name:'Down Payment',     tier:'Plus',  category:'Milestone',desc:'Tracked $50,000 in bills.',                  check:s=>s.totalTracked>=50000},
  {id:'bay-street',    emoji:'📈',name:'Bay Street',       tier:'Plus',  category:'Milestone',desc:'Tracked $100,000. Bay Street energy.',       check:s=>s.totalTracked>=100000},
  // 📋 Activity
  {id:'first-step',    emoji:'👣',name:'First Step',       tier:'Basic', category:'Activity', desc:'Added your very first bill.',                check:s=>s.billCount>=1},
  {id:'getting-serious',emoji:'📋',name:'Getting Serious', tier:'Plus',  category:'Activity', desc:'Added 5 bills. Now we\'re talking.',         check:s=>s.billCount>=5},
  {id:'bill-collector',emoji:'🗂️',name:'Bill Collector',  tier:'Plus',  category:'Activity', desc:'Added 10 bills. You\'ve got it all tracked.',check:s=>s.billCount>=10},
  {id:'whole-picture', emoji:'🔭',name:'The Whole Picture',tier:'Plus',  category:'Activity', desc:'Tracking bills in 5+ categories.',           check:s=>s.billCount>=5},
  // ⏰ Reminders
  {id:'heads-up',      emoji:'📬',name:'Heads Up',         tier:'Basic', category:'Reminders',desc:'Received your first reminder text.',         check:s=>s.reminderCount>=1},
  {id:'good-habits',   emoji:'📅',name:'Good Habits',      tier:'Plus',  category:'Reminders',desc:'10 reminders received. Habit forming.',      check:s=>s.reminderCount>=10},
  {id:'always-ready',  emoji:'⚡',name:'Always Ready',     tier:'Plus',  category:'Reminders',desc:'50 reminders received. Never surprised.',    check:s=>s.reminderCount>=50},
  {id:'never-surprised',emoji:'🛡️',name:'Never Surprised',tier:'Plus',  category:'Reminders',desc:'100 reminders. You\'re a Nyra pro.',         check:s=>s.reminderCount>=100},
  // 🍁 Canadian / Fun
  {id:'tims-regular',  emoji:'🍩',name:'Tim Hortons Regular',tier:'Plus',category:'Canadian', desc:'1 month subscribed. Welcome, fam.',          check:s=>s.monthsSubscribed>=1},
  {id:'coast-to-coast',emoji:'🌊',name:'Coast to Coast',   tier:'Plus',  category:'Canadian', desc:'6 months — you\'ve crossed Canada.',         check:s=>s.monthsSubscribed>=6},
  {id:'trans-canada',  emoji:'🛣️',name:'Trans-Canada',     tier:'Plus',  category:'Canadian', desc:'12 months on the road. Still rolling.',      check:s=>s.monthsSubscribed>=12},
  {id:'true-north',    emoji:'🍁',name:'True North',       tier:'Plus',  category:'Canadian', desc:'24 months — strong and free.',               check:s=>s.monthsSubscribed>=24},
  // 🌟 Secret — Power only
  {id:'night-owl',     emoji:'🦉',name:'Night Owl',        tier:'Power', category:'Secret',secret:true,desc:'Logged in after midnight.',          check:s=>s.loggedInLate},
  {id:'early-bird',    emoji:'🌅',name:'Early Bird',       tier:'Power', category:'Secret',secret:true,desc:'Logged in before 6am. Rise and grind.',check:s=>s.loggedInEarly},
  {id:'overachiever',  emoji:'🚀',name:'Overachiever',     tier:'Power', category:'Secret',secret:true,desc:'Added a bill within 1 hour of signup.',check:s=>s.addedBillWithinHour},
  {id:'squeaky-clean', emoji:'🧼',name:'Squeaky Clean',    tier:'Power', category:'Secret',secret:true,desc:'6 months, never a single overdue bill.',check:s=>s.streakMonths>=6},
  {id:'power-move',    emoji:'⚡',name:'Power Move',       tier:'Power', category:'Secret',secret:true,desc:'Upgraded your plan. Big boss energy.', check:s=>s.upgraded},
];

const EARNABLE_BY_PLAN: Record<string,string[]> = {
  Basic: ['spark','coffee-run','first-step','heads-up'],
  Plus:  ALL_BADGES.filter(b=>b.tier!=='Power').map(b=>b.id),
  Power: ALL_BADGES.map(b=>b.id),
};

const AI_MAP: Record<string,string> = {
  netflix:'✦ Netflix · Monthly · ~$18–23/mo',spotify:'✦ Spotify · Monthly · ~$11.99/mo',
  rogers:'✦ Rogers · Monthly · telecom',rent:'✦ Rent · Monthly · due 1st of month',
  hydro:'✦ Hydro · Monthly · utility',bell:'✦ Bell · Monthly · telecom',
  disney:'✦ Disney+ · Monthly · ~$14.99/mo',amazon:'✦ Amazon Prime · Monthly or Yearly',
  apple:'✦ Apple · Monthly · iCloud/Apple One',gym:'✦ Gym · Monthly · fitness membership',
  internet:'✦ Internet · Monthly · utility',
};

function daysUntil(d:string){const t=new Date();t.setHours(0,0,0,0);return Math.ceil((new Date(d+'T00:00:00').getTime()-t.getTime())/86400000);}
function fmtDate(d:string){return new Date(d+'T00:00:00').toLocaleDateString('en-CA',{month:'short',day:'numeric'});}
function dueChip(days:number){
  if(days<0)  return{label:'Overdue',     cls:'chip-urgent'};
  if(days===0)return{label:'Due today',   cls:'chip-urgent'};
  if(days<=5) return{label:`Due in ${days}d`,cls:'chip-soon'};
  return           {label:`Due in ${days}d`,cls:'chip-ok'};
}

const TUT=[
  {target:'tgt-greeting',title:'Welcome to your dashboard!',desc:'This is your Nyra home base — everything you need to stay on top of your bills.',arrow:'arr-bottom',pos:'below'},
  {target:'tgt-stats',title:'Your financial snapshot',desc:'Bills tracked, total due, late fees (always 0!), and reminders — all at a glance.',arrow:'arr-top',pos:'below'},
  {target:'tgt-badges',title:'🏆 Your badge collection',desc:'Earn badges as you hit milestones. Upgrade your plan to unlock the full collection and social sharing.',arrow:'arr-top',pos:'below'},
  {target:'tgt-bills',title:'Your bills live here',desc:'Every bill you add shows up here, colour-coded by urgency. Amber = due soon.',arrow:'arr-right',pos:'left'},
  {target:'tgt-addbtn',title:'Add your first bill',desc:'Click here to add a bill. Nyra\'s AI will suggest the cycle and amount automatically.',arrow:'arr-top',pos:'below'},
  {target:'tgt-upcoming',title:'Coming up',desc:'See all bills due in the next 30 days with their reminder dates.',arrow:'arr-left',pos:'right',isLast:true},
];

const CC=['#2177d1','#3a8ee0','#5ba3ec','#c39a35','#d4ae52','#e8c96a','#fff','#e0eeff'];
function mkP(x:number,y:number){
  const a=Math.random()*Math.PI*2,sp=Math.random()*13+5;
  return{x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:Math.random()*5+2,w:Math.random()*10+4,h:Math.random()*5+2,
    color:CC[Math.floor(Math.random()*CC.length)],shape:Math.random()>.5?'rect':'circle',
    rot:Math.random()*Math.PI*2,rs:(Math.random()-.5)*.18,g:.28+Math.random()*.14,
    drag:.97+Math.random()*.02,life:1,decay:.011+Math.random()*.008};
}

export default function DashboardPage(){
  const sp=useSearchParams();const urlName=sp.get('name')||'';
  const[userName,setUserName]=useState(urlName||'there');
  const[userEmail,setUserEmail]=useState('');
  const[userPlan,setUserPlan]=useState('Plus');
  const[planLimit,setPlanLimit]=useState(15);
  const[bills,setBills]=useState<Bill[]>([]);
  const[reminders,setReminders]=useState<ReminderLog[]>([]);
  const[loading,setLoading]=useState(true);
  const[stats,setStats]=useState<UserStats>({billCount:0,reminderCount:0,streakMonths:0,totalTracked:0,monthsSubscribed:0,loggedInLate:false,loggedInEarly:false,addedBillWithinHour:false,upgraded:false});
  const[modalOpen,setModalOpen]=useState(false);
  const[billName,setBillName]=useState('');
  const[billAmt,setBillAmt]=useState('');
  const[billDue,setBillDue]=useState('');
  const[billCycle,setBillCycle]=useState('Monthly');
  const[billRemind,setBillRemind]=useState('3');
  const[aiSugg,setAiSugg]=useState('');
  const[saving,setSaving]=useState(false);
  const aiTimer=useRef<NodeJS.Timeout|null>(null);
  const[badgePopup,setBadgePopup]=useState(false);
  const[earnedBadge,setEarnedBadge]=useState<Badge|null>(null);
  const[shareOpen,setShareOpen]=useState(false);
  const[shareBadge,setShareBadge]=useState<Badge|null>(null);
  const[copied,setCopied]=useState(false);
  const[tutOn,setTutOn]=useState(false);
  const[tutStep,setTutStep]=useState(0);
  const[spot,setSpot]=useState({l:0,t:0,w:0,h:0});
  const[card,setCard]=useState({l:0,t:0});
  // What if I miss this
  const[wimtOpen,setWimtOpen]=useState(false);
  const[wimtBill,setWimtBill]=useState<Bill|null>(null);
  const[wimtResult,setWimtResult]=useState('');
  const[wimtLoading,setWimtLoading]=useState(false);
  const rGreeting=useRef<HTMLDivElement>(null);
  const rStats=useRef<HTMLDivElement>(null);
  const rBadges=useRef<HTMLDivElement>(null);
  const rBills=useRef<HTMLDivElement>(null);
  const rAddBtn=useRef<HTMLButtonElement>(null);
  const rUpcoming=useRef<HTMLDivElement>(null);
  const rSms=useRef<HTMLDivElement>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const animRef=useRef<number>(0);
  const particles=useRef<ReturnType<typeof mkP>[]>([]);
  const REFS:Record<string,React.RefObject<any>>={'tgt-greeting':rGreeting,'tgt-stats':rStats,'tgt-badges':rBadges,'tgt-bills':rBills,'tgt-addbtn':rAddBtn,'tgt-upcoming':rUpcoming,'tgt-sms':rSms};

  useEffect(()=>{
    const hr=new Date().getHours();
    async function load(){
      const{data:{user}}=await supabase.auth.getUser();if(!user)return;
      const{data:prof}=await supabase.from('profiles').select('full_name,phone_number,plan,created_at').eq('id',user.id).single();
      if(prof){
        setUserName(prof.full_name?.split(' ')[0]||urlName||'there');
        setUserEmail(user.email||'');
        const plan=prof.plan||'Plus';setUserPlan(plan);
        setPlanLimit(plan==='Basic'?5:plan==='Power'?999:15);
        const created=new Date(prof.created_at);
        const monthsSub=Math.floor((Date.now()-created.getTime())/(1000*60*60*24*30));
        const{data:bd}=await supabase.from('bills').select('*').eq('user_id',user.id).order('due_date',{ascending:true});
        const{data:rd}=await supabase.from('reminder_logs').select('*').eq('user_id',user.id).order('sent_at',{ascending:false}).limit(10);
        setBills(bd||[]);setReminders(rd||[]);setLoading(false);
        const total=(bd||[]).reduce((s:number,b:Bill)=>s+b.amount,0);
        const ns:UserStats={billCount:(bd||[]).length,reminderCount:(rd||[]).length,streakMonths:monthsSub,totalTracked:total,monthsSubscribed:monthsSub,loggedInLate:hr>=0&&hr<4,loggedInEarly:hr>=4&&hr<6,addedBillWithinHour:(bd||[]).length>0&&(Date.now()-created.getTime())<3600000,upgraded:plan!=='Basic'};
        setStats(ns);
        const stored:string[]=JSON.parse(localStorage.getItem('nyra_badges')||'[]');
        const accessible=EARNABLE_BY_PLAN[plan]||EARNABLE_BY_PLAN.Basic;
        const newlyEarned=ALL_BADGES.filter(b=>accessible.includes(b.id)&&b.check(ns)&&!stored.includes(b.id));
        if(newlyEarned.length>0){
          localStorage.setItem('nyra_badges',JSON.stringify([...stored,...newlyEarned.map(b=>b.id)]));
          setTimeout(()=>{setEarnedBadge(newlyEarned[0]);setBadgePopup(true);setTimeout(launchConfetti,400);},1500);
        }
      }
    }
    load();
  },[]);

  function launchConfetti(){
    const cv=canvasRef.current;if(!cv)return;
    const ctx=cv.getContext('2d');if(!ctx)return;
    cv.width=window.innerWidth;cv.height=window.innerHeight;
    const cx=cv.width/2;
    for(let i=0;i<100;i++)particles.current.push(mkP(cx,cv.height*.4));
    setTimeout(()=>{for(let i=0;i<50;i++)particles.current.push(mkP(cv.width*.1,cv.height*.5));},150);
    setTimeout(()=>{for(let i=0;i<50;i++)particles.current.push(mkP(cv.width*.9,cv.height*.5));},300);
    function draw(){
      ctx.clearRect(0,0,cv.width,cv.height);
      particles.current=particles.current.filter(p=>p.life>0);
      particles.current.forEach(p=>{p.vx*=p.drag;p.vy*=p.drag;p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.rot+=p.rs;p.life-=p.decay;ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.translate(p.x,p.y);ctx.rotate(p.rot);if(p.shape==='circle'){ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();}else{ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);}ctx.restore();});
      if(particles.current.length>0)animRef.current=requestAnimationFrame(draw);
    }
    cancelAnimationFrame(animRef.current);draw();
  }

  function handleName(val:string){setBillName(val);if(aiTimer.current)clearTimeout(aiTimer.current);if(val.length<3){setAiSugg('');return;}setAiSugg('thinking');aiTimer.current=setTimeout(()=>{const k=Object.keys(AI_MAP).find(k=>val.toLowerCase().includes(k));setAiSugg(k?AI_MAP[k]:'✦ Tip: Set a reminder 3–5 days before your due date');},700);}

  async function saveBill(){
    if(!billName||!billAmt||!billDue)return;setSaving(true);
    const{data:{user}}=await supabase.auth.getUser();if(!user){setSaving(false);return;}
    const{data,error}=await supabase.from('bills').insert({user_id:user.id,name:billName,amount:parseFloat(billAmt),due_date:billDue,recurring:billCycle,remind_days_before:parseInt(billRemind)}).select().single();
    if(!error&&data)setBills(prev=>[...prev,data].sort((a,b)=>a.due_date.localeCompare(b.due_date)));
    setSaving(false);setModalOpen(false);setBillName('');setBillAmt('');setBillDue('');setBillCycle('Monthly');setBillRemind('3');setAiSugg('');
  }

  async function deleteBill(id:string){
    if(!confirm('Remove this bill?'))return;
    await supabase.from('bills').delete().eq('id',id);
    setBills(prev=>prev.filter(b=>b.id!==id));
  }

  const posTut=useCallback((i:number)=>{
    const s=TUT[i];const el=REFS[s.target]?.current;if(!el)return;
    const r=el.getBoundingClientRect();const p=10;
    setSpot({l:r.left-p,t:r.top-p,w:r.width+p*2,h:r.height+p*2});
    const cw=300,ch=180,mg=16;let l=0,t=0;
    if(s.pos==='below'){l=Math.max(mg,r.left);t=r.bottom+p+12;}
    else if(s.pos==='left'){l=r.left-cw-p-14;t=Math.max(mg,r.top+r.height/2-ch/2);}
    else if(s.pos==='right'){l=r.right+p+14;t=Math.max(mg,r.top+r.height/2-ch/2);}
    l=Math.max(mg,Math.min(l,window.innerWidth-cw-mg));t=Math.max(mg,Math.min(t,window.innerHeight-ch-mg));
    setCard({l,t});
  },[]);

  function startTut(){setTutOn(true);setTutStep(0);setTimeout(()=>posTut(0),50);}
  function nextTut(){if(tutStep>=TUT.length-1){setTutOn(false);setTimeout(launchConfetti,200);return;}const n=tutStep+1;setTutStep(n);setTimeout(()=>posTut(n),50);}
  function prevTut(){if(tutStep<=0)return;const p=tutStep-1;setTutStep(p);setTimeout(()=>posTut(p),50);}

  const storedEarned:string[]=typeof window!=='undefined'?JSON.parse(localStorage.getItem('nyra_badges')||'[]'):[];
  const accessible=EARNABLE_BY_PLAN[userPlan]||EARNABLE_BY_PLAN.Basic;
  const visibleBadges=ALL_BADGES.filter(b=>accessible.includes(b.id));
  const lockedPreviews=userPlan==='Basic'?ALL_BADGES.filter(b=>!accessible.includes(b.id)).slice(0,8):[];
  const isBadgeEarned=(b:Badge)=>storedEarned.includes(b.id)||b.check(stats);
  const earnedCount=visibleBadges.filter(isBadgeEarned).length;

  function shareText(b:Badge){return `I just earned the ${b.emoji} "${b.name}" badge on Nyra — ${b.desc} Never miss a bill again 💙 nyra-nu.vercel.app`;}
  function copyShare(b:Badge){navigator.clipboard.writeText(shareText(b));setCopied(true);setTimeout(()=>setCopied(false),2000);}

  const totalDue=bills.reduce((s,b)=>s+b.amount,0);
  const dueSoon=bills.filter(b=>{const d=daysUntil(b.due_date);return d>=0&&d<=5;}).length;
  const slots=planLimit===999?'∞':planLimit-bills.length;
  const hr2=new Date().getHours();
  const greet=hr2<12?'Good morning':hr2<17?'Good afternoon':'Good evening';
  const today=new Date().toLocaleDateString('en-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  function streakDesc(m:number){
    if(m===0)return'Pay your bills on time to start your streak!';
    if(m<3)return`${3-m} more month${3-m>1?'s':''} until the 🔥 On Fire badge!`;
    if(m<6)return`${6-m} more month${6-m>1?'s':''} until the 🌊 Heatwave badge!`;
    if(m<12)return`${12-m} more month${12-m>1?'s':''} until the 💎 Untouchable badge!`;
    return'You\'re a bill-paying legend. Keep the streak alive! 👑';
  }

  // ── Money IQ Score (0–100) ────────────────────────────────────────────────
  function calcMoneyIQ(s:UserStats, bs:Bill[]):number {
    let score = 0;
    // Streak — 40pts
    score += Math.min(40, s.streakMonths * 5);
    // Bills paid on time (no overdue) — 30pts
    const overdue = bs.filter(b=>daysUntil(b.due_date)<0).length;
    score += overdue === 0 ? 30 : Math.max(0, 30 - overdue * 10);
    // Bills tracked — 15pts
    score += s.billCount >= 10 ? 15 : s.billCount >= 5 ? 10 : s.billCount >= 1 ? 5 : 0;
    // Smart reminders (avg remind days) — 15pts
    if (bs.length > 0) {
      const avgRemind = bs.reduce((s,b)=>s+b.remind_days_before,0)/bs.length;
      score += avgRemind >= 7 ? 15 : avgRemind >= 5 ? 10 : avgRemind >= 3 ? 6 : 2;
    }
    return Math.min(100, Math.round(score));
  }
  function moneyIQLabel(n:number){
    if(n>=81)return{label:'Money IQ on 💯',color:'var(--success)'};
    if(n>=61)return{label:'Pretty solid 💪',color:'var(--blue)'};
    if(n>=41)return{label:'Getting there 📈',color:'var(--warn)'};
    return{label:'Needs work 😬',color:'var(--danger)'};
  }

  // ── What If I Miss This ───────────────────────────────────────────────────
  async function openWimt(bill:Bill){
    setWimtBill(bill); setWimtOpen(true); setWimtLoading(true); setWimtResult('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:1000,
          system:`You are Nyra's financial coach. You speak in a Gen Z casual tone — real, direct, emoji-friendly, no boring corporate speak. Use 🚩 for bad outcomes and 🟢 for good habits. Keep responses concise and punchy. Format as short paragraphs, no markdown headers.`,
          messages:[{role:'user',content:`My bill: ${bill.name}, $${bill.amount}, due in ${daysUntil(bill.due_date)} days, ${bill.recurring} billing. What actually happens if I miss this payment? Break down: the late fee estimate, NSF fee risk if my account is low, credit score impact, and the real total cost. End with a one-line Gen Z verdict. Keep it under 150 words.`}]
        })
      });
      const data = await res.json();
      const text = data.content?.map((c:any)=>c.text||'').join('') || 'Could not load analysis.';
      setWimtResult(text);
    } catch(e) {
      setWimtResult('Something went wrong loading the analysis. Try again!');
    }
    setWimtLoading(false);
  }

  return(<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');
      :root{--blue:#2177d1;--blue-d:#1658a8;--blue-m:#3a8ee0;--blue-l:#5ba3ec;--blue-pale:rgba(33,119,209,0.08);--blue-glow:rgba(33,119,209,0.18);--gold:#c39a35;--gold-l:#d4ae52;--gold-pale:rgba(195,154,53,0.09);--bg:#eef3fb;--text:#0c1524;--text2:#3a4f6a;--muted:#7a90aa;--border:rgba(33,119,209,0.1);--success:#22c55e;--warn:#f59e0b;--danger:#ef4444;--glass:rgba(255,255,255,0.62);--glass2:rgba(255,255,255,0.80);--gb:rgba(255,255,255,0.86);--gs:0 4px 24px rgba(33,119,209,.08),0 1px 4px rgba(0,0,0,.04),inset 0 1px 0 rgba(255,255,255,.9);--gsl:0 16px 60px rgba(33,119,209,.13),0 4px 16px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.9);}
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
      body{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;min-height:100vh;overflow-x:hidden;}
      .blob{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
      .b1{width:600px;height:600px;background:radial-gradient(circle,rgba(33,119,209,.09) 0%,transparent 70%);top:-150px;left:-150px;animation:bd1 20s ease-in-out infinite;}
      .b2{width:450px;height:450px;background:radial-gradient(circle,rgba(195,154,53,.07) 0%,transparent 70%);bottom:0;right:-100px;animation:bd2 24s ease-in-out infinite;}
      @keyframes bd1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,50px)}}
      @keyframes bd2{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,-30px)}}
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
      .u-email{font-size:.65rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;}
      .main{margin-left:240px;padding:28px 32px;min-height:100vh;position:relative;z-index:1;}
      @keyframes fu{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
      .topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;opacity:0;animation:fu .5s ease .1s forwards;}
      .tb-greet{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.5rem;letter-spacing:-.03em;color:var(--text);margin-bottom:2px;}
      .tb-date{font-size:.8rem;color:var(--muted);}
      .tb-right{display:flex;align-items:center;gap:10px;}
      .icon-btn{width:38px;height:38px;border-radius:50%;background:var(--glass);backdrop-filter:blur(16px);border:1px solid var(--gb);display:flex;align-items:center;justify-content:center;font-size:1rem;cursor:pointer;transition:background .2s;box-shadow:var(--gs);}
      .icon-btn:hover{background:var(--glass2);}
      .add-btn{display:flex;align-items:center;gap:7px;background:var(--blue);color:white;padding:9px 20px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 4px 16px var(--blue-glow);transition:background .2s,transform .15s;}
      .add-btn:hover{background:var(--blue-d);transform:translateY(-1px);}
      .streak{display:flex;align-items:center;gap:16px;background:linear-gradient(135deg,rgba(33,119,209,.07),rgba(195,154,53,.05));border:1px solid rgba(33,119,209,.13);border-radius:18px;padding:16px 20px;margin-bottom:20px;opacity:0;animation:fu .5s ease .15s forwards;}
      .s-fire{font-size:2rem;animation:fw 2s ease infinite;}
      @keyframes fw{0%,100%{transform:rotate(-6deg);}50%{transform:rotate(6deg);}}
      .s-val{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.7rem;letter-spacing:-.03em;color:var(--blue);}
      .s-lbl{font-size:.7rem;color:var(--muted);margin-top:1px;}
      .s-desc{font-size:.78rem;color:var(--text2);margin-top:2px;}
      .s-right{margin-left:auto;text-align:right;}
      .s-earned-num{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.4rem;color:var(--gold);}
      .s-earned-lbl{font-size:.62rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;opacity:0;animation:fu .5s ease .2s forwards;}
      .sc{background:var(--glass);backdrop-filter:blur(20px) saturate(2);border:1px solid var(--gb);border-radius:18px;padding:18px 20px;box-shadow:var(--gs);position:relative;overflow:hidden;}
      .sc::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--blue),transparent);opacity:0;transition:opacity .3s;}
      .sc:hover::before{opacity:1;}
      .sc-ic{font-size:1.2rem;margin-bottom:10px;}
      .sc-val{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.7rem;letter-spacing:-.03em;color:var(--text);margin-bottom:2px;}
      .sc-lbl{font-size:.72rem;color:var(--muted);}
      .sc-sub{font-size:.68rem;margin-top:6px;font-weight:500;}
      .c-good{color:var(--success);}.c-warn{color:var(--warn);}.c-blue{color:var(--blue);}
      .bdg-panel{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:22px;box-shadow:var(--gs);overflow:hidden;margin-bottom:20px;opacity:0;animation:fu .5s ease .25s forwards;}
      .ph{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--border);}
      .pt{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;color:var(--text);}
      .ps{font-size:.72rem;color:var(--muted);margin-top:1px;}
      .bdg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:12px;padding:20px 24px;}
      .bi{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;}
      .bi-wrap{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;position:relative;transition:transform .2s,box-shadow .2s;}
      .bi:hover .bi-wrap{transform:scale(1.1);}
      .bi-wrap.earned{background:linear-gradient(135deg,var(--blue-pale),rgba(195,154,53,.07));border:1.5px solid rgba(33,119,209,.2);box-shadow:0 4px 14px rgba(33,119,209,.12);}
      .bi-wrap.locked{background:rgba(122,144,170,.07);border:1.5px solid rgba(122,144,170,.12);filter:grayscale(1);opacity:.4;}
      .bi-wrap.preview{background:rgba(122,144,170,.04);border:1.5px dashed rgba(122,144,170,.18);opacity:.28;}
      .bi-ring{position:absolute;inset:-3px;border-radius:17px;border:2px solid var(--gold);box-shadow:0 0 10px rgba(195,154,53,.25);animation:rp 3s ease infinite;}
      @keyframes rp{0%,100%{box-shadow:0 0 6px rgba(195,154,53,.2);}50%{box-shadow:0 0 18px rgba(195,154,53,.45);}}
      .bi-lock{position:absolute;bottom:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:var(--muted);display:flex;align-items:center;justify-content:center;font-size:.55rem;color:white;}
      .bi-lock.up{background:var(--gold);}
      .bi-name{font-size:.58rem;font-weight:600;color:var(--text2);text-align:center;line-height:1.2;max-width:68px;}
      .bi-name.on{color:var(--blue);}
      .upgrade-bar{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,rgba(33,119,209,.05),rgba(195,154,53,.03));border-top:1px solid var(--border);padding:14px 20px;font-size:.76rem;color:var(--text2);}
      .ub-btn{margin-left:auto;background:var(--blue);color:white;border:none;padding:7px 16px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.74rem;font-weight:700;cursor:pointer;white-space:nowrap;box-shadow:0 3px 10px var(--blue-glow);}
      .dg{display:grid;grid-template-columns:1fr 340px;gap:20px;opacity:0;animation:fu .5s ease .3s forwards;}
      .panel{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:22px;box-shadow:var(--gs);overflow:hidden;}
      .p-hd{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--border);}
      .p-t{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;color:var(--text);}
      .p-s{font-size:.72rem;color:var(--muted);margin-top:1px;}
      .ftabs{display:flex;gap:4px;}
      .ft{font-size:.72rem;font-weight:500;padding:5px 12px;border-radius:100px;border:none;cursor:pointer;background:transparent;color:var(--muted);transition:background .2s,color .2s;}
      .ft.on{background:var(--blue-pale);color:var(--blue);font-weight:600;}
      .bills-list{padding:8px 12px;}
      .br{display:grid;grid-template-columns:36px 1fr auto auto auto;align-items:center;gap:12px;padding:12px 10px;border-radius:14px;margin-bottom:4px;transition:background .2s;}
      .br:hover{background:rgba(33,119,209,.05);}
      .b-ic{width:36px;height:36px;border-radius:10px;background:rgba(33,119,209,.09);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;}
      .b-nm{font-family:'Plus Jakarta Sans',sans-serif;font-size:.88rem;font-weight:700;color:var(--text);}
      .b-rc{font-size:.66rem;color:var(--muted);margin-top:1px;}
      .chip{font-size:.68rem;font-weight:600;padding:4px 10px;border-radius:100px;white-space:nowrap;}
      .chip-soon{background:rgba(245,158,11,.12);color:var(--warn);border:1px solid rgba(245,158,11,.2);}
      .chip-ok{background:var(--blue-pale);color:var(--blue);border:1px solid rgba(33,119,209,.15);}
      .chip-urgent{background:rgba(239,68,68,.1);color:var(--danger);border:1px solid rgba(239,68,68,.18);}
      .b-amt{font-family:'Plus Jakarta Sans',sans-serif;font-size:.9rem;font-weight:700;color:var(--text);}
      .b-acts{display:flex;gap:4px;}
      .b-act{width:28px;height:28px;border-radius:8px;border:1px solid var(--border);background:transparent;cursor:pointer;font-size:.7rem;color:var(--muted);display:flex;align-items:center;justify-content:center;transition:all .2s;}
      .b-act:hover{background:var(--blue-pale);color:var(--blue);}
      .wimt-btn{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:100px;border:1px solid rgba(239,68,68,.2);background:rgba(239,68,68,.06);color:var(--danger);font-size:.64rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .2s;}
      .wimt-btn:hover{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.35);}
      /* MONEY IQ */
      .miq-bar{display:flex;align-items:center;gap:20px;background:linear-gradient(135deg,rgba(33,119,209,.06),rgba(195,154,53,.04));border:1px solid rgba(33,119,209,.12);border-radius:18px;padding:18px 24px;margin-bottom:20px;opacity:0;animation:fu .5s ease .18s forwards;}
      .miq-ring{position:relative;width:72px;height:72px;flex-shrink:0;}
      .miq-ring svg{transform:rotate(-90deg);}
      .miq-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.15rem;color:var(--text);}
      .miq-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1rem;color:var(--text);margin-bottom:3px;}
      .miq-label{font-size:.8rem;font-weight:600;margin-bottom:6px;}
      .miq-factors{display:flex;gap:8px;flex-wrap:wrap;}
      .miq-factor{font-size:.62rem;font-weight:500;padding:3px 9px;border-radius:100px;background:var(--glass);border:1px solid var(--border);color:var(--muted);}
      .miq-factor.good{background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.2);color:var(--success);}
      .miq-factor.warn{background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.2);color:var(--warn);}
      .miq-right{margin-left:auto;text-align:right;}
      .miq-learn{font-size:.72rem;color:var(--blue);text-decoration:none;font-weight:600;display:flex;align-items:center;gap:4px;justify-content:flex-end;margin-top:6px;cursor:pointer;}
      /* WIMT MODAL */
      .wimt-overlay{position:fixed;inset:0;z-index:500;background:rgba(12,21,36,.5);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;}
      .wimt-modal{background:white;border-radius:26px;padding:36px;max-width:460px;width:100%;position:relative;box-shadow:0 28px 80px rgba(12,21,36,.28);animation:mpop .4s cubic-bezier(.34,1.56,.64,1);}
      .wimt-modal::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--danger),var(--warn),var(--gold));border-radius:26px 26px 0 0;}
      .wimt-header{display:flex;align-items:flex-start;gap:14px;margin-bottom:22px;}
      .wimt-bill-icon{width:48px;height:48px;border-radius:14px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.15);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;}
      .wimt-bill-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.2rem;color:var(--text);margin-bottom:3px;}
      .wimt-bill-sub{font-size:.78rem;color:var(--muted);}
      .wimt-body{background:var(--bg);border-radius:14px;padding:18px;min-height:120px;font-size:.84rem;color:var(--text2);line-height:1.75;white-space:pre-wrap;}
      .wimt-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:120px;}
      .wimt-spinner{width:32px;height:32px;border:3px solid var(--border);border-top-color:var(--danger);border-radius:50%;animation:spin 0.8s linear infinite;}
      @keyframes spin{to{transform:rotate(360deg);}}
      .wimt-loading-txt{font-size:.78rem;color:var(--muted);}
      .wimt-footer{margin-top:18px;display:flex;gap:10px;}
      .wimt-learn-btn{flex:1;background:var(--blue);color:white;border:none;padding:12px;border-radius:12px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:700;cursor:pointer;}
      .wimt-close-btn{background:transparent;border:1px solid var(--border);color:var(--muted);padding:12px 20px;border-radius:12px;font-size:.84rem;cursor:pointer;transition:all .2s;}
      .wimt-close-btn:hover{background:var(--blue-pale);color:var(--blue);}
      .empty{padding:40px 24px;text-align:center;}
      .empty-ic{font-size:2.2rem;margin-bottom:12px;}
      .empty-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;color:var(--text2);margin-bottom:6px;}
      .empty-s{font-size:.8rem;color:var(--muted);}
      .rcol{display:flex;flex-direction:column;gap:16px;}
      .up-list{padding:8px 12px;}
      .up-it{display:flex;align-items:center;gap:12px;padding:10px 8px;border-radius:12px;margin-bottom:4px;transition:background .2s;}
      .up-it:hover{background:rgba(33,119,209,.04);}
      .up-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
      .up-nm{font-size:.83rem;font-weight:600;color:var(--text);}
      .up-dt{font-size:.66rem;color:var(--muted);margin-top:1px;}
      .up-amt{font-family:'Plus Jakarta Sans',sans-serif;font-size:.85rem;font-weight:700;color:var(--text);}
      .sms-list{padding:8px 12px;}
      .sms-it{display:flex;align-items:flex-start;gap:10px;padding:10px 8px;border-radius:12px;margin-bottom:4px;}
      .sms-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--blue-m));display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.65rem;color:white;flex-shrink:0;}
      .sms-msg{font-size:.75rem;color:var(--text2);line-height:1.5;}
      .sms-time{font-size:.62rem;color:var(--muted);margin-top:3px;}
      .overlay{position:fixed;inset:0;z-index:400;background:rgba(12,21,36,.42);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;}
      .modal{background:var(--glass2);backdrop-filter:blur(28px) saturate(2);border:1px solid var(--gb);border-radius:26px;padding:36px;box-shadow:var(--gsl);width:100%;max-width:480px;position:relative;overflow:hidden;animation:mpop .35s cubic-bezier(.34,1.56,.64,1);}
      @keyframes mpop{from{opacity:0;transform:scale(.93) translateY(20px);}to{opacity:1;transform:scale(1) translateY(0);}}
      .modal::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--blue),var(--gold),transparent);}
      .m-ti{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.3rem;letter-spacing:-.03em;color:var(--text);margin-bottom:4px;}
      .m-su{font-size:.8rem;color:var(--muted);margin-bottom:24px;}
      .m-cl{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;background:var(--blue-pale);border:none;cursor:pointer;font-size:1rem;color:var(--muted);display:flex;align-items:center;justify-content:center;transition:background .2s;}
      .m-cl:hover{background:rgba(239,68,68,.1);color:var(--danger);}
      .mfg{margin-bottom:14px;}
      .mfg label{display:block;font-size:.62rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;}
      .mfg input,.mfg select{width:100%;background:rgba(255,255,255,.75);border:1.5px solid rgba(33,119,209,.12);border-radius:11px;padding:12px 14px;font-family:'Inter',sans-serif;font-size:.88rem;color:var(--text);outline:none;transition:border-color .2s,box-shadow .2s;}
      .mfg input:focus,.mfg select:focus{border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-pale);}
      .mfg input::placeholder{color:var(--muted);}
      .mfg select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237a90aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;}
      .fr2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
      .ai-s{display:flex;align-items:center;gap:8px;background:var(--blue-pale);border:1px solid rgba(33,119,209,.15);border-radius:10px;padding:9px 12px;margin-top:6px;font-size:.74rem;color:var(--blue);}
      .ai-dot{width:6px;height:6px;background:var(--blue);border-radius:50%;animation:pulse 1.5s ease infinite;}
      @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.7);}}
      .m-sub{width:100%;background:var(--blue);color:white;border:none;padding:14px;border-radius:12px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer;box-shadow:0 4px 18px var(--blue-glow);transition:background .2s,transform .15s;margin-top:8px;}
      .m-sub:hover:not(:disabled){background:var(--blue-d);transform:translateY(-1px);}
      .m-sub:disabled{opacity:.5;cursor:not-allowed;}
      .bpop-ov{position:fixed;inset:0;z-index:600;background:rgba(12,21,36,.55);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;}
      .bpop{background:white;border-radius:28px;padding:44px 40px;max-width:380px;width:100%;text-align:center;position:relative;box-shadow:0 30px 90px rgba(12,21,36,.3);animation:mpop .5s cubic-bezier(.34,1.56,.64,1);}
      .bpop::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--blue),var(--gold),var(--blue));border-radius:28px 28px 0 0;}
      .bpop-em{font-size:4.5rem;display:block;margin-bottom:14px;animation:eb .6s cubic-bezier(.34,1.56,.64,1) .3s both;}
      @keyframes eb{from{transform:scale(.2) rotate(-25deg);}to{transform:scale(1) rotate(0deg);}}
      .bpop-ey{font-size:.62rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;}
      .bpop-nm{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.7rem;letter-spacing:-.03em;color:var(--text);margin-bottom:8px;}
      .bpop-ds{font-size:.86rem;color:var(--text2);line-height:1.7;margin-bottom:28px;}
      .bpop-btns{display:flex;flex-direction:column;gap:10px;}
      .bpop-share{display:flex;align-items:center;justify-content:center;gap:8px;background:var(--blue);color:white;border:none;padding:14px;border-radius:13px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.9rem;font-weight:700;cursor:pointer;box-shadow:0 4px 16px var(--blue-glow);}
      .bpop-close{background:transparent;border:1px solid var(--border);color:var(--muted);padding:12px;border-radius:13px;font-size:.85rem;cursor:pointer;transition:all .2s;}
      .bpop-close:hover{background:var(--blue-pale);color:var(--blue);}
      .bpop-note{font-size:.72rem;color:var(--muted);padding:10px 14px;background:var(--blue-pale);border-radius:10px;margin-bottom:4px;}
      .shr-modal{background:white;border-radius:24px;padding:32px;max-width:420px;width:100%;position:relative;box-shadow:0 24px 80px rgba(12,21,36,.3);animation:mpop .4s cubic-bezier(.34,1.56,.64,1);}
      .shr-card{background:linear-gradient(135deg,var(--blue),var(--blue-d));border-radius:20px;padding:32px 28px;text-align:center;margin-bottom:20px;position:relative;overflow:hidden;}
      .shr-card::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:32px 32px;}
      .shr-inner{position:relative;z-index:1;}
      .shr-em{font-size:3.5rem;display:block;margin-bottom:12px;}
      .shr-nm{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.4rem;color:white;letter-spacing:-.02em;margin-bottom:6px;}
      .shr-ds{font-size:.8rem;color:rgba(255,255,255,.8);line-height:1.55;}
      .shr-br{margin-top:16px;font-size:.62rem;color:rgba(255,255,255,.45);letter-spacing:.12em;text-transform:uppercase;}
      .shr-plats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
      .shr-btn{display:flex;align-items:center;justify-content:center;gap:7px;padding:11px;border-radius:12px;border:1px solid var(--border);background:transparent;font-size:.8rem;font-weight:600;color:var(--text2);cursor:pointer;transition:all .2s;}
      .shr-btn:hover{background:var(--blue-pale);color:var(--blue);border-color:rgba(33,119,209,.2);}
      .shr-copy{width:100%;padding:12px;border-radius:12px;background:var(--blue-pale);border:1px solid rgba(33,119,209,.2);color:var(--blue);font-size:.83rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:background .2s;}
      .shr-dismiss{width:100%;margin-top:10px;background:transparent;border:1px solid var(--border);color:var(--muted);padding:11px;border-radius:12px;font-size:.84rem;cursor:pointer;transition:all .2s;}
      .shr-dismiss:hover{background:var(--blue-pale);color:var(--blue);}
      .tut-mask{position:fixed;inset:0;z-index:501;background:rgba(12,21,36,.72);backdrop-filter:blur(2px);}
      .tut-spot{position:fixed;z-index:502;border-radius:18px;box-shadow:0 0 0 9999px rgba(12,21,36,.72);border:2px solid rgba(255,255,255,.25);pointer-events:none;transition:all .45s cubic-bezier(.34,1.56,.64,1);}
      .tut-pulse{position:fixed;z-index:502;border-radius:20px;border:2px solid rgba(33,119,209,.5);pointer-events:none;animation:tp 2s ease infinite;transition:all .45s cubic-bezier(.34,1.56,.64,1);}
      @keyframes tp{0%{box-shadow:0 0 0 0 rgba(33,119,209,.4);}70%{box-shadow:0 0 0 12px rgba(33,119,209,0);}100%{box-shadow:0 0 0 0 rgba(33,119,209,0);}}
      .tut-card{position:fixed;z-index:503;width:300px;background:white;border-radius:20px;padding:22px 24px;box-shadow:0 20px 60px rgba(12,21,36,.25);transition:all .45s cubic-bezier(.34,1.56,.64,1);}
      .tut-card::before{content:'';position:absolute;width:12px;height:12px;background:white;transform:rotate(45deg);}
      .arr-left::before{left:-5px;top:50%;margin-top:-6px;}.arr-right::before{right:-5px;top:50%;margin-top:-6px;}.arr-top::before{top:-5px;left:28px;}.arr-bottom::before{bottom:-5px;left:28px;}
      .tut-badge{display:inline-flex;align-items:center;gap:6px;background:var(--blue-pale);border:1px solid rgba(33,119,209,.18);border-radius:100px;padding:3px 11px;font-size:.6rem;font-weight:700;color:var(--blue);letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px;}
      .tut-ti{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1rem;color:var(--text);margin-bottom:7px;}
      .tut-de{font-size:.8rem;color:var(--text2);line-height:1.65;margin-bottom:18px;}
      .tut-ac{display:flex;align-items:center;justify-content:space-between;}
      .tut-skip{font-size:.74rem;color:var(--muted);background:none;border:none;cursor:pointer;padding:6px;}
      .tut-btns{display:flex;gap:8px;}
      .tut-prev{background:transparent;color:var(--text2);border:1px solid var(--border);padding:8px 16px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.78rem;font-weight:600;cursor:pointer;}
      .tut-next{background:var(--blue);color:white;border:none;padding:8px 18px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer;box-shadow:0 3px 12px var(--blue-glow);}
      .tut-dots{display:flex;gap:5px;}
      .td{width:6px;height:6px;border-radius:50%;background:rgba(33,119,209,.2);transition:all .3s;}
      .td.act{background:var(--blue);transform:scale(1.3);}.td.dn{background:var(--blue);opacity:.4;}
      @media(max-width:1100px){.stats{grid-template-columns:repeat(2,1fr);}.dg{grid-template-columns:1fr;}}
      @media(max-width:860px){.sb{width:200px;}.main{margin-left:200px;padding:20px;}}
      @media(max-width:700px){.sb{display:none;}.main{margin-left:0;padding:16px;}}
    `}</style>

    <div className="blob b1"/><div className="blob b2"/>
    <canvas ref={canvasRef} style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:9999}}/>

    {/* SIDEBAR */}
    <aside className="sb">
      <div className="sb-logo"><span className="sb-logo-txt">Nyra</span><span className="sb-gem"/></div>
      <div className="nav-lbl">Menu</div>
      <div className="ni on"><span className="ni-ic">📋</span>My Bills</div>
      <div className="ni"><span className="ni-ic">🔔</span>Reminders</div>
      <div className="ni"><span className="ni-ic">🏆</span>Achievements</div>
      <a className="ni" href="/learn"><span className="ni-ic">🧠</span>Learn</a>
      <div className="ni"><span className="ni-ic">📊</span>Analytics</div>
      <div className="ni"><span className="ni-ic">⚙️</span>Settings</div>
      <div className="nav-lbl">Resources</div>
      <a className="ni" href="https://financialfutureseducation.com/" target="_blank" rel="noreferrer"><span className="ni-ic">🎓</span>FFE Website</a>
      <div className="sb-bot">
        <div className="plan-pill">
          <div><div className="pp-name">{userPlan} Plan</div><div className="pp-ct">{bills.length} / {planLimit===999?'∞':planLimit} bills</div></div>
          <div className="pp-badge">Active</div>
        </div>
        <div className="u-row">
          <div className="u-av">{userName[0]?.toUpperCase()}</div>
          <div><div className="u-name">{userName}</div><div className="u-email">{userEmail}</div></div>
        </div>
      </div>
    </aside>

    {/* MAIN */}
    <main className="main">
      {/* Topbar */}
      <div className="topbar">
        <div ref={rGreeting}><div className="tb-greet">{greet}, {userName} 👋</div><div className="tb-date">{today}</div></div>
        <div className="tb-right">
          <div className="icon-btn" title="Notifications">🔔</div>
          <div className="icon-btn" title="Help" onClick={startTut}>❓</div>
          <button className="add-btn" ref={rAddBtn} onClick={()=>setModalOpen(true)}>＋ Add Bill</button>
        </div>
      </div>

      {/* Streak banner — ALL tiers */}
      <div className="streak">
        <div className="s-fire">🔥</div>
        <div>
          <div style={{display:'flex',alignItems:'baseline',gap:8}}><div className="s-val">{stats.streakMonths}</div><div className="s-lbl">month streak</div></div>
          <div className="s-desc">{streakDesc(stats.streakMonths)}</div>
        </div>
        <div className="s-right">
          <div className="s-earned-num">{earnedCount}</div>
          <div className="s-earned-lbl">Badges earned</div>
        </div>
      </div>

      {/* Money IQ Score — ALL tiers */}
      {(() => {
        const iq = calcMoneyIQ(stats, bills);
        const {label, color} = moneyIQLabel(iq);
        const circumference = 2 * Math.PI * 28;
        const dash = (iq / 100) * circumference;
        const overdue = bills.filter(b=>daysUntil(b.due_date)<0).length;
        const avgRemind = bills.length>0 ? bills.reduce((s,b)=>s+b.remind_days_before,0)/bills.length : 0;
        return (
          <div className="miq-bar">
            <div className="miq-ring">
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(33,119,209,0.1)" strokeWidth="6"/>
                <circle cx="36" cy="36" r="28" fill="none" stroke={color} strokeWidth="6"
                  strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
                  style={{transition:'stroke-dasharray 1s ease'}}/>
              </svg>
              <div className="miq-num">{iq}</div>
            </div>
            <div>
              <div className="miq-title">Money IQ</div>
              <div className="miq-label" style={{color}}>{label}</div>
              <div className="miq-factors">
                <span className={`miq-factor ${stats.streakMonths>0?'good':'warn'}`}>🔥 {stats.streakMonths}mo streak</span>
                <span className={`miq-factor ${overdue===0?'good':'warn'}`}>{overdue===0?'✅ No overdue':'⚠️ Overdue bills'}</span>
                <span className={`miq-factor ${bills.length>=5?'good':bills.length>=1?'warn':''}`}>📋 {bills.length} bills</span>
                <span className={`miq-factor ${avgRemind>=5?'good':avgRemind>=3?'warn':'warn'}`}>⏰ {avgRemind>0?`${avgRemind.toFixed(1)}d avg remind`:'No reminders set'}</span>
              </div>
            </div>
            <div className="miq-right">
              <div style={{fontSize:'.68rem',color:'var(--muted)',marginBottom:4}}>out of 100</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'2rem',color,lineHeight:1}}>{iq}</div>
              <a className="miq-learn" href="/learn">Improve my score →</a>
            </div>
          </div>
        );
      })()}

      {/* Stats */}
      <div className="stats" ref={rStats}>
        {[{ic:'📋',val:bills.length,lbl:'Bills tracked',sub:`${slots} slots left`,sc:'c-blue'},{ic:'💸',val:`$${totalDue.toLocaleString()}`,lbl:'Due this month',sub:dueSoon>0?`${dueSoon} due soon`:'All on track',sc:dueSoon>0?'c-warn':'c-good'},{ic:'✅',val:0,lbl:'Late fees this year',sub:"You're on track!",sc:'c-good'},{ic:'📱',val:reminders.length,lbl:'Reminders sent',sub:'This month',sc:'c-blue'}].map((s,i)=>(
          <div key={i} className="sc"><div className="sc-ic">{s.ic}</div><div className="sc-val">{s.val}</div><div className="sc-lbl">{s.lbl}</div><div className={`sc-sub ${s.sc}`}>{s.sub}</div></div>
        ))}
      </div>

      {/* BADGES PANEL */}
      <div className="bdg-panel" ref={rBadges}>
        <div className="ph">
          <div>
            <div className="pt">🏆 Your Achievements</div>
            <div className="ps">{earnedCount} earned · {visibleBadges.length} available on {userPlan}{userPlan==='Basic'?' · Upgrade to unlock more':''}</div>
          </div>
          {userPlan!=='Basic'&&<div style={{fontSize:'.68rem',color:'var(--muted)',textAlign:'right',lineHeight:1.6}}><div>Streak · Milestone · Activity</div><div>Reminders · Canadian{userPlan==='Power'?' · Secret':''}</div></div>}
        </div>
        <div className="bdg-grid">
          {/* Earnable badges for this plan */}
          {visibleBadges.map(b=>{
            const earned=isBadgeEarned(b);
            return(
              <div key={b.id} className="bi" title={earned?`${b.name} — ${b.desc} (Click to share)`:`${b.name}: ${b.desc} — Not earned yet`}
                onClick={()=>{if(earned&&userPlan!=='Basic'){setShareBadge(b);setShareOpen(true);}}}>
                <div className={`bi-wrap ${earned?'earned':'locked'}`}>
                  {earned&&<div className="bi-ring"/>}
                  {!earned&&<div className="bi-lock">🔒</div>}
                  <span>{b.emoji}</span>
                </div>
                <div className={`bi-name ${earned?'on':''}`}>{b.name}</div>
              </div>
            );
          })}
          {/* Greyed upgrade previews — Basic only */}
          {lockedPreviews.map(b=>(
            <div key={b.id} className="bi" title="Upgrade to Plus to unlock">
              <div className="bi-wrap preview"><div className="bi-lock up">⬆</div><span style={{opacity:.35}}>{b.emoji}</span></div>
              <div className="bi-name">{b.name}</div>
            </div>
          ))}
        </div>
        {/* Upgrade nudge — Basic only */}
        {userPlan==='Basic'&&(
          <div className="upgrade-bar">
            <span>🏆</span>
            <span><strong style={{color:'var(--blue)'}}>{ALL_BADGES.length-visibleBadges.length} more badges</strong> + social sharing unlocked on Plus</span>
            <button className="ub-btn" onClick={()=>window.location.href='/signup?plan=Plus&price=5'}>Upgrade →</button>
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="dg">
        {/* Bills panel */}
        <div className="panel" ref={rBills}>
          <div className="p-hd">
            <div><div className="p-t">Your Bills</div><div className="p-s">{bills.length} bills · ${totalDue.toLocaleString()}/month total</div></div>
            <div className="ftabs"><button className="ft on">All</button><button className="ft">Due Soon</button></div>
          </div>
          <div className="bills-list">
            {loading?(<div className="empty"><div className="empty-ic">⏳</div><div className="empty-h">Loading...</div></div>)
            :bills.length===0?(<div className="empty"><div className="empty-ic">📋</div><div className="empty-h">No bills yet</div><div className="empty-s">Click &quot;+ Add Bill&quot; to get started and earn your first badge!</div></div>)
            :bills.map(bill=>{const d=daysUntil(bill.due_date);const{label,cls}=dueChip(d);return(
              <div key={bill.id} className="br">
                <div className="b-ic">📄</div>
                <div><div className="b-nm">{bill.name}</div><div className="b-rc">{bill.recurring} · {bill.remind_days_before}d reminder</div></div>
                <div className={`chip ${cls}`}>{label}</div>
                <div className="b-amt">${bill.amount.toLocaleString()}</div>
                <div className="b-acts">
                  <button className="wimt-btn" onClick={()=>openWimt(bill)} title="What if I miss this?">🚨 Miss it?</button>
                  <button className="b-act">✏️</button>
                  <button className="b-act" onClick={()=>deleteBill(bill.id)}>🗑</button>
                </div>
              </div>
            );})}
          </div>
        </div>

        {/* Right col */}
        <div className="rcol">
          <div className="panel" ref={rUpcoming}>
            <div className="p-hd"><div><div className="p-t">Coming Up</div><div className="p-s">Next 30 days</div></div></div>
            <div className="up-list">
              {bills.filter(b=>{const d=daysUntil(b.due_date);return d>=0&&d<=30;}).length===0
                ?<div style={{padding:'20px 8px',fontSize:'.8rem',color:'var(--muted)',textAlign:'center'}}>Nothing due in 30 days</div>
                :bills.filter(b=>{const d=daysUntil(b.due_date);return d>=0&&d<=30;}).map(b=>{const d=daysUntil(b.due_date);return(
                  <div key={b.id} className="up-it">
                    <div className="up-dot" style={{background:d<=5?'var(--warn)':'var(--blue)'}}/>
                    <div style={{flex:1}}><div className="up-nm">{b.name}</div><div className="up-dt">{fmtDate(b.due_date)} · {b.remind_days_before}d reminder</div></div>
                    <div className="up-amt">${b.amount.toLocaleString()}</div>
                  </div>
                );})}
            </div>
          </div>
          <div className="panel" ref={rSms}>
            <div className="p-hd"><div><div className="p-t">Recent Reminders</div><div className="p-s">Texts sent to your phone</div></div></div>
            <div className="sms-list">
              {reminders.length===0
                ?<div style={{padding:'20px 8px',fontSize:'.8rem',color:'var(--muted)',textAlign:'center'}}>No reminders yet — they&apos;ll appear here</div>
                :reminders.map(r=>(
                  <div key={r.id} className="sms-it">
                    <div className="sms-av">N</div>
                    <div><div className="sms-msg">👋 Your <strong>{r.bill_name}</strong> of ${r.amount} is due soon.</div><div className="sms-time">{new Date(r.sent_at).toLocaleDateString('en-CA',{month:'short',day:'numeric'})} · 9:00 AM</div></div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </main>

    {/* ADD BILL MODAL */}
    {modalOpen&&(
      <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setModalOpen(false);}}>
        <div className="modal">
          <button className="m-cl" onClick={()=>setModalOpen(false)}>✕</button>
          <div className="m-ti">Add a Bill</div>
          <div className="m-su">Nyra will remind you before it&apos;s due.</div>
          <div className="mfg">
            <label>Bill name</label>
            <input type="text" placeholder="e.g. Netflix, Rent, Rogers" value={billName} onChange={e=>handleName(e.target.value)}/>
            {aiSugg&&<div className="ai-s">{aiSugg==='thinking'?<><div className="ai-dot"/><span>AI is thinking...</span></>:<span>{aiSugg}</span>}</div>}
          </div>
          <div className="fr2">
            <div className="mfg"><label>Amount ($)</label><input type="number" placeholder="0.00" value={billAmt} onChange={e=>setBillAmt(e.target.value)}/></div>
            <div className="mfg"><label>Due date</label><input type="date" value={billDue} onChange={e=>setBillDue(e.target.value)}/></div>
          </div>
          <div className="fr2">
            <div className="mfg"><label>Billing cycle</label><select value={billCycle} onChange={e=>setBillCycle(e.target.value)}><option>Monthly</option><option>Yearly</option><option>Weekly</option><option>One-time</option></select></div>
            <div className="mfg"><label>Remind me</label><select value={billRemind} onChange={e=>setBillRemind(e.target.value)}><option value="1">1 day before</option><option value="3">3 days before</option><option value="5">5 days before</option><option value="7">7 days before</option></select></div>
          </div>
          <button className="m-sub" onClick={saveBill} disabled={saving||!billName||!billAmt||!billDue}>{saving?'Saving...':'Save Bill →'}</button>
        </div>
      </div>
    )}

    {/* BADGE EARNED POPUP — all tiers */}
    {badgePopup&&earnedBadge&&(
      <div className="bpop-ov">
        <div className="bpop">
          <span className="bpop-em">{earnedBadge.emoji}</span>
          <div className="bpop-ey">Badge Unlocked!</div>
          <div className="bpop-nm">{earnedBadge.name}</div>
          <div className="bpop-ds">{earnedBadge.desc}</div>
          <div className="bpop-btns">
            {userPlan!=='Basic'
              ?<button className="bpop-share" onClick={()=>{setBadgePopup(false);setShareBadge(earnedBadge);setShareOpen(true);}}>📤 Share this badge</button>
              :<><div className="bpop-note">Upgrade to <strong>Plus</strong> to share your badges on social media 📤</div><button className="bpop-share" style={{background:'var(--gold)'}} onClick={()=>window.location.href='/signup?plan=Plus&price=5'}>Upgrade to Plus →</button></>}
            <button className="bpop-close" onClick={()=>setBadgePopup(false)}>Keep going 💪</button>
          </div>
        </div>
      </div>
    )}

    {/* SHARE MODAL — Plus / Power only */}
    {shareOpen&&shareBadge&&userPlan!=='Basic'&&(
      <div className="bpop-ov" onClick={e=>{if(e.target===e.currentTarget)setShareOpen(false);}}>
        <div className="shr-modal">
          <div className="shr-card">
            <div className="shr-inner">
              <span className="shr-em">{shareBadge.emoji}</span>
              <div className="shr-nm">{shareBadge.name}</div>
              <div className="shr-ds">{shareBadge.desc}</div>
              <div className="shr-br">Nyra · Never miss a bill</div>
            </div>
          </div>
          <div className="shr-plats">
            {[['📘','Facebook',`https://www.facebook.com/sharer/sharer.php?u=https://nyra-nu.vercel.app&quote=${encodeURIComponent(shareText(shareBadge))}`],['𝕏','Twitter / X',`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText(shareBadge))}`],['💼','LinkedIn',`https://www.linkedin.com/sharing/share-offsite/?url=https://nyra-nu.vercel.app`],['📸','Instagram','']].map(([em,nm,url])=>(
              <button key={nm} className="shr-btn" onClick={()=>{if(url)window.open(url,'_blank');else alert('Screenshot the card above to share on Instagram Stories!');}}>{em} {nm}</button>
            ))}
          </div>
          <button className="shr-copy" onClick={()=>copyShare(shareBadge)}>{copied?'✅ Copied!':'📋 Copy text to clipboard'}</button>
          <button className="shr-dismiss" onClick={()=>setShareOpen(false)}>Close</button>
        </div>
      </div>
    )}

    {/* WHAT IF I MISS THIS MODAL */}
    {wimtOpen&&wimtBill&&(
      <div className="wimt-overlay" onClick={e=>{if(e.target===e.currentTarget){setWimtOpen(false);setWimtResult('');}}}>
        <div className="wimt-modal">
          <div className="wimt-header">
            <div className="wimt-bill-icon">🚨</div>
            <div>
              <div className="wimt-bill-name">What if I miss {wimtBill.name}?</div>
              <div className="wimt-bill-sub">${wimtBill.amount} · due in {daysUntil(wimtBill.due_date)} days · {wimtBill.recurring}</div>
            </div>
          </div>
          {wimtLoading?(
            <div className="wimt-loading">
              <div className="wimt-spinner"/>
              <div className="wimt-loading-txt">Nyra is calculating the real cost... 🧮</div>
            </div>
          ):(
            <div className="wimt-body">{wimtResult}</div>
          )}
          <div className="wimt-footer">
            <button className="wimt-learn-btn" onClick={()=>window.location.href='/learn'}>📚 Learn how to protect your score →</button>
            <button className="wimt-close-btn" onClick={()=>{setWimtOpen(false);setWimtResult('');}}>Close</button>
          </div>
        </div>
      </div>
    )}

    {/* TUTORIAL */}
    {tutOn&&(<>
      <div className="tut-mask" onClick={()=>setTutOn(false)}/>
      <div className="tut-spot" style={{left:spot.l,top:spot.t,width:spot.w,height:spot.h}}/>
      <div className="tut-pulse" style={{left:spot.l,top:spot.t,width:spot.w,height:spot.h}}/>
      <div className={`tut-card ${TUT[tutStep].arrow}`} style={{left:card.l,top:card.t}}>
        <div className="tut-badge"><div className="tut-dots">{TUT.map((_,i)=><div key={i} className={`td${i<tutStep?' dn':i===tutStep?' act':''}`}/>)}</div><span>Step {tutStep+1} of {TUT.length}</span></div>
        <div className="tut-ti">{TUT[tutStep].title}</div>
        <div className="tut-de">{TUT[tutStep].desc}</div>
        <div className="tut-ac">
          <button className="tut-skip" onClick={()=>setTutOn(false)}>Skip tour</button>
          <div className="tut-btns">
            <button className="tut-prev" onClick={prevTut} style={{visibility:tutStep===0?'hidden':'visible'}}>← Back</button>
            <button className="tut-next" onClick={nextTut} style={TUT[tutStep].isLast?{background:'linear-gradient(135deg,var(--blue),var(--gold))'}:{}}>{TUT[tutStep].isLast?'🎉 Done!':'Next →'}</button>
          </div>
        </div>
      </div>
    </>)}
  </>);
}
