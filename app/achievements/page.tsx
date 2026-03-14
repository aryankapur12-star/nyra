'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Bill { id:string;name:string;amount:number;due_date:string;recurring:string;remind_days_before:number; }
interface UserStats { billCount:number;reminderCount:number;streakMonths:number;totalTracked:number;monthsSubscribed:number;loggedInLate:boolean;loggedInEarly:boolean;addedBillWithinHour:boolean;upgraded:boolean; }
interface Badge { id:string;emoji:string;name:string;desc:string;tier:'Basic'|'Plus'|'Power';category:string;secret?:boolean;check:(s:UserStats)=>boolean;progressLabel:(s:UserStats,bs:Bill[])=>string;progressPct:(s:UserStats,bs:Bill[])=>number; }
interface LeaderEntry { rank:number;display:string;score:number;level:string;isYou?:boolean; }

// ─── XP / Level system ────────────────────────────────────────────────────────
const LEVELS = [
  {name:'Nyra Newcomer', minXP:0,   maxXP:99,  emoji:'🌱', color:'#7a90aa'},
  {name:'Bill Tracker',  minXP:100, maxXP:249, emoji:'📋', color:'#2177d1'},
  {name:'Money Mover',   minXP:250, maxXP:499, emoji:'💸', color:'#7c3aed'},
  {name:'Finance Pro',   minXP:500, maxXP:999, emoji:'📈', color:'#c39a35'},
  {name:'Nyra Legend',   minXP:1000,maxXP:9999,emoji:'👑', color:'#ef4444'},
];

function calcXP(stats:UserStats, earnedBadgeCount:number):number {
  return stats.billCount*5 + stats.reminderCount*2 + stats.streakMonths*50 + earnedBadgeCount*25;
}
function getLevel(xp:number){ return LEVELS.find((l,i)=>xp>=l.minXP&&(i===LEVELS.length-1||xp<LEVELS[i+1].minXP))||LEVELS[0]; }
function getLevelProgress(xp:number){ const l=getLevel(xp); const next=LEVELS[LEVELS.indexOf(l)+1]; if(!next) return 100; return Math.round(((xp-l.minXP)/(next.minXP-l.minXP))*100); }
function getNextLevel(xp:number){ const l=getLevel(xp); const idx=LEVELS.indexOf(l); return idx<LEVELS.length-1?LEVELS[idx+1]:null; }

// ─── Badge definitions with progress ─────────────────────────────────────────
const ALL_BADGES: Badge[] = [
  // Streak
  {id:'spark',          emoji:'✨',name:'Spark',            tier:'Basic', category:'Streak',   desc:'First month with zero late fees.',           check:s=>s.streakMonths>=1,  progressLabel:s=>`${s.streakMonths}/1 months`,        progressPct:s=>Math.min(100,s.streakMonths/1*100)},
  {id:'on-fire',        emoji:'🔥',name:'On Fire',          tier:'Plus',  category:'Streak',   desc:'3-month streak — unstoppable.',              check:s=>s.streakMonths>=3,  progressLabel:s=>`${s.streakMonths}/3 months`,        progressPct:s=>Math.min(100,s.streakMonths/3*100)},
  {id:'heatwave',       emoji:'🌊',name:'Heatwave',         tier:'Plus',  category:'Streak',   desc:'6 months strong, zero late fees.',           check:s=>s.streakMonths>=6,  progressLabel:s=>`${s.streakMonths}/6 months`,        progressPct:s=>Math.min(100,s.streakMonths/6*100)},
  {id:'untouchable',    emoji:'💎',name:'Untouchable',      tier:'Plus',  category:'Streak',   desc:'12-month streak. Truly untouchable.',        check:s=>s.streakMonths>=12, progressLabel:s=>`${s.streakMonths}/12 months`,       progressPct:s=>Math.min(100,s.streakMonths/12*100)},
  {id:'legend',         emoji:'👑',name:'Legend',           tier:'Plus',  category:'Streak',   desc:'24 months. You are the bill boss.',          check:s=>s.streakMonths>=24, progressLabel:s=>`${s.streakMonths}/24 months`,       progressPct:s=>Math.min(100,s.streakMonths/24*100)},
  // Milestone
  {id:'coffee-run',     emoji:'☕',name:'Coffee Run',        tier:'Basic', category:'Milestone',desc:'Tracked $100 in bills.',                    check:s=>s.totalTracked>=100,   progressLabel:s=>`$${s.totalTracked}/$100`,          progressPct:s=>Math.min(100,s.totalTracked/100*100)},
  {id:'grocery-haul',   emoji:'🛒',name:'Grocery Haul',     tier:'Plus',  category:'Milestone',desc:'Tracked $500 in bills.',                    check:s=>s.totalTracked>=500,   progressLabel:s=>`$${s.totalTracked}/$500`,          progressPct:s=>Math.min(100,s.totalTracked/500*100)},
  {id:'car-payment',    emoji:'🚗',name:'Car Payment',      tier:'Plus',  category:'Milestone',desc:'Tracked $5,000 in bills.',                  check:s=>s.totalTracked>=5000,  progressLabel:s=>`$${s.totalTracked.toLocaleString()}/$5K`, progressPct:s=>Math.min(100,s.totalTracked/5000*100)},
  {id:'down-payment',   emoji:'🏠',name:'Down Payment',     tier:'Plus',  category:'Milestone',desc:'Tracked $50,000 in bills.',                 check:s=>s.totalTracked>=50000, progressLabel:s=>`$${s.totalTracked.toLocaleString()}/$50K`,progressPct:s=>Math.min(100,s.totalTracked/50000*100)},
  {id:'bay-street',     emoji:'📈',name:'Bay Street',       tier:'Plus',  category:'Milestone',desc:'Tracked $100,000.',                         check:s=>s.totalTracked>=100000,progressLabel:s=>`$${s.totalTracked.toLocaleString()}/$100K`,progressPct:s=>Math.min(100,s.totalTracked/100000*100)},
  // Activity
  {id:'first-step',     emoji:'👣',name:'First Step',       tier:'Basic', category:'Activity', desc:'Added your very first bill.',               check:s=>s.billCount>=1,  progressLabel:s=>`${s.billCount}/1 bills`,   progressPct:s=>Math.min(100,s.billCount/1*100)},
  {id:'getting-serious',emoji:'📋',name:'Getting Serious',  tier:'Plus',  category:'Activity', desc:'Added 5 bills.',                            check:s=>s.billCount>=5,  progressLabel:s=>`${s.billCount}/5 bills`,   progressPct:s=>Math.min(100,s.billCount/5*100)},
  {id:'bill-collector', emoji:'🗂️',name:'Bill Collector',  tier:'Plus',  category:'Activity', desc:'Added 10 bills.',                           check:s=>s.billCount>=10, progressLabel:s=>`${s.billCount}/10 bills`,  progressPct:s=>Math.min(100,s.billCount/10*100)},
  {id:'whole-picture',  emoji:'🔭',name:'The Whole Picture',tier:'Plus',  category:'Activity', desc:'Tracking bills in 5+ categories.',          check:s=>s.billCount>=5,  progressLabel:s=>`${s.billCount}/5 bills`,   progressPct:s=>Math.min(100,s.billCount/5*100)},
  // Reminders
  {id:'heads-up',       emoji:'📬',name:'Heads Up',         tier:'Basic', category:'Reminders',desc:'Received your first reminder.',             check:s=>s.reminderCount>=1,   progressLabel:s=>`${s.reminderCount}/1`,    progressPct:s=>Math.min(100,s.reminderCount/1*100)},
  {id:'good-habits',    emoji:'📅',name:'Good Habits',      tier:'Plus',  category:'Reminders',desc:'10 reminders received.',                   check:s=>s.reminderCount>=10,  progressLabel:s=>`${s.reminderCount}/10`,   progressPct:s=>Math.min(100,s.reminderCount/10*100)},
  {id:'always-ready',   emoji:'⚡',name:'Always Ready',     tier:'Plus',  category:'Reminders',desc:'50 reminders received.',                   check:s=>s.reminderCount>=50,  progressLabel:s=>`${s.reminderCount}/50`,   progressPct:s=>Math.min(100,s.reminderCount/50*100)},
  {id:'never-surprised',emoji:'🛡️',name:'Never Surprised', tier:'Plus',  category:'Reminders',desc:'100 reminders received.',                  check:s=>s.reminderCount>=100, progressLabel:s=>`${s.reminderCount}/100`,  progressPct:s=>Math.min(100,s.reminderCount/100*100)},
  // Fun / Global
  {id:'day-one',        emoji:'🌅',name:'Day One',          tier:'Plus',  category:'Journey',  desc:'Subscribed for 1 month. Welcome!',          check:s=>s.monthsSubscribed>=1,  progressLabel:s=>`${s.monthsSubscribed}/1 month`,  progressPct:s=>Math.min(100,s.monthsSubscribed/1*100)},
  {id:'committed',      emoji:'🤝',name:'Committed',        tier:'Plus',  category:'Journey',  desc:'6 months subscribed. Respect.',             check:s=>s.monthsSubscribed>=6,  progressLabel:s=>`${s.monthsSubscribed}/6 months`, progressPct:s=>Math.min(100,s.monthsSubscribed/6*100)},
  {id:'loyal',          emoji:'💙',name:'Loyal',            tier:'Plus',  category:'Journey',  desc:'12 months on the journey.',                 check:s=>s.monthsSubscribed>=12, progressLabel:s=>`${s.monthsSubscribed}/12 months`,progressPct:s=>Math.min(100,s.monthsSubscribed/12*100)},
  {id:'ride-or-die',    emoji:'🔐',name:'Ride or Die',      tier:'Plus',  category:'Journey',  desc:'24 months. You\'re family now.',            check:s=>s.monthsSubscribed>=24, progressLabel:s=>`${s.monthsSubscribed}/24 months`,progressPct:s=>Math.min(100,s.monthsSubscribed/24*100)},
  // Secret
  {id:'night-owl',      emoji:'🦉',name:'Night Owl',        tier:'Power', category:'Secret',secret:true,desc:'Logged in after midnight.',         check:s=>s.loggedInLate,         progressLabel:()=>'Secret',progressPct:s=>s.loggedInLate?100:0},
  {id:'early-bird',     emoji:'🌅',name:'Early Bird',       tier:'Power', category:'Secret',secret:true,desc:'Logged in before 6am.',             check:s=>s.loggedInEarly,        progressLabel:()=>'Secret',progressPct:s=>s.loggedInEarly?100:0},
  {id:'overachiever',   emoji:'🚀',name:'Overachiever',     tier:'Power', category:'Secret',secret:true,desc:'Added a bill within 1hr of signup.',check:s=>s.addedBillWithinHour,  progressLabel:()=>'Secret',progressPct:s=>s.addedBillWithinHour?100:0},
  {id:'squeaky-clean',  emoji:'🧼',name:'Squeaky Clean',    tier:'Power', category:'Secret',secret:true,desc:'6 months, never overdue.',          check:s=>s.streakMonths>=6,      progressLabel:()=>'Secret',progressPct:s=>Math.min(100,s.streakMonths/6*100)},
  {id:'power-move',     emoji:'⚡',name:'Power Move',       tier:'Power', category:'Secret',secret:true,desc:'Upgraded your plan.',              check:s=>s.upgraded,             progressLabel:()=>'Secret',progressPct:s=>s.upgraded?100:0},
];

const EARNABLE_BY_PLAN:Record<string,string[]> = {
  Basic: ['spark','coffee-run','first-step','heads-up'],
  Plus:  ALL_BADGES.filter(b=>b.tier!=='Power').map(b=>b.id),
  Power: ALL_BADGES.map(b=>b.id),
};

const CATEGORIES = ['Streak','Milestone','Activity','Reminders','Journey','Secret'];

// ─── Weekly challenges ────────────────────────────────────────────────────────
function getWeeklyChallenges(stats:UserStats, bills:Bill[]) {
  // Seed based on week number so they rotate weekly
  const week = Math.floor(Date.now()/(1000*60*60*24*7));
  const pool = [
    {id:'login7',  emoji:'🗓️', title:'Log in 7 days in a row',      desc:'Stay consistent this week',         xp:30,  progress:Math.min(7,3), total:7},
    {id:'streak',  emoji:'🔥', title:'Hit your next streak month',   desc:'Keep those bills paid on time',     xp:50,  progress:stats.streakMonths%1===0?0:1, total:1},
    {id:'badges3', emoji:'🏆', title:'Earn 3 badges this month',     desc:'Chase those milestones',            xp:75,  progress:Math.min(3,Math.floor(stats.billCount/3)), total:3},
    {id:'bills3',  emoji:'📋', title:'Add 3 bills this week',        desc:'Get more coverage',                 xp:20,  progress:Math.min(3,bills.length%3), total:3},
    {id:'remind5', emoji:'⏰', title:'Set all reminders to 5+ days', desc:'Build that buffer habit',           xp:25,  progress:bills.filter(b=>b.remind_days_before>=5).length, total:Math.max(1,bills.length)},
  ];
  // Pick 3 based on week
  const idx = [week%5, (week+2)%5, (week+4)%5];
  return idx.map(i=>pool[i]);
}

// ─── Mock leaderboard (in real app this would be a Supabase query) ────────────
function genLeaderboard(userXP:number, userName:string, isAnon:boolean):LeaderEntry[] {
  const mock = [
    {xp:1240,name:'User #4821'},{xp:1180,name:'User #2934'},{xp:1050,name:'User #7751'},
    {xp:980, name:'User #1122'},{xp:870, name:'User #5509'},{xp:760, name:'User #8834'},
    {xp:650, name:'User #3317'},{xp:540, name:'User #6628'},{xp:430, name:'User #9940'},
    {xp:320, name:'User #1155'},
  ];
  const entries:LeaderEntry[] = mock.map((m,i)=>({rank:i+1,display:m.name,score:m.xp,level:getLevel(m.xp).name,isYou:false}));
  // Insert user in correct position
  const userEntry:LeaderEntry = {rank:0,display:isAnon?'You (Anonymous)':(userName||'You'),score:userXP,level:getLevel(userXP).name,isYou:true};
  const insertAt = entries.findIndex(e=>e.score<userXP);
  if(insertAt===-1) entries.push(userEntry); else entries.splice(insertAt,0,userEntry);
  entries.forEach((e,i)=>e.rank=i+1);
  return entries.slice(0,11); // top 10 + user if outside top 10
}

function daysUntil(d:string){const t=new Date();t.setHours(0,0,0,0);return Math.ceil((new Date(d+'T00:00:00').getTime()-t.getTime())/86400000);}

export default function AchievementsPage(){
  const[userName,setUserName]=useState('there');
  const[mobOpen,setMobOpen]=useState(false);
  useEffect(()=>{document.body.style.overflow=mobOpen?'hidden':'';return()=>{document.body.style.overflow='';};},[ mobOpen]);
  const[userPlan,setUserPlan]=useState('Plus');
  const[bills,setBills]=useState<Bill[]>([]);
  const[stats,setStats]=useState<UserStats>({billCount:0,reminderCount:0,streakMonths:0,totalTracked:0,monthsSubscribed:0,loggedInLate:false,loggedInEarly:false,addedBillWithinHour:false,upgraded:false});
  const[isAnon,setIsAnon]=useState(true);
  const[activeCategory,setActiveCategory]=useState<string>('All');
  const[shareOpen,setShareOpen]=useState(false);
  const[shareBadge,setShareBadge]=useState<any>(null);
  const[copied,setCopied]=useState(false);

  useEffect(()=>{
    const hr=new Date().getHours();
    async function load(){
      const{data:{user}}=await supabase.auth.getUser();if(!user)return;
      const{data:prof}=await supabase.from('profiles').select('full_name,plan,created_at').eq('id',user.id).single();
      if(prof){
        setUserName(prof.full_name?.split(' ')[0]||'there');
        setUserPlan(prof.plan||'Plus');
        const created=new Date(prof.created_at);
        const monthsSub=Math.floor((Date.now()-created.getTime())/(1000*60*60*24*30));
        const{data:bd}=await supabase.from('bills').select('*').eq('user_id',user.id);
        const{data:rd}=await supabase.from('reminder_logs').select('*').eq('user_id',user.id);
        setBills(bd||[]);
        const total=(bd||[]).reduce((s:number,b:Bill)=>s+b.amount,0);
        setStats({billCount:(bd||[]).length,reminderCount:(rd||[]).length,streakMonths:monthsSub,totalTracked:total,monthsSubscribed:monthsSub,loggedInLate:hr>=0&&hr<4,loggedInEarly:hr>=4&&hr<6,addedBillWithinHour:(bd||[]).length>0&&(Date.now()-created.getTime())<3600000,upgraded:prof.plan!=='Basic'});
      }
      const anonPref=localStorage.getItem('nyra_leaderboard_anon');
      if(anonPref!==null) setIsAnon(anonPref==='true');
    }
    load();
  },[]);

  const storedEarned:string[]=typeof window!=='undefined'?JSON.parse(localStorage.getItem('nyra_badges')||'[]'):[];
  const accessible=EARNABLE_BY_PLAN[userPlan]||EARNABLE_BY_PLAN.Basic;
  const isBadgeEarned=(b:Badge)=>storedEarned.includes(b.id)||b.check(stats);
  const earnedCount=ALL_BADGES.filter(b=>accessible.includes(b.id)&&isBadgeEarned(b)).length;
  const totalAccessible=ALL_BADGES.filter(b=>accessible.includes(b.id)).length;

  const xp=calcXP(stats,earnedCount);
  const level=getLevel(xp);
  const levelPct=getLevelProgress(xp);
  const nextLevel=getNextLevel(xp);

  const challenges=getWeeklyChallenges(stats,bills);
  const leaderboard=genLeaderboard(xp,userName,isAnon);

  const visibleBadges=activeCategory==='All'
    ? ALL_BADGES.filter(b=>accessible.includes(b.id))
    : ALL_BADGES.filter(b=>accessible.includes(b.id)&&b.category===activeCategory);

  function toggleAnon(){
    const next=!isAnon;
    setIsAnon(next);
    localStorage.setItem('nyra_leaderboard_anon',String(next));
  }

  function shareText(b:any){return `I just earned the ${b.emoji} "${b.name}" badge on Nyra — ${b.desc} Never miss a bill again 💙 nyra-nu.vercel.app`;}
  function copyShare(){navigator.clipboard.writeText(shareText(shareBadge));setCopied(true);setTimeout(()=>setCopied(false),2000);}

  const isPlus=userPlan!=='Basic';

  return(<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');
      :root{--blue:#2177d1;--blue-d:#1658a8;--blue-m:#3a8ee0;--blue-pale:rgba(33,119,209,0.08);--blue-glow:rgba(33,119,209,0.18);--gold:#c39a35;--gold-l:#d4ae52;--gold-pale:rgba(195,154,53,0.09);--bg:#eef3fb;--text:#0c1524;--text2:#3a4f6a;--muted:#7a90aa;--border:rgba(33,119,209,0.1);--success:#22c55e;--warn:#f59e0b;--danger:#ef4444;--glass:rgba(255,255,255,0.62);--glass2:rgba(255,255,255,0.80);--gb:rgba(255,255,255,0.86);--gs:0 4px 24px rgba(33,119,209,.08),0 1px 4px rgba(0,0,0,.04),inset 0 1px 0 rgba(255,255,255,.9);--gsl:0 16px 60px rgba(33,119,209,.13),0 4px 16px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.9);}
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
      /* XP HERO */
      .xp-hero{background:linear-gradient(135deg,var(--blue),var(--blue-d));border-radius:24px;padding:32px;margin-bottom:22px;position:relative;overflow:hidden;opacity:0;animation:fu .5s ease .1s forwards;}
      .xp-hero::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:28px 28px;}
      .xp-inner{position:relative;z-index:1;display:flex;align-items:center;gap:28px;}
      .xp-badge{width:80px;height:80px;border-radius:22px;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-size:2.2rem;flex-shrink:0;box-shadow:0 8px 24px rgba(0,0,0,.15);}
      .xp-info{flex:1;}
      .xp-level-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.5rem;letter-spacing:-.03em;color:white;margin-bottom:4px;}
      .xp-sub{font-size:.8rem;color:rgba(255,255,255,.7);margin-bottom:14px;}
      .xp-bar-wrap{background:rgba(255,255,255,.15);border-radius:100px;height:10px;overflow:hidden;margin-bottom:6px;}
      .xp-bar{height:100%;border-radius:100px;background:linear-gradient(90deg,rgba(255,255,255,.9),white);transition:width 1s cubic-bezier(.34,1.56,.64,1);}
      .xp-bar-labels{display:flex;justify-content:space-between;font-size:.65rem;color:rgba(255,255,255,.6);}
      .xp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-left:auto;}
      .xp-stat{background:rgba(255,255,255,.1);border-radius:14px;padding:14px 16px;text-align:center;}
      .xp-stat-val{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.3rem;color:white;}
      .xp-stat-lbl{font-size:.62rem;color:rgba(255,255,255,.6);margin-top:2px;}
      /* GRID */
      .ach-grid{display:grid;grid-template-columns:1fr 320px;gap:20px;opacity:0;animation:fu .5s ease .2s forwards;}
      .panel{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:22px;box-shadow:var(--gs);overflow:hidden;}
      .p-hd{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px;border-bottom:1px solid var(--border);}
      .p-t{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;color:var(--text);}
      .p-s{font-size:.72rem;color:var(--muted);margin-top:1px;}
      /* CATEGORY FILTER */
      .cat-filter{display:flex;gap:6px;flex-wrap:wrap;padding:14px 20px 0;}
      .cat-btn{font-size:.72rem;font-weight:500;padding:6px 14px;border-radius:100px;border:1px solid var(--border);cursor:pointer;background:transparent;color:var(--muted);transition:all .2s;}
      .cat-btn.on{background:var(--blue);color:white;border-color:var(--blue);font-weight:600;}
      .cat-btn:hover:not(.on){background:var(--blue-pale);color:var(--blue);}
      /* BADGES GRID */
      .badges-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;padding:16px 20px 20px;}
      .badge-card{background:var(--glass2);border:1px solid var(--gb);border-radius:18px;padding:16px 14px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;transition:all .25s;position:relative;}
      .badge-card:hover{box-shadow:var(--gsl);transform:translateY(-2px);}
      .badge-card.earned{border-color:rgba(195,154,53,.3);background:linear-gradient(135deg,rgba(255,255,255,.9),rgba(195,154,53,.04));}
      .badge-card.locked{opacity:.55;}
      .badge-card.upgrade{opacity:.3;cursor:default;}
      .badge-ring-wrap{position:relative;width:56px;height:56px;margin-bottom:2px;}
      .badge-emoji{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;}
      .badge-emoji.earned-bg{background:linear-gradient(135deg,var(--blue-pale),rgba(195,154,53,.08));border:2px solid rgba(195,154,53,.3);}
      .badge-emoji.locked-bg{background:rgba(122,144,170,.08);border:2px solid rgba(122,144,170,.12);filter:grayscale(1);}
      .badge-gold-ring{position:absolute;inset:-3px;border-radius:19px;border:2px solid var(--gold);box-shadow:0 0 12px rgba(195,154,53,.3);animation:rp 3s ease infinite;}
      @keyframes rp{0%,100%{box-shadow:0 0 6px rgba(195,154,53,.2);}50%{box-shadow:0 0 18px rgba(195,154,53,.45);}}
      .badge-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.78rem;color:var(--text);text-align:center;}
      .badge-desc{font-size:.62rem;color:var(--muted);text-align:center;line-height:1.4;}
      .badge-progress{width:100%;margin-top:4px;}
      .bp-bar-wrap{height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-bottom:3px;}
      .bp-bar{height:100%;border-radius:2px;transition:width .8s ease;}
      .bp-label{font-size:.58rem;color:var(--muted);text-align:center;}
      .badge-earned-tag{font-size:.58rem;font-weight:700;color:var(--gold);background:var(--gold-pale);border:1px solid rgba(195,154,53,.2);border-radius:100px;padding:2px 8px;}
      .lock-icon{position:absolute;bottom:-2px;right:-2px;width:18px;height:18px;border-radius:50%;background:var(--muted);display:flex;align-items:center;justify-content:center;font-size:.55rem;color:white;}
      /* CHALLENGES */
      .challenge-list{padding:14px 20px;}
      .challenge-item{background:var(--glass2);border:1px solid var(--gb);border-radius:16px;padding:14px 16px;margin-bottom:10px;}
      .ch-top{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
      .ch-emoji{font-size:1.3rem;flex-shrink:0;}
      .ch-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.85rem;color:var(--text);}
      .ch-desc{font-size:.68rem;color:var(--muted);margin-top:1px;}
      .ch-xp{font-size:.65rem;font-weight:700;color:var(--gold);background:var(--gold-pale);border:1px solid rgba(195,154,53,.2);border-radius:100px;padding:3px 9px;margin-left:auto;white-space:nowrap;}
      .ch-bar-wrap{height:6px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:5px;}
      .ch-bar{height:100%;background:linear-gradient(90deg,var(--blue),var(--blue-m));border-radius:3px;transition:width .8s ease;}
      .ch-progress-lbl{font-size:.62rem;color:var(--muted);}
      /* LEADERBOARD */
      .lb-list{padding:14px 20px;}
      .lb-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;margin-bottom:6px;transition:background .2s;}
      .lb-item:hover{background:rgba(33,119,209,.04);}
      .lb-item.you{background:linear-gradient(135deg,rgba(33,119,209,.08),rgba(195,154,53,.04));border:1px solid rgba(33,119,209,.15);}
      .lb-rank{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.85rem;width:26px;text-align:center;flex-shrink:0;}
      .lb-rank.gold{color:#f59e0b;}.lb-rank.silver{color:#94a3b8;}.lb-rank.bronze{color:#c39a35;}
      .lb-av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:800;color:white;flex-shrink:0;}
      .lb-name{font-size:.82rem;font-weight:600;color:var(--text);flex:1;}
      .lb-level{font-size:.62rem;color:var(--muted);}
      .lb-score{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.85rem;color:var(--blue);}
      .lb-you-tag{font-size:.58rem;font-weight:700;color:var(--blue);background:var(--blue-pale);border:1px solid rgba(33,119,209,.15);border-radius:100px;padding:2px 7px;}
      .anon-toggle{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;border-top:1px solid var(--border);font-size:.72rem;color:var(--text2);}
      .toggle-switch{width:36px;height:20px;border-radius:100px;border:none;cursor:pointer;transition:background .2s;position:relative;flex-shrink:0;}
      .toggle-knob{position:absolute;top:3px;width:14px;height:14px;border-radius:50%;background:white;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.2);}
      /* SHARE MODAL */
      .shr-overlay{position:fixed;inset:0;z-index:600;background:rgba(12,21,36,.5);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;}
      .shr-modal{background:white;border-radius:24px;padding:32px;max-width:400px;width:100%;box-shadow:0 24px 80px rgba(12,21,36,.3);animation:mpop .4s cubic-bezier(.34,1.56,.64,1);}
      @keyframes mpop{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
      .shr-card{background:linear-gradient(135deg,var(--blue),var(--blue-d));border-radius:18px;padding:28px;text-align:center;margin-bottom:18px;position:relative;overflow:hidden;}
      .shr-card::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:28px 28px;}
      .shr-inner{position:relative;z-index:1;}
      .shr-plats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
      .shr-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;border-radius:11px;border:1px solid var(--border);background:transparent;font-size:.78rem;font-weight:600;color:var(--text2);cursor:pointer;transition:all .2s;}
      .shr-btn:hover{background:var(--blue-pale);color:var(--blue);}
      .shr-copy{width:100%;padding:11px;border-radius:11px;background:var(--blue-pale);border:1px solid rgba(33,119,209,.2);color:var(--blue);font-size:.82rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;margin-bottom:8px;}
      .shr-close{width:100%;background:transparent;border:1px solid var(--border);color:var(--muted);padding:10px;border-radius:11px;font-size:.82rem;cursor:pointer;}
      @media(max-width:1100px){.ach-grid{grid-template-columns:1fr;}}
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

    {/* SIDEBAR */}
    <aside className="sb">
      <div className="sb-logo"><span className="sb-logo-txt">Nyra</span><span className="sb-gem"/></div>
      <div className="nav-lbl">Menu</div>
      <a className="ni" href="/dashboard"><span className="ni-ic">📋</span>My Bills</a>
      <a className="ni" href="/reminders"><span className="ni-ic">🔔</span>Reminders</a>
      <a className="ni on" href="/achievements"><span className="ni-ic">🏆</span>Achievements</a>
      <a className="ni" href="/learn"><span className="ni-ic">🧠</span>Learn</a>
      <a className="ni" href="/analytics"><span className="ni-ic">📊</span>Analytics</a>
      <div className="ni"><span className="ni-ic">⚙️</span>Settings</div>
      <div className="nav-lbl">Resources</div>
      <a className="ni" href="https://financialfutureseducation.com/" target="_blank" rel="noreferrer"><span className="ni-ic">🎓</span>FFE Website</a>
      <div className="sb-bot">
        <div className="plan-pill">
          <div><div className="pp-name">{userPlan} Plan</div><div className="pp-ct">{earnedCount} badges earned</div></div>
          <div className="pp-badge">Lv. {LEVELS.indexOf(level)+1}</div>
        </div>
        <div className="u-row">
          <div className="u-av">{userName[0]?.toUpperCase()}</div>
          <div><div className="u-name">{userName}</div></div>
        </div>
      </div>
    </aside>

    <main className="main">


      {/* XP HERO */}
      <div className="xp-hero">
        <div className="xp-inner">
          <div className="xp-badge">{level.emoji}</div>
          <div className="xp-info">
            <div className="xp-level-name">{level.name}</div>
            <div className="xp-sub">{xp} XP total{nextLevel?` · ${nextLevel.minXP-xp} XP until ${nextLevel.name}`:' · Max level reached!'}</div>
            <div className="xp-bar-wrap"><div className="xp-bar" style={{width:`${levelPct}%`}}/></div>
            <div className="xp-bar-labels"><span>{level.minXP} XP</span><span style={{color:'white',fontWeight:600}}>{levelPct}%</span><span>{nextLevel?nextLevel.minXP+' XP':'MAX'}</span></div>
          </div>
          <div className="xp-stats">
            <div className="xp-stat"><div className="xp-stat-val">{earnedCount}</div><div className="xp-stat-lbl">Badges earned</div></div>
            <div className="xp-stat"><div className="xp-stat-val">{stats.streakMonths}</div><div className="xp-stat-lbl">Month streak</div></div>
            <div className="xp-stat"><div className="xp-stat-val">{xp}</div><div className="xp-stat-lbl">Total XP</div></div>
          </div>
        </div>
      </div>

      <div className="ach-grid">
        <div style={{display:'flex',flexDirection:'column',gap:20}}>

          {/* BADGES */}
          <div className="panel">
            <div className="p-hd">
              <div>
                <div className="p-t">🏆 Badge Collection</div>
                <div className="p-s">{earnedCount} / {totalAccessible} earned on {userPlan}</div>
              </div>
              {!isPlus&&<button style={{background:'var(--blue)',color:'white',border:'none',padding:'6px 14px',borderRadius:100,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'.72rem',fontWeight:700,cursor:'pointer'}} onClick={()=>window.location.href='/signup?plan=Plus&price=5'}>Unlock all →</button>}
            </div>
            <div className="cat-filter">
              {['All',...CATEGORIES.filter(c=>c!=='Secret'||(c==='Secret'&&userPlan==='Power'))].map(c=>(
                <button key={c} className={`cat-btn ${activeCategory===c?'on':''}`} onClick={()=>setActiveCategory(c)}>{c}</button>
              ))}
            </div>
            <div className="badges-grid">
              {visibleBadges.map(b=>{
                const earned=isBadgeEarned(b);
                const pct=b.progressPct(stats,bills);
                return(
                  <div key={b.id} className={`badge-card ${earned?'earned':'locked'}`}
                    onClick={()=>{if(earned&&isPlus){setShareBadge(b);setShareOpen(true);}}}>
                    <div className="badge-ring-wrap">
                      <div className={`badge-emoji ${earned?'earned-bg':'locked-bg'}`}>{b.emoji}</div>
                      {earned&&<div className="badge-gold-ring"/>}
                      {!earned&&<div className="lock-icon">🔒</div>}
                    </div>
                    <div className="badge-name">{b.name}</div>
                    <div className="badge-desc">{b.desc}</div>
                    {earned?(
                      <div className="badge-earned-tag">✓ Earned</div>
                    ):(
                      <div className="badge-progress">
                        <div className="bp-bar-wrap"><div className="bp-bar" style={{width:`${pct}%`,background:pct>=100?'var(--success)':'var(--blue)'}}/></div>
                        <div className="bp-label">{b.progressLabel(stats,bills)}</div>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Locked upgrade previews for Basic */}
              {userPlan==='Basic'&&ALL_BADGES.filter(b=>!accessible.includes(b.id)).slice(0,6).map(b=>(
                <div key={b.id} className="badge-card upgrade" title="Upgrade to Plus to unlock">
                  <div className="badge-ring-wrap">
                    <div className="badge-emoji locked-bg" style={{opacity:.3}}>{b.emoji}</div>
                    <div className="lock-icon" style={{background:'var(--gold)'}}>⬆</div>
                  </div>
                  <div className="badge-name" style={{opacity:.4}}>{b.name}</div>
                  <div className="badge-desc" style={{opacity:.4}}>Plus only</div>
                </div>
              ))}
            </div>
            {!isPlus&&(
              <div style={{display:'flex',alignItems:'center',gap:12,background:'linear-gradient(135deg,rgba(33,119,209,.05),rgba(195,154,53,.03))',borderTop:'1px solid var(--border)',padding:'14px 20px',fontSize:'.76rem',color:'var(--text2)'}}>
                <span>🏆</span>
                <span><strong style={{color:'var(--blue)'}}>{ALL_BADGES.length-totalAccessible} more badges</strong> + progress tracking + social sharing on Plus</span>
                <button style={{marginLeft:'auto',background:'var(--blue)',color:'white',border:'none',padding:'7px 16px',borderRadius:100,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'.74rem',fontWeight:700,cursor:'pointer'}} onClick={()=>window.location.href='/signup?plan=Plus&price=5'}>Upgrade →</button>
              </div>
            )}
          </div>

          {/* WEEKLY CHALLENGES */}
          <div className="panel">
            <div className="p-hd">
              <div><div className="p-t">🎯 Weekly Challenges</div><div className="p-s">Resets every Monday · Complete for bonus XP</div></div>
            </div>
            <div className="challenge-list">
              {challenges.map(c=>(
                <div key={c.id} className="challenge-item">
                  <div className="ch-top">
                    <span className="ch-emoji">{c.emoji}</span>
                    <div style={{flex:1}}>
                      <div className="ch-title">{c.title}</div>
                      <div className="ch-desc">{c.desc}</div>
                    </div>
                    <div className="ch-xp">+{c.xp} XP</div>
                  </div>
                  <div className="ch-bar-wrap"><div className="ch-bar" style={{width:`${Math.min(100,(c.progress/c.total)*100)}%`}}/></div>
                  <div className="ch-progress-lbl">{c.progress}/{c.total} {c.progress>=c.total?'✅ Complete!':''}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COL */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>

          {/* LEADERBOARD */}
          <div className="panel">
            <div className="p-hd">
              <div><div className="p-t">🌍 Global Leaderboard</div><div className="p-s">XP + Money IQ + Streak combined</div></div>
            </div>
            <div className="lb-list">
              {leaderboard.map((entry,i)=>{
                const rankColor=entry.rank===1?'gold':entry.rank===2?'silver':entry.rank===3?'bronze':'';
                const avColor=entry.isYou?'linear-gradient(135deg,var(--blue),var(--blue-m))':'linear-gradient(135deg,#7a90aa,#94a3b8)';
                return(
                  <div key={i} className={`lb-item ${entry.isYou?'you':''}`}>
                    <div className={`lb-rank ${rankColor}`}>{entry.rank===1?'🥇':entry.rank===2?'🥈':entry.rank===3?'🥉':entry.rank}</div>
                    <div className="lb-av" style={{background:avColor}}>{entry.display[0]?.toUpperCase()||'?'}</div>
                    <div style={{flex:1}}>
                      <div className="lb-name">{entry.display}{entry.isYou&&<span className="lb-you-tag" style={{marginLeft:6}}>You</span>}</div>
                      <div className="lb-level">{entry.level}</div>
                    </div>
                    <div className="lb-score">{entry.score} XP</div>
                  </div>
                );
              })}
            </div>
            <div className="anon-toggle">
              <span>Show my name on leaderboard</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:'.68rem',color:'var(--muted)'}}>{isAnon?'Anonymous':'Visible'}</span>
                <div className="toggle-switch" style={{background:isAnon?'var(--border)':'var(--blue)'}} onClick={toggleAnon}>
                  <div className="toggle-knob" style={{left:isAnon?'3px':'19px'}}/>
                </div>
              </div>
            </div>
          </div>

          {/* XP breakdown */}
          <div className="panel" style={{padding:'20px 22px'}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:'.9rem',color:'var(--text)',marginBottom:14}}>⚡ How you earn XP</div>
            {[
              {emoji:'📋',action:'Add a bill',xp:'+5 XP'},
              {emoji:'📱',action:'Receive a reminder',xp:'+2 XP'},
              {emoji:'🔥',action:'Complete a streak month',xp:'+50 XP'},
              {emoji:'🏆',action:'Earn a badge',xp:'+25 XP'},
            ].map(r=>(
              <div key={r.action} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:'1rem',width:24,textAlign:'center'}}>{r.emoji}</span>
                <span style={{fontSize:'.8rem',color:'var(--text2)',flex:1}}>{r.action}</span>
                <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:'.8rem',color:'var(--blue)'}}>{r.xp}</span>
              </div>
            ))}
            <div style={{marginTop:12,fontSize:'.72rem',color:'var(--muted)',lineHeight:1.6}}>
              Your current XP: <strong style={{color:'var(--blue)'}}>{xp} XP</strong> · {nextLevel?`${nextLevel.minXP-xp} XP to ${nextLevel.name}`:'Max level! 👑'}
            </div>
          </div>

        </div>
      </div>
    </main>

    {/* SHARE MODAL */}
    {shareOpen&&shareBadge&&isPlus&&(
      <div className="shr-overlay" onClick={e=>{if(e.target===e.currentTarget)setShareOpen(false);}}>
        <div className="shr-modal">
          <div className="shr-card">
            <div className="shr-inner">
              <div style={{fontSize:'3rem',marginBottom:10}}>{shareBadge.emoji}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:'1.3rem',color:'white',marginBottom:6}}>{shareBadge.name}</div>
              <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.8)'}}>{shareBadge.desc}</div>
              <div style={{marginTop:14,fontSize:'.62rem',color:'rgba(255,255,255,.45)',letterSpacing:'.12em',textTransform:'uppercase'}}>Nyra · Never miss a bill</div>
            </div>
          </div>
          <div className="shr-plats">
            {[['📘','Facebook',`https://www.facebook.com/sharer/sharer.php?u=https://nyra-nu.vercel.app&quote=${encodeURIComponent(shareText(shareBadge))}`],['𝕏','Twitter',`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText(shareBadge))}`],['💼','LinkedIn',`https://www.linkedin.com/sharing/share-offsite/?url=https://nyra-nu.vercel.app`],['📸','Instagram','']].map(([em,nm,url])=>(
              <button key={nm} className="shr-btn" onClick={()=>{if(url)window.open(url,'_blank');else alert('Screenshot the card to share on Instagram!')}}>{em} {nm}</button>
            ))}
          </div>
          <button className="shr-copy" onClick={copyShare}>{copied?'✅ Copied!':'📋 Copy to clipboard'}</button>
          <button className="shr-close" onClick={()=>setShareOpen(false)}>Close</button>
        </div>
      </div>
    )}
  </>);
}
