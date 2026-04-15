'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface Bill { 
  id:string;
  bill_name:string;
  amount:number;
  due_date:string;
  recurring:boolean;
  remind_days_before:number;
  reminder_paused?:boolean;
  bill_type?:string;
}
interface ReminderLog { id:string;bill_name:string;amount:number;sent_at:string;message?:string; }

function daysUntil(d:string){if(!d)return 999;const t=new Date();t.setHours(0,0,0,0);return Math.ceil((new Date(d+'T00:00:00').getTime()-t.getTime())/86400000);}
function fmtDate(d:string){if(!d)return '—';return new Date(d+'T00:00:00').toLocaleDateString('en-CA',{month:'short',day:'numeric'});}
function fmtDateTime(d:string){if(!d)return '—';return new Date(d).toLocaleDateString('en-CA',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});}
function getBillEmoji(name:string,type?:string):string{
  const n=(name||'').toLowerCase();
  const t=(type||'').toLowerCase();
  if(t==='credit_card'||n.includes('visa')||n.includes('mastercard')||n.includes('amex')||n.includes('credit'))return'💳';
  if(n.includes('mom')||n.includes('dad')||n.includes('parent')||n.includes('family')||n.includes('grandma')||n.includes('grandpa'))return'👨‍👩‍👧‍👦';
  if(n.includes('rent')||n.includes('mortgage')||n.includes('housing'))return'🏠';
  if(n.includes('hydro')||n.includes('electric')||n.includes('power')||n.includes('utilit')||n.includes('gas')||n.includes('water'))return'💡';
  if(n.includes('netflix')||n.includes('spotify')||n.includes('disney')||n.includes('hulu')||n.includes('youtube')||n.includes('streaming')||n.includes('hbo')||n.includes('apple tv')||n.includes('crave'))return'📺';
  if(n.includes('phone')||n.includes('mobile')||n.includes('rogers')||n.includes('bell')||n.includes('telus')||n.includes('fido')||n.includes('koodo')||n.includes('freedom'))return'📱';
  if(n.includes('internet')||n.includes('wifi')||n.includes('broadband'))return'🌐';
  if(n.includes('insurance')||n.includes('life ins')||n.includes('health ins'))return'🛡️';
  if(n.includes('car')||n.includes('auto')||n.includes('vehicle')||n.includes('gas')||n.includes('parking'))return'🚗';
  if(n.includes('gym')||n.includes('fitness')||n.includes('workout'))return'🏋️';
  if(n.includes('loan')||n.includes('debt')||n.includes('student'))return'🏦';
  if(n.includes('grocery')||n.includes('food')||n.includes('meal'))return'🛒';
  if(n.includes('gaming')||n.includes('xbox')||n.includes('playstation')||n.includes('nintendo')||n.includes('steam'))return'🎮';
  if(n.includes('health')||n.includes('medical')||n.includes('doctor')||n.includes('prescription'))return'🏥';
  if(n.includes('pet')||n.includes('dog')||n.includes('cat')||n.includes('vet'))return'🐕';
  if(n.includes('education')||n.includes('tuition')||n.includes('school')||n.includes('course'))return'📚';
  if(n.includes('subscription')||n.includes('saas')||n.includes('software'))return'📦';
  if(n.includes('saving')||n.includes('investment')||n.includes('tfsa')||n.includes('rrsp'))return'🐷';
  if(n.includes('donation')||n.includes('charity'))return'💝';
  if(n.includes('childcare')||n.includes('daycare')||n.includes('nanny'))return'👶';
  return'📄';
}

const SIDEBAR_STYLES = `
  .sb{position:fixed;top:0;left:0;bottom:0;width:240px;z-index:50;background:var(--glass);backdrop-filter:blur(28px) saturate(2);border-right:1px solid var(--gb);display:flex;flex-direction:column;padding:24px 16px;box-shadow:4px 0 24px rgba(33,119,209,.06);}
  .sb-logo{display:flex;align-items:center;gap:8px;padding:4px 8px 24px;border-bottom:1px solid var(--border);margin-bottom:20px;text-decoration:none;}
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

export default function RemindersPage(){
  const[userName,setUserName]=useState('there');
  const[userPhone,setUserPhone]=useState('');
  const[userPlan,setUserPlan]=useState('Plus');
  const[userId,setUserId]=useState<string>('ef38b136-4454-4599-9eb8-06a4197dfed5');
  const[bills,setBills]=useState<Bill[]>([]);
  const[reminders,setReminders]=useState<ReminderLog[]>([]);
  const[loading,setLoading]=useState(true);
  const[mounted,setMounted]=useState(false);
  
  // Edit state
  const[editingBill,setEditingBill]=useState<string|null>(null);
  const[editRemind,setEditRemind]=useState('3');
  const[editRemind2,setEditRemind2]=useState('');
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState<string|null>(null);
  
  // Tab state
  const[activeTab,setActiveTab]=useState<'upcoming'|'calendar'|'history'|'settings'>('upcoming');
  
  // Bulk edit
  const[bulkOpen,setBulkOpen]=useState(false);
  const[bulkDays,setBulkDays]=useState('3');
  const[bulkSaving,setBulkSaving]=useState(false);
  
  // Test reminder
  const[testSending,setTestSending]=useState(false);
  const[testSent,setTestSent]=useState(false);
  
  // Notification preferences
  const[reminderTime,setReminderTime]=useState('09:00');
  const[smsEnabled,setSmsEnabled]=useState(true);
  const[emailEnabled,setEmailEnabled]=useState(false);
  const[prefsSaving,setPrefsSaving]=useState(false);
  const[prefsSaved,setPrefsSaved]=useState(false);
  
  // Preview modal
  const[previewBill,setPreviewBill]=useState<Bill|null>(null);
  
  // Calendar state
  const[calendarMonth,setCalendarMonth]=useState(new Date().getMonth());
  const[calendarYear,setCalendarYear]=useState(new Date().getFullYear());
  
  // AI Coach state
  const[aiCoachOpen,setAiCoachOpen]=useState(false);
  const[aiMessages,setAiMessages]=useState<{role:'user'|'nyra';text:string}[]>([
    {role:'nyra',text:"Hey! I'm Nyra, your AI reminder coach. Ask me anything about your bills, timing strategies, or what's coming up! 🔔"}
  ]);
  const[aiInput,setAiInput]=useState('');
  const[aiThinking,setAiThinking]=useState(false);

  useEffect(()=>{setMounted(true);},[]);

  useEffect(()=>{
    async function load(){
      let uid:string='ef38b136-4454-4599-9eb8-06a4197dfed5';
      const{data:{user}}=await supabase.auth.getUser();
      if(user){
        uid=user.id;
      }
      setUserId(uid);
      
      const{data:prof}=await supabase.from('profiles').select('full_name,first_name,plan,phone_number,reminder_time,sms_enabled').eq('id',uid).single();
      if(prof){
        // Use first_name if available, otherwise parse from full_name
        setUserName(prof.first_name || prof.full_name?.split(' ')[0] || 'there');
        setUserPlan(prof.plan||'Plus');
        setUserPhone(prof.phone_number||'');
        if(prof.reminder_time)setReminderTime(prof.reminder_time);
        if(typeof prof.sms_enabled==='boolean')setSmsEnabled(prof.sms_enabled);
      }
      const{data:bd}=await supabase.from('bills').select('*').eq('user_id',uid).order('due_date',{ascending:true});
      setBills((bd||[]).map(b=>({...b,bill_name:b.bill_name||'Untitled',remind_days_before:b.remind_days_before||3})));
      
      // Try to load reminder logs (table might not exist)
      try{
        const{data:rd}=await supabase.from('reminder_logs').select('*').eq('user_id',uid).order('sent_at',{ascending:false}).limit(50);
        setReminders(rd||[]);
      }catch(e){setReminders([]);}
      
      setLoading(false);
    }
    load();
  },[]);

  const isPlus=userPlan!=='Basic';
  const upcoming=useMemo(()=>bills.filter(b=>b&&b.due_date&&daysUntil(b.due_date)>=0&&daysUntil(b.due_date)<=14).sort((a,b)=>daysUntil(a.due_date)-daysUntil(b.due_date)),[bills]);
  const overdue=useMemo(()=>bills.filter(b=>b&&b.due_date&&daysUntil(b.due_date)<0).sort((a,b)=>daysUntil(a.due_date)-daysUntil(b.due_date)),[bills]);
  
  // Smart suggestions
  const lowBufferBills=useMemo(()=>bills.filter(b=>b.remind_days_before<3&&!b.reminder_paused),[bills]);
  const pausedBills=useMemo(()=>bills.filter(b=>b.reminder_paused),[bills]);
  
  // Stats
  const avgBuffer=bills.length>0?(bills.reduce((s,b)=>s+b.remind_days_before,0)/bills.length):0;
  const goodBufferCount=bills.filter(b=>b.remind_days_before>=5).length;

  function startEdit(bill:Bill){
    setEditingBill(bill.id);
    setEditRemind(String(bill.remind_days_before));
    setEditRemind2('');
  }

  async function saveEdit(bill:Bill){
    setSaving(true);
    await supabase.from('bills').update({remind_days_before:parseInt(editRemind)}).eq('id',bill.id);
    setBills(prev=>prev.map(b=>b.id===bill.id?{...b,remind_days_before:parseInt(editRemind)}:b));
    setEditingBill(null);setSaving(false);setSaved(bill.id);
    setTimeout(()=>setSaved(null),2000);
  }

  async function togglePause(bill:Bill){
    const newPaused=!bill.reminder_paused;
    await supabase.from('bills').update({reminder_paused:newPaused}).eq('id',bill.id);
    setBills(prev=>prev.map(b=>b.id===bill.id?{...b,reminder_paused:newPaused}:b));
  }

  async function bulkUpdateReminders(){
    setBulkSaving(true);
    const days=parseInt(bulkDays);
    await supabase.from('bills').update({remind_days_before:days}).eq('user_id',userId);
    setBills(prev=>prev.map(b=>({...b,remind_days_before:days})));
    setBulkSaving(false);setBulkOpen(false);
    setSaved('bulk');setTimeout(()=>setSaved(null),2000);
  }

  async function fixLowBufferBills(){
    for(const bill of lowBufferBills){
      await supabase.from('bills').update({remind_days_before:5}).eq('id',bill.id);
    }
    setBills(prev=>prev.map(b=>lowBufferBills.find(lb=>lb.id===b.id)?{...b,remind_days_before:5}:b));
    setSaved('fixed');setTimeout(()=>setSaved(null),2000);
  }

  async function sendTestReminder(){
    setTestSending(true);
    // Simulate sending - in production this would call your SMS API
    await new Promise(r=>setTimeout(r,1500));
    setTestSending(false);
    setTestSent(true);
    setTimeout(()=>setTestSent(false),3000);
  }

  async function savePreferences(){
    setPrefsSaving(true);
    await supabase.from('profiles').update({
      reminder_time:reminderTime,
      sms_enabled:smsEnabled
    }).eq('id',userId);
    setPrefsSaving(false);setPrefsSaved(true);
    setTimeout(()=>setPrefsSaved(false),2000);
  }

  // Calendar helpers
  function getCalendarDays(){
    const firstDay=new Date(calendarYear,calendarMonth,1);
    const lastDay=new Date(calendarYear,calendarMonth+1,0);
    const startPad=firstDay.getDay();
    const days:Array<{date:Date|null;bills:Bill[];reminders:Bill[]}>=[];
    
    // Padding for start
    for(let i=0;i<startPad;i++)days.push({date:null,bills:[],reminders:[]});
    
    // Actual days
    for(let d=1;d<=lastDay.getDate();d++){
      const date=new Date(calendarYear,calendarMonth,d);
      
      // Find bills due on this day
      const billsOnDay=bills.filter(b=>{
        if(!b.due_date)return false;
        const bd=new Date(b.due_date+'T00:00:00');
        // For recurring bills, check if the day of month matches
        if(b.recurring){
          return bd.getDate()===d;
        }
        // For one-time bills, check exact date
        return bd.getFullYear()===date.getFullYear()&&bd.getMonth()===date.getMonth()&&bd.getDate()===date.getDate();
      });
      
      // Find reminder fire dates (X days before due date)
      const remindersOnDay=bills.filter(b=>{
        if(!b.due_date||b.reminder_paused)return false;
        const bd=new Date(b.due_date+'T00:00:00');
        
        // For recurring bills, calculate reminder date based on day of month
        if(b.recurring){
          const dueDay=bd.getDate();
          const reminderDay=dueDay-b.remind_days_before;
          // Handle month rollover (if reminder would be in previous month)
          if(reminderDay<=0){
            // Reminder is in previous month
            if(calendarMonth===0){
              return false; // Skip for now
            }
            const prevMonthLastDay=new Date(calendarYear,calendarMonth,0).getDate();
            return (prevMonthLastDay+reminderDay)===d && calendarMonth===date.getMonth();
          }
          return reminderDay===d;
        }
        
        // For one-time bills
        const reminderDate=new Date(bd.getTime()-b.remind_days_before*86400000);
        return reminderDate.getFullYear()===date.getFullYear()&&reminderDate.getMonth()===date.getMonth()&&reminderDate.getDate()===date.getDate();
      });
      
      days.push({date,bills:billsOnDay,reminders:remindersOnDay});
    }
    return days;
  }

  const calendarDays=useMemo(()=>getCalendarDays(),[calendarMonth,calendarYear,bills]);
  const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];

  // ═══════════════════════════════════════════════════════════════
  // NYRA AI - Smart Insights Generation
  // ═══════════════════════════════════════════════════════════════
  
  // Weekly summary data
  const thisWeekBills=useMemo(()=>{
    return bills.filter(b=>{
      const d=daysUntil(b.due_date);
      return d>=0&&d<=7;
    });
  },[bills]);
  
  const thisWeekTotal=thisWeekBills.reduce((s,b)=>s+b.amount,0);
  const monthlyTotal=bills.reduce((s,b)=>s+b.amount,0);
  
  // Find next reminder firing
  const nextReminder=useMemo(()=>{
    const today=new Date();
    today.setHours(0,0,0,0);
    let closest:{bill:Bill;daysUntilReminder:number}|null=null;
    
    bills.forEach(b=>{
      if(b.reminder_paused)return;
      const dueDate=new Date(b.due_date+'T00:00:00');
      const reminderDate=new Date(dueDate.getTime()-b.remind_days_before*86400000);
      const daysUntilReminder=Math.ceil((reminderDate.getTime()-today.getTime())/86400000);
      
      if(daysUntilReminder>=0&&(!closest||daysUntilReminder<closest.daysUntilReminder)){
        closest={bill:b,daysUntilReminder};
      }
    });
    return closest;
  },[bills]);

  // ═══════════════════════════════════════════════════════════════
  // NYRA DEEP INSIGHT - Genuinely useful, non-obvious analysis
  // ═══════════════════════════════════════════════════════════════
  const nyraInsight=useMemo(()=>{
    if(bills.length===0)return null;
    
    const insights:{priority:number;text:string;subtext?:string;type:'warning'|'tip'|'insight'|'action'}[]=[];
    
    // 1. CASHFLOW TIMING RISK - Bills clustered right after typical payday
    const billsByDay:{[key:number]:Bill[]}={};
    bills.forEach(b=>{
      const day=new Date(b.due_date+'T00:00:00').getDate();
      if(!billsByDay[day])billsByDay[day]=[];
      billsByDay[day].push(b);
    });
    const firstWeekTotal=bills.filter(b=>{
      const d=new Date(b.due_date+'T00:00:00').getDate();
      return d>=1&&d<=7;
    }).reduce((s,b)=>s+b.amount,0);
    const lastWeekTotal=bills.filter(b=>{
      const d=new Date(b.due_date+'T00:00:00').getDate();
      return d>=25||d<=31;
    }).reduce((s,b)=>s+b.amount,0);
    
    if(firstWeekTotal>monthlyTotal*0.5){
      insights.push({
        priority:1,
        type:'warning',
        text:`${Math.round(firstWeekTotal/monthlyTotal*100)}% of your bills hit in the first week of the month.`,
        subtext:`That's $${firstWeekTotal.toLocaleString()} due right after rent/mortgage. Consider negotiating different due dates with providers, or setting up a buffer account.`
      });
    }
    
    // 2. REMINDER BUFFER MISMATCH - Big bills with small buffers
    const riskyBills=bills.filter(b=>b.amount>=200&&b.remind_days_before<=2);
    if(riskyBills.length>0){
      const riskiest=riskyBills.sort((a,b)=>b.amount-a.amount)[0];
      insights.push({
        priority:2,
        type:'action',
        text:`${riskiest.bill_name} is a $${riskiest.amount} bill with only ${riskiest.remind_days_before}-day notice.`,
        subtext:`High-value bills need more lead time. A missed payment this size could cost you $${Math.round(riskiest.amount*0.03)} in late fees plus credit score damage.`
      });
    }
    
    // 3. SUBSCRIPTION CREEP - Multiple small recurring bills
    const smallRecurring=bills.filter(b=>b.recurring&&b.amount<=50&&b.amount>0);
    if(smallRecurring.length>=4){
      const smallTotal=smallRecurring.reduce((s,b)=>s+b.amount,0);
      insights.push({
        priority:3,
        type:'insight',
        text:`You have ${smallRecurring.length} subscriptions under $50 totaling $${smallTotal}/month.`,
        subtext:`That's $${Math.round(smallTotal*12).toLocaleString()}/year on small recurring charges. When did you last audit which ones you actually use?`
      });
    }
    
    // 4. SAME-DAY COLLISION - Multiple bills on exact same date
    const collisions=Object.entries(billsByDay).filter(([,bs])=>bs.length>=2).sort((a,b)=>b[1].length-a[1].length);
    if(collisions.length>0){
      const[day,collidingBills]=collisions[0];
      const collisionTotal=collidingBills.reduce((s,b)=>s+b.amount,0);
      if(collisionTotal>=300){
        insights.push({
          priority:2,
          type:'tip',
          text:`${collidingBills.length} bills totaling $${collisionTotal} hit on the ${day}${['','st','nd','rd'][parseInt(day)]||'th'}.`,
          subtext:`${collidingBills.map(b=>b.bill_name).join(' + ')} all withdraw the same day. Stagger your reminder timings so you're not scrambling.`
        });
      }
    }
    
    // 5. PAYMENT VELOCITY - How fast money leaves after payday
    const next14Days=bills.filter(b=>daysUntil(b.due_date)>=0&&daysUntil(b.due_date)<=14);
    const next14Total=next14Days.reduce((s,b)=>s+b.amount,0);
    if(next14Total>=monthlyTotal*0.7&&next14Days.length>=3){
      insights.push({
        priority:1,
        type:'warning',
        text:`$${next14Total.toLocaleString()} due in the next 2 weeks — that's ${Math.round(next14Total/monthlyTotal*100)}% of your monthly bills.`,
        subtext:`Heavy payment periods need extra planning. Make sure you're not scheduling discretionary spending until these clear.`
      });
    }
    
    // 6. OPTIMIZATION OPPORTUNITY - Bills that could be consolidated
    const telecomBills=bills.filter(b=>{
      const n=b.bill_name.toLowerCase();
      return n.includes('phone')||n.includes('internet')||n.includes('rogers')||n.includes('bell')||n.includes('telus')||n.includes('mobile');
    });
    if(telecomBills.length>=2){
      const telecomTotal=telecomBills.reduce((s,b)=>s+b.amount,0);
      insights.push({
        priority:4,
        type:'tip',
        text:`You're paying ${telecomBills.length} separate telecom bills totaling $${telecomTotal}/month.`,
        subtext:`Bundling phone + internet with one provider often saves 15-20%. That's potentially $${Math.round(telecomTotal*0.15)}/month back in your pocket.`
      });
    }
    
    // 7. POSITIVE INSIGHT - Good habits
    const goodBufferBills=bills.filter(b=>b.remind_days_before>=5);
    if(goodBufferBills.length>=bills.length*0.8&&bills.length>=3){
      insights.push({
        priority:5,
        type:'insight',
        text:`${Math.round(goodBufferBills.length/bills.length*100)}% of your bills have 5+ day reminder buffers.`,
        subtext:`That's solid financial planning. You're giving yourself breathing room instead of last-minute stress.`
      });
    }
    
    // 8. CREDIT CARD TIMING
    const ccBills=bills.filter(b=>{
      const n=b.bill_name.toLowerCase();
      return n.includes('visa')||n.includes('mastercard')||n.includes('amex')||n.includes('credit');
    });
    if(ccBills.length>0){
      const ccWithShortBuffer=ccBills.filter(b=>b.remind_days_before<5);
      if(ccWithShortBuffer.length>0){
        insights.push({
          priority:2,
          type:'action',
          text:`Your ${ccWithShortBuffer[0].bill_name} has only ${ccWithShortBuffer[0].remind_days_before}-day notice.`,
          subtext:`Credit card late payments report to bureaus after 30 days and can drop your score 100+ points. Set this to 7+ days.`
        });
      }
    }
    
    // Sort by priority and return the top insight
    insights.sort((a,b)=>a.priority-b.priority);
    return insights[0]||null;
  },[bills,monthlyTotal]);

  // Smart Suggestions
  const smartSuggestions=useMemo(()=>{
    const suggestions:{type:string;icon:string;title:string;desc:string;action?:string;billId?:string;newDays?:number}[]=[];
    
    // 1. Bills with very short buffer
    const shortBuffer=bills.filter(b=>b.remind_days_before<=1&&!b.reminder_paused);
    if(shortBuffer.length>0){
      suggestions.push({
        type:'warning',
        icon:'⚠️',
        title:`${shortBuffer.length} bill${shortBuffer.length>1?'s have':' has'} only 1-day warning`,
        desc:`${shortBuffer.map(b=>b.bill_name).slice(0,3).join(', ')}${shortBuffer.length>3?` +${shortBuffer.length-3} more`:''} — that's cutting it close! I'd recommend at least 3-5 days buffer.`,
        action:'fix_buffer'
      });
    }
    
    // 2. Clustered bills (3+ in same week)
    const billsByWeek:{[key:string]:Bill[]}={};
    bills.forEach(b=>{
      const d=new Date(b.due_date+'T00:00:00');
      const weekKey=`${d.getFullYear()}-W${Math.ceil(d.getDate()/7)}`;
      if(!billsByWeek[weekKey])billsByWeek[weekKey]=[];
      billsByWeek[weekKey].push(b);
    });
    const clusteredWeeks=Object.entries(billsByWeek).filter(([,bs])=>bs.length>=3);
    if(clusteredWeeks.length>0){
      const[,clusteredBills]=clusteredWeeks[0];
      suggestions.push({
        type:'insight',
        icon:'📊',
        title:'Bill clustering detected',
        desc:`You have ${clusteredBills.length} bills due in the same week (${clusteredBills.map(b=>b.bill_name).join(', ')}). Consider spreading reminder timings to avoid overwhelm.`
      });
    }
    
    // 3. Recurring bills with no reminder set
    const noReminder=bills.filter(b=>b.recurring&&b.remind_days_before===0);
    if(noReminder.length>0){
      suggestions.push({
        type:'action',
        icon:'🔔',
        title:'Missing reminders',
        desc:`${noReminder.map(b=>b.bill_name).join(', ')} ${noReminder.length>1?'have':'has'} no reminder set. Want me to add 3-day reminders?`,
        action:'add_reminders'
      });
    }
    
    // 4. Streak recognition
    const onTimeBills=bills.filter(b=>daysUntil(b.due_date)>=0);
    if(onTimeBills.length>=5&&bills.length>=5){
      suggestions.push({
        type:'praise',
        icon:'🏆',
        title:'Payment streak!',
        desc:`Amazing! All ${bills.length} of your bills are on track. You're doing great at staying ahead of due dates!`
      });
    }
    
    // 5. Payday alignment suggestion
    const endOfMonthBills=bills.filter(b=>{
      const d=new Date(b.due_date+'T00:00:00').getDate();
      return d>=25||d<=5;
    });
    if(endOfMonthBills.length>=2){
      suggestions.push({
        type:'tip',
        icon:'💡',
        title:'End-of-month bills',
        desc:`${endOfMonthBills.length} bills are due around month-end. If your payday is mid-month, consider setting 10-14 day reminders to plan ahead.`
      });
    }
    
    // 6. Large upcoming bill
    const largeBill=thisWeekBills.find(b=>b.amount>=500);
    if(largeBill){
      suggestions.push({
        type:'alert',
        icon:'💰',
        title:'Large bill coming up',
        desc:`${largeBill.bill_name} ($${largeBill.amount.toLocaleString()}) is due ${daysUntil(largeBill.due_date)===0?'today':daysUntil(largeBill.due_date)===1?'tomorrow':`in ${daysUntil(largeBill.due_date)} days`}. Make sure you have funds ready!`
      });
    }
    
    return suggestions.slice(0,4); // Max 4 suggestions
  },[bills,thisWeekBills]);

  // Bill pattern insights
  const patternInsights=useMemo(()=>{
    const insights:{icon:string;text:string}[]=[];
    
    // Average reminder buffer
    if(bills.length>0){
      const avgBuffer=(bills.reduce((s,b)=>s+b.remind_days_before,0)/bills.length).toFixed(1);
      if(parseFloat(avgBuffer)<3){
        insights.push({icon:'⏰',text:`Your average reminder buffer is ${avgBuffer} days — consider increasing to 5+ days for more breathing room.`});
      }else if(parseFloat(avgBuffer)>=5){
        insights.push({icon:'✅',text:`Great job! Your average ${avgBuffer}-day buffer gives you plenty of time to prepare.`});
      }
    }
    
    // Most expensive day
    const dayTotals:{[key:number]:number}={};
    bills.forEach(b=>{
      const day=new Date(b.due_date+'T00:00:00').getDate();
      dayTotals[day]=(dayTotals[day]||0)+b.amount;
    });
    const maxDay=Object.entries(dayTotals).sort((a,b)=>b[1]-a[1])[0];
    if(maxDay&&maxDay[1]>200){
      insights.push({icon:'📅',text:`The ${maxDay[0]}${['','st','nd','rd'][parseInt(maxDay[0])]||'th'} is your biggest bill day ($${maxDay[1].toLocaleString()}).`});
    }
    
    // Recurring vs one-time
    const recurring=bills.filter(b=>b.recurring).length;
    const oneTime=bills.length-recurring;
    if(bills.length>0){
      insights.push({icon:'🔄',text:`${recurring} recurring bill${recurring!==1?'s':''}, ${oneTime} one-time payment${oneTime!==1?'s':''}.`});
    }
    
    // Paused reminders
    const paused=bills.filter(b=>b.reminder_paused).length;
    if(paused>0){
      insights.push({icon:'🔕',text:`${paused} reminder${paused!==1?'s':''} currently paused — don't forget about ${paused===1?'it':'them'}!`});
    }
    
    return insights;
  },[bills]);

  // Predictive alerts
  const predictiveAlerts=useMemo(()=>{
    const alerts:{severity:'info'|'warning'|'danger';icon:string;title:string;desc:string}[]=[];
    
    // Heavy week ahead
    const next7DaysTotal=thisWeekBills.reduce((s,b)=>s+b.amount,0);
    if(next7DaysTotal>1000){
      alerts.push({
        severity:'warning',
        icon:'📈',
        title:'Heavy week ahead',
        desc:`$${next7DaysTotal.toLocaleString()} in bills due this week across ${thisWeekBills.length} payments.`
      });
    }
    
    // Multiple bills same day
    const billsByDay:{[key:string]:Bill[]}={};
    bills.filter(b=>daysUntil(b.due_date)>=0&&daysUntil(b.due_date)<=14).forEach(b=>{
      if(!billsByDay[b.due_date])billsByDay[b.due_date]=[];
      billsByDay[b.due_date].push(b);
    });
    Object.entries(billsByDay).forEach(([date,bs])=>{
      if(bs.length>=2){
        const d=daysUntil(date);
        alerts.push({
          severity:'info',
          icon:'📋',
          title:`${bs.length} bills on ${fmtDate(date)}`,
          desc:`${bs.map(b=>b.bill_name).join(' + ')} = $${bs.reduce((s,b)=>s+b.amount,0).toLocaleString()} total${d<=3?' — coming up soon!':''}`
        });
      }
    });
    
    return alerts.slice(0,3);
  },[bills,thisWeekBills]);

  // AI Coach response generator
  function generateAIResponse(question:string):string{
    const q=question.toLowerCase();
    
    // Week summary
    if(q.includes('this week')||q.includes('coming up')||q.includes('what\'s due')){
      if(thisWeekBills.length===0)return "You're all clear this week! 🎉 No bills due in the next 7 days.";
      return `This week you have ${thisWeekBills.length} bill${thisWeekBills.length>1?'s':''} totaling $${thisWeekTotal.toLocaleString()}:\n\n${thisWeekBills.map(b=>`• ${b.bill_name}: $${b.amount} (${daysUntil(b.due_date)===0?'today':daysUntil(b.due_date)===1?'tomorrow':`in ${daysUntil(b.due_date)} days`})`).join('\n')}\n\nWant me to help you prioritize these?`;
    }
    
    // Priority question
    if(q.includes('priorit')||q.includes('most important')||q.includes('first')){
      const sorted=[...thisWeekBills].sort((a,b)=>b.amount-a.amount);
      if(sorted.length===0)return "No bills due soon, so you're in good shape! Focus on building that emergency fund. 💪";
      return `Here's my priority order for this week:\n\n${sorted.map((b,i)=>`${i+1}. ${b.bill_name} ($${b.amount}) — ${b.amount>=500?'High amount, pay first!':b.amount>=100?'Medium priority':'Lower priority'}`).join('\n')}\n\nAlways prioritize rent/mortgage and utilities first, then credit cards to protect your score!`;
    }
    
    // Reminder timing advice
    if(q.includes('reminder')||q.includes('timing')||q.includes('when should')||q.includes('days before')){
      return `Great question! Here's my reminder timing advice:\n\n• 🏠 Rent/Mortgage: 7-10 days (biggest impact)\n• 💳 Credit Cards: 5-7 days (protects credit score)\n• 💡 Utilities: 3-5 days\n• 📺 Subscriptions: 1-3 days\n\nYour average buffer is ${avgBuffer.toFixed(1)} days. ${avgBuffer<3?'I\'d recommend increasing that!':'That\'s solid!'}\n\nWant me to optimize all your reminders at once?`;
    }
    
    // Busiest time
    if(q.includes('busiest')||q.includes('most bills')||q.includes('heavy')){
      const dayTotals:{[key:number]:{count:number;total:number}}={};
      bills.forEach(b=>{
        const day=new Date(b.due_date+'T00:00:00').getDate();
        if(!dayTotals[day])dayTotals[day]={count:0,total:0};
        dayTotals[day].count++;
        dayTotals[day].total+=b.amount;
      });
      const busiest=Object.entries(dayTotals).sort((a,b)=>b[1].total-a[1].total)[0];
      if(busiest){
        return `Your busiest bill day is the ${busiest[0]}${['','st','nd','rd'][parseInt(busiest[0])]||'th'} of the month:\n\n• ${busiest[1].count} bill${busiest[1].count>1?'s':''}\n• $${busiest[1].total.toLocaleString()} total\n\nConsider setting reminders 7+ days early for these to avoid stress!`;
      }
      return "I don't see enough bill data yet to identify your busiest period. Add more bills and I'll analyze the pattern!";
    }
    
    // Savings/tips
    if(q.includes('save')||q.includes('tip')||q.includes('advice')||q.includes('help')){
      return `Here are my top reminder tips:\n\n💡 **Buffer Strategy**: Set reminders 5-7 days before, not 1-2. This gives you time to move money.\n\n📱 **Batch Similar Bills**: If you have multiple subscriptions, consider making them due the same day for easier tracking.\n\n🔔 **Double Reminder**: For big bills ($500+), use a 7-day AND 3-day reminder.\n\n⏰ **Morning Reminders**: Set reminder time to 9 AM — you'll see it before the day gets busy.\n\nWant me to apply any of these to your bills?`;
    }
    
    // Total/summary
    if(q.includes('total')||q.includes('how much')||q.includes('spending')){
      const monthlyTotal=bills.reduce((s,b)=>s+b.amount,0);
      return `Here's your bill breakdown:\n\n📊 **Monthly Total**: $${monthlyTotal.toLocaleString()}\n📅 **This Week**: $${thisWeekTotal.toLocaleString()} (${thisWeekBills.length} bills)\n🔄 **Recurring**: ${bills.filter(b=>b.recurring).length} bills\n\nYour biggest bills are: ${[...bills].sort((a,b)=>b.amount-a.amount).slice(0,3).map(b=>`${b.bill_name} ($${b.amount})`).join(', ')}`;
    }
    
    // Default helpful response
    return `I can help you with:\n\n• "What's due this week?" — See upcoming bills\n• "What should I prioritize?" — Get payment order\n• "When should I set reminders?" — Timing advice\n• "What's my busiest bill day?" — Pattern analysis\n• "How much am I spending?" — Bill totals\n\nOr ask me anything about your ${bills.length} bills! 🔔`;
  }

  function handleAISubmit(){
    if(!aiInput.trim())return;
    const userMsg=aiInput.trim();
    setAiMessages(prev=>[...prev,{role:'user',text:userMsg}]);
    setAiInput('');
    setAiThinking(true);
    
    // Simulate AI thinking
    setTimeout(()=>{
      const response=generateAIResponse(userMsg);
      setAiMessages(prev=>[...prev,{role:'nyra',text:response}]);
      setAiThinking(false);
    },800);
  }

  if(!mounted)return null;

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
      .main{margin-left:240px;padding:28px 32px;min-height:100vh;position:relative;z-index:1;}
      @keyframes fu{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
      .page-header{margin-bottom:28px;opacity:0;animation:fu .5s ease .1s forwards;}
      .page-eyebrow{font-size:.62rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);margin-bottom:8px;}
      .page-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:2rem;letter-spacing:-.04em;color:var(--text);margin-bottom:6px;}
      .page-sub{font-size:.88rem;color:var(--text2);line-height:1.7;max-width:600px;}
      
      /* Quick actions bar */
      .quick-bar{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;opacity:0;animation:fu .5s ease .15s forwards;}
      .qb-btn{display:flex;align-items:center;gap:8px;padding:10px 16px;background:white;border:1px solid var(--border);border-radius:12px;font-size:.8rem;font-weight:600;color:var(--text);cursor:pointer;transition:all .2s;}
      .qb-btn:hover{border-color:var(--blue);color:var(--blue);background:var(--blue-pale);}
      .qb-btn.primary{background:var(--blue);color:white;border-color:var(--blue);}
      .qb-btn.primary:hover{background:var(--blue-d);}
      .qb-btn.success{background:var(--success);color:white;border-color:var(--success);}
      .qb-btn.warn{background:rgba(245,158,11,.1);color:#b45309;border-color:rgba(245,158,11,.3);}
      .qb-btn.warn:hover{background:rgba(245,158,11,.2);}
      
      /* Dashboard grid */
      .dash-grid{display:grid;grid-template-columns:1fr 380px;gap:20px;opacity:0;animation:fu .5s ease .2s forwards;}
      @media(max-width:1100px){.dash-grid{grid-template-columns:1fr;}}
      
      .panel{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:22px;box-shadow:var(--gs);overflow:hidden;}
      .p-hd{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 0;}
      .p-t{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1rem;color:var(--text);}
      .p-s{font-size:.72rem;color:var(--muted);margin-top:2px;}
      
      /* Tabs */
      .tab-row{display:flex;gap:6px;padding:16px 24px 0;border-bottom:1px solid var(--border);margin-bottom:0;}
      .tab{padding:10px 16px;font-size:.78rem;font-weight:600;color:var(--muted);background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .2s;}
      .tab:hover{color:var(--text);}
      .tab.on{color:var(--blue);border-bottom-color:var(--blue);}
      
      /* Upcoming list */
      .upcoming-list{padding:16px 20px 20px;}
      .up-card{background:white;border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:12px;transition:all .2s;}
      .up-card:hover{border-color:var(--blue);box-shadow:0 4px 16px rgba(33,119,209,.08);}
      .up-card.paused{opacity:.6;background:var(--bg);}
      .up-card-top{display:flex;align-items:center;gap:14px;}
      .up-emoji{width:44px;height:44px;border-radius:12px;background:var(--blue-pale);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;}
      .up-countdown{width:52px;height:52px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;}
      .up-days-num{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.3rem;line-height:1;}
      .up-days-lbl{font-size:.55rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-top:2px;}
      .up-info{flex:1;min-width:0;}
      .up-bill-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.92rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .up-bill-sub{font-size:.72rem;color:var(--muted);margin-top:2px;}
      .up-bill-amt{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1rem;color:var(--text);flex-shrink:0;}
      
      .up-remind-row{display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);}
      .up-remind-txt{font-size:.75rem;color:var(--text2);display:flex;align-items:center;gap:6px;}
      .up-remind-txt strong{color:var(--text);}
      .up-actions{display:flex;gap:6px;}
      .up-btn{padding:6px 12px;font-size:.7rem;font-weight:600;border-radius:8px;border:1px solid var(--border);background:white;color:var(--text2);cursor:pointer;transition:all .2s;}
      .up-btn:hover{border-color:var(--blue);color:var(--blue);}
      .up-btn.pause{color:var(--warn);}
      .up-btn.pause:hover{background:rgba(245,158,11,.1);border-color:var(--warn);}
      .up-btn.resume{color:var(--success);}
      .up-btn.preview{color:var(--blue);}
      .saved-badge{font-size:.7rem;font-weight:600;color:var(--success);background:rgba(34,197,94,.1);padding:4px 10px;border-radius:100px;}
      
      /* Edit row */
      .edit-row{margin-top:14px;padding:14px;background:var(--bg);border-radius:12px;}
      .edit-row-label{font-size:.7rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;}
      .edit-selects{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;}
      .edit-select-wrap{display:flex;flex-direction:column;gap:4px;}
      .edit-select-wrap label{font-size:.65rem;font-weight:600;color:var(--muted);}
      .edit-select-wrap select{padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:.8rem;background:white;color:var(--text);outline:none;cursor:pointer;}
      .edit-select-wrap select:focus{border-color:var(--blue);}
      .edit-save-btn{padding:8px 16px;background:var(--blue);color:white;border:none;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;}
      .edit-save-btn:disabled{opacity:.5;cursor:not-allowed;}
      .edit-cancel{padding:8px 12px;background:none;border:none;font-size:.78rem;color:var(--muted);cursor:pointer;}
      .edit-cancel:hover{color:var(--danger);}
      .plus-lock{padding:8px 12px;background:var(--gold-pale);border:1px solid rgba(195,154,53,.2);border-radius:8px;font-size:.72rem;color:var(--gold);cursor:pointer;}
      .plus-lock:hover{background:rgba(195,154,53,.15);}
      
      /* Empty state */
      .empty{padding:48px 24px;text-align:center;}
      .empty-ic{font-size:2.5rem;margin-bottom:12px;}
      .empty-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1rem;color:var(--text);margin-bottom:6px;}
      .empty-s{font-size:.82rem;color:var(--muted);line-height:1.7;max-width:280px;margin:0 auto;}
      
      /* Calendar */
      .calendar-wrap{padding:16px 20px 20px;}
      .cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
      .cal-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1rem;color:var(--text);}
      .cal-nav{display:flex;gap:6px;}
      .cal-nav button{width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:white;cursor:pointer;font-size:.9rem;transition:all .2s;}
      .cal-nav button:hover{border-color:var(--blue);color:var(--blue);}
      .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
      .cal-day-header{font-size:.6rem;font-weight:700;color:var(--muted);text-transform:uppercase;text-align:center;padding:8px 0;}
      .cal-day{min-height:70px;border:1px solid var(--border);border-radius:10px;padding:6px;background:white;cursor:pointer;transition:all .2s;position:relative;}
      .cal-day:hover{border-color:var(--blue);}
      .cal-day.empty{background:var(--bg);border-color:transparent;cursor:default;}
      .cal-day.today{border-color:var(--blue);background:var(--blue-pale);}
      .cal-day-num{font-size:.72rem;font-weight:600;color:var(--text);margin-bottom:4px;}
      .cal-dots{display:flex;flex-wrap:wrap;gap:2px;}
      .cal-dot{width:8px;height:8px;border-radius:50%;display:inline-block;}
      .cal-dot.bill{background:var(--danger);}
      .cal-dot.reminder{background:var(--blue);}
      .cal-count{font-size:.6rem;color:var(--muted);margin-top:2px;}
      .cal-legend{display:flex;gap:16px;margin-top:14px;justify-content:center;}
      .cal-legend-item{display:flex;align-items:center;gap:6px;font-size:.7rem;color:var(--muted);}
      
      /* History */
      .history-list{padding:16px 20px 20px;max-height:500px;overflow-y:auto;}
      .hist-item{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--border);}
      .hist-item:last-child{border-bottom:none;}
      .hist-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--blue-m));display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;font-size:.7rem;font-weight:800;color:white;flex-shrink:0;}
      .hist-msg{font-size:.82rem;color:var(--text);line-height:1.5;}
      .hist-time{font-size:.68rem;color:var(--muted);margin-top:3px;}
      .hist-amt{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--text);flex-shrink:0;}
      
      /* Settings tab */
      .settings-content{padding:20px 24px;}
      .setting-section{margin-bottom:24px;}
      .setting-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.9rem;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:8px;}
      .setting-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);}
      .setting-row:last-child{border-bottom:none;}
      .setting-label{font-size:.84rem;color:var(--text);}
      .setting-desc{font-size:.72rem;color:var(--muted);margin-top:2px;}
      .setting-input{padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:.84rem;background:white;outline:none;}
      .setting-input:focus{border-color:var(--blue);}
      
      /* Toggle switch */
      .toggle{position:relative;width:44px;height:24px;background:var(--border);border-radius:100px;cursor:pointer;transition:background .2s;}
      .toggle.on{background:var(--success);}
      .toggle::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;background:white;border-radius:50%;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
      .toggle.on::after{transform:translateX(20px);}
      
      /* Right column */
      .rcol{display:flex;flex-direction:column;gap:16px;}
      
      /* Stats cards */
      .stat-cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:16px 20px 20px;}
      .stat-card{background:white;border:1px solid var(--border);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;}
      .stat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;}
      .stat-val{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.1rem;color:var(--text);}
      .stat-lbl{font-size:.68rem;color:var(--muted);margin-top:1px;}
      
      /* Suggestion card */
      .suggest-card{padding:18px 20px;border-bottom:1px solid var(--border);}
      .suggest-card:last-child{border-bottom:none;}
      .suggest-hd{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
      .suggest-ic{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1rem;}
      .suggest-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.85rem;color:var(--text);}
      .suggest-desc{font-size:.78rem;color:var(--text2);line-height:1.7;margin-bottom:10px;}
      .suggest-btn{padding:8px 14px;background:var(--blue);color:white;border:none;border-radius:8px;font-size:.75rem;font-weight:600;cursor:pointer;}
      .suggest-btn:hover{background:var(--blue-d);}
      .suggest-btn.outline{background:transparent;border:1px solid var(--border);color:var(--text2);}
      .suggest-btn.outline:hover{border-color:var(--blue);color:var(--blue);}
      
      /* Preview modal */
      .modal-overlay{position:fixed;inset:0;background:rgba(12,21,36,.5);backdrop-filter:blur(4px);z-index:999;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease;}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      .modal{background:white;border-radius:24px;width:100%;max-width:420px;box-shadow:0 24px 80px rgba(12,21,36,.25);animation:modalPop .3s cubic-bezier(.34,1.56,.64,1);}
      @keyframes modalPop{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
      .modal-hd{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--border);}
      .modal-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1rem;color:var(--text);}
      .modal-close{width:32px;height:32px;border-radius:8px;border:none;background:var(--bg);cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center;}
      .modal-close:hover{background:var(--border);}
      .modal-body{padding:24px;}
      
      /* Phone preview */
      .phone-preview{background:#1a1a1a;border-radius:24px;padding:16px;max-width:280px;margin:0 auto;}
      .phone-notch{width:80px;height:6px;background:#333;border-radius:10px;margin:0 auto 16px;}
      .phone-msg{background:#2a2a2a;border-radius:16px;padding:14px;margin-bottom:8px;}
      .phone-msg-from{font-size:.6rem;color:#888;margin-bottom:6px;}
      .phone-msg-text{font-size:.85rem;color:#fff;line-height:1.6;}
      .phone-time{text-align:center;font-size:.6rem;color:#666;margin-top:12px;}
      
      /* Bulk modal */
      .bulk-modal{padding:24px;}
      .bulk-desc{font-size:.84rem;color:var(--text2);line-height:1.7;margin-bottom:16px;}
      .bulk-select{width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:.9rem;margin-bottom:16px;}
      .bulk-actions{display:flex;gap:10px;justify-content:flex-end;}
      
      /* Tip panel */
      .tip-panel{padding:20px 22px;}
      .tip-label{font-size:.68rem;font-weight:700;color:var(--gold);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
      .tip-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.9rem;color:var(--text);margin-bottom:6px;}
      .tip-desc{font-size:.78rem;color:var(--text2);line-height:1.75;}
      
      /* Overdue banner */
      .overdue-banner{background:linear-gradient(135deg,rgba(239,68,68,.08),rgba(239,68,68,.04));border:1px solid rgba(239,68,68,.2);border-radius:16px;padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;gap:14px;}
      .overdue-ic{width:44px;height:44px;border-radius:12px;background:rgba(239,68,68,.15);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;}
      .overdue-info{flex:1;}
      .overdue-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.9rem;color:var(--danger);}
      .overdue-desc{font-size:.78rem;color:var(--text2);margin-top:2px;}
      
      /* Nyra AI Card - Deep insight design */
      .nyra-card{display:flex;align-items:flex-start;gap:16px;background:white;border:1px solid var(--border);border-radius:16px;padding:20px 24px;margin-bottom:20px;opacity:0;animation:fu .5s ease .12s forwards;}
      .nyra-card.warning{background:linear-gradient(135deg,rgba(245,158,11,.04),rgba(245,158,11,.02));border-color:rgba(245,158,11,.2);}
      .nyra-card.action{background:linear-gradient(135deg,rgba(239,68,68,.04),rgba(239,68,68,.02));border-color:rgba(239,68,68,.15);}
      .nyra-card.tip{background:linear-gradient(135deg,rgba(33,119,209,.04),rgba(99,102,241,.02));border-color:rgba(33,119,209,.15);}
      .nyra-card.insight{background:linear-gradient(135deg,rgba(34,197,94,.04),rgba(34,197,94,.02));border-color:rgba(34,197,94,.15);}
      .nyra-avatar{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--blue),#6366f1);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(33,119,209,.2);}
      .nyra-avatar span{color:white;font-size:1.2rem;font-weight:700;}
      .nyra-content{flex:1;min-width:0;}
      .nyra-insight{font-family:'Plus Jakarta Sans',sans-serif;font-size:.95rem;font-weight:600;color:var(--text);line-height:1.5;margin-bottom:6px;}
      .nyra-subtext{font-size:.82rem;color:var(--text2);line-height:1.65;}
      .nyra-ask{padding:10px 18px;background:var(--blue);color:white;border:none;border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;align-self:flex-start;margin-top:4px;}
      .nyra-ask:hover{background:var(--blue-d);transform:translateY(-1px);}
      
      /* Cleaner insight cards */
      .insight-section{padding:16px 20px;}
      .insight-item{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--border);}
      .insight-item:last-child{border-bottom:none;}
      .insight-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;}
      .insight-icon.warn{background:rgba(245,158,11,.1);}
      .insight-icon.info{background:var(--blue-pale);}
      .insight-icon.success{background:rgba(34,197,94,.1);}
      .insight-content{flex:1;}
      .insight-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:.85rem;color:var(--text);margin-bottom:2px;}
      .insight-desc{font-size:.78rem;color:var(--text2);line-height:1.6;}
      .insight-action{margin-top:8px;}
      .insight-btn{padding:6px 12px;background:var(--blue);color:white;border:none;border-radius:6px;font-size:.72rem;font-weight:600;cursor:pointer;}
      
      /* AI Coach Floating Button */
      .ai-fab{position:fixed;bottom:28px;right:28px;z-index:999;}
      .ai-fab-btn{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,var(--blue),#6366f1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;font-size:1.3rem;font-weight:700;box-shadow:0 8px 24px rgba(33,119,209,.3);transition:all .2s;}
      .ai-fab-btn:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(33,119,209,.4);}
      
      /* AI Coach Panel - Clean chat interface */
      .ai-panel{position:fixed;bottom:96px;right:28px;width:380px;max-height:500px;background:white;border-radius:20px;box-shadow:0 20px 60px rgba(12,21,36,.2);z-index:998;display:flex;flex-direction:column;animation:panelUp .25s ease;}
      @keyframes panelUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      .ai-panel-header{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--border);}
      .ai-panel-avatar{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--blue),#6366f1);display:flex;align-items:center;justify-content:center;color:white;font-size:1rem;font-weight:700;}
      .ai-panel-info{flex:1;}
      .ai-panel-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--text);}
      .ai-panel-status{font-size:.65rem;color:var(--success);font-weight:500;}
      .ai-panel-close{width:28px;height:28px;border-radius:8px;border:none;background:transparent;cursor:pointer;font-size:.85rem;color:var(--muted);display:flex;align-items:center;justify-content:center;}
      .ai-panel-close:hover{background:var(--bg);color:var(--text);}
      
      .ai-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;min-height:220px;max-height:300px;}
      .ai-msg{max-width:85%;padding:12px 16px;border-radius:16px;font-size:.82rem;line-height:1.6;white-space:pre-wrap;}
      .ai-msg.nyra{background:var(--bg);color:var(--text2);border-radius:4px 16px 16px 16px;align-self:flex-start;}
      .ai-msg.user{background:var(--blue);color:white;border-radius:16px 16px 4px 16px;align-self:flex-end;}
      .ai-typing{display:flex;gap:4px;padding:12px 16px;align-self:flex-start;}
      .ai-typing span{width:6px;height:6px;border-radius:50%;background:var(--muted);animation:typing .8s ease infinite;}
      .ai-typing span:nth-child(2){animation-delay:.15s;}
      .ai-typing span:nth-child(3){animation-delay:.3s;}
      @keyframes typing{0%,60%,100%{opacity:.4;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}
      
      .ai-prompts{display:flex;gap:6px;padding:0 16px 12px;overflow-x:auto;}
      .ai-prompts::-webkit-scrollbar{display:none;}
      .ai-prompt{padding:8px 14px;background:var(--bg);border:none;border-radius:100px;font-size:.72rem;font-weight:500;color:var(--text2);cursor:pointer;white-space:nowrap;transition:all .2s;}
      .ai-prompt:hover{background:var(--blue-pale);color:var(--blue);}
      
      .ai-input-row{display:flex;gap:8px;padding:12px 16px;border-top:1px solid var(--border);}
      .ai-input{flex:1;background:var(--bg);border:none;border-radius:100px;padding:10px 16px;font-size:.82rem;color:var(--text);outline:none;}
      .ai-input::placeholder{color:var(--muted);}
      .ai-send{width:36px;height:36px;border-radius:50%;background:var(--blue);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;font-size:.9rem;transition:background .2s;}
      .ai-send:hover{background:var(--blue-d);}
      .ai-send:disabled{background:var(--border);cursor:not-allowed;}
      
      /* Mobile responsive */
      @media(max-width:900px){
        .sb{display:none;}
        .main{margin-left:0;padding:20px 16px;}
        .dash-grid{grid-template-columns:1fr;}
        .stat-cards{grid-template-columns:1fr;}
        .nyra-card{flex-direction:column;text-align:center;gap:12px;}
        .nyra-ask{width:100%;}
        .ai-panel{right:16px;left:16px;width:auto;bottom:88px;}
        .ai-fab{bottom:20px;right:20px;}
      }
    `}</style>

    <div className="blob b1"/><div className="blob b2"/>

    <aside className="sb">
      <a href="/dashboard" className="sb-logo" style={{textDecoration:"none"}}><span className="sb-logo-txt">Nyra</span><span className="sb-gem"/></a>
      <div className="nav-lbl">Menu</div>
      <a className="ni" href="/dashboard"><span className="ni-ic">📋</span>My Bills</a>
      <a className="ni on" href="/reminders"><span className="ni-ic">🔔</span>Reminders</a>
      <a className="ni" href="/learn"><span className="ni-ic">🧠</span>Learn</a>
      <a className="ni" href="/achievements"><span className="ni-ic">🏆</span>Achievements</a>
      <a className="ni" href="/analytics"><span className="ni-ic">📊</span>Analytics</a>
      <a className="ni" href="/settings"><span className="ni-ic">⚙️</span>Settings</a>
      <div className="nav-lbl">Resources</div>
      <a className="ni" href="https://financialfutureseducation.com/" target="_blank" rel="noreferrer"><span className="ni-ic">🎓</span>FFE Website</a>
      <div className="sb-bot">
        <div className="plan-pill">
          <div><div className="pp-name">{userPlan} Plan</div><div className="pp-ct">Reminders</div></div>
          <div className="pp-badge">Active</div>
        </div>
        <div className="u-row">
          <div className="u-av">{userName[0]?.toUpperCase()}</div>
          <div><div className="u-name">{userName}</div></div>
        </div>
      </div>
    </aside>

    <main className="main">
      <div className="page-header">
        <div className="page-eyebrow">Reminder management</div>
        <div className="page-title">🔔 Reminders</div>
        <div className="page-sub">See what's coming up, customize your timing, preview messages, and review every notification Nyra has sent you.</div>
      </div>

      {/* Nyra AI Insight - Deep analysis card */}
      {bills.length>0&&nyraInsight&&(
        <div className={`nyra-card ${nyraInsight.type}`}>
          <div className="nyra-avatar">
            <span>✦</span>
          </div>
          <div className="nyra-content">
            <div className="nyra-insight">{nyraInsight.text}</div>
            {nyraInsight.subtext&&(
              <div className="nyra-subtext">{nyraInsight.subtext}</div>
            )}
          </div>
          <button className="nyra-ask" onClick={()=>setAiCoachOpen(true)}>
            Ask Nyra
          </button>
        </div>
      )}

      {/* Fallback if no deep insight but has bills */}
      {bills.length>0&&!nyraInsight&&(
        <div className="nyra-card">
          <div className="nyra-avatar">
            <span>✦</span>
          </div>
          <div className="nyra-content">
            <div className="nyra-insight">Your bill setup looks solid, {userName}.</div>
            <div className="nyra-subtext">
              {bills.length} bills tracked, ${monthlyTotal.toLocaleString()}/month. 
              {avgBuffer>=5?` Average ${avgBuffer.toFixed(0)}-day reminder buffer gives you good breathing room.`:` Consider increasing your reminder buffers for more planning time.`}
            </div>
          </div>
          <button className="nyra-ask" onClick={()=>setAiCoachOpen(true)}>
            Ask Nyra
          </button>
        </div>
      )}

      <div className="dash-grid">
        <div>
          {/* Overdue banner */}
          {overdue.length>0&&(
            <div className="overdue-banner">
              <div className="overdue-ic">⚠️</div>
              <div className="overdue-info">
                <div className="overdue-title">{overdue.length} Overdue Bill{overdue.length>1?'s':''}</div>
                <div className="overdue-desc">{overdue.map(b=>b.bill_name).join(', ')} — mark as paid in your dashboard</div>
              </div>
            </div>
          )}

          {/* Main panel with tabs */}
          <div className="panel">
            <div className="tab-row">
              <button className={`tab ${activeTab==='upcoming'?'on':''}`} onClick={()=>setActiveTab('upcoming')}>📅 Upcoming ({upcoming.length})</button>
              <button className={`tab ${activeTab==='calendar'?'on':''}`} onClick={()=>setActiveTab('calendar')}>🗓️ Calendar</button>
              <button className={`tab ${activeTab==='history'?'on':''}`} onClick={()=>setActiveTab('history')}>📜 History ({reminders.length})</button>
              <button className={`tab ${activeTab==='settings'?'on':''}`} onClick={()=>setActiveTab('settings')}>⚙️ Settings</button>
            </div>

            {/* UPCOMING TAB */}
            {activeTab==='upcoming'&&(
              <div className="upcoming-list">
                {loading?(
                  <div className="empty"><div className="empty-ic">⏳</div><div className="empty-h">Loading...</div></div>
                ):upcoming.length===0?(
                  <div className="empty">
                    <div className="empty-ic">🎉</div>
                    <div className="empty-h">Nothing due in the next 14 days!</div>
                    <div className="empty-s">You're all clear. Nyra will text you when something's coming up.</div>
                  </div>
                ):upcoming.map(bill=>{
                  const d=daysUntil(bill.due_date);
                  const isEditing=editingBill===bill.id;
                  const isPaused=bill.reminder_paused;
                  const color=d<=2?'var(--danger)':d<=5?'var(--warn)':'var(--blue)';
                  const bgColor=d<=2?'rgba(239,68,68,.08)':d<=5?'rgba(245,158,11,.08)':'var(--blue-pale)';
                  const reminderDate=new Date(new Date(bill.due_date+'T00:00:00').getTime()-bill.remind_days_before*86400000);
                  
                  return(
                    <div key={bill.id} className={`up-card${isPaused?' paused':''}`}>
                      <div className="up-card-top">
                        <div className="up-emoji">{getBillEmoji(bill.bill_name,bill.bill_type)}</div>
                        <div className="up-countdown" style={{background:bgColor}}>
                          <div className="up-days-num" style={{color}}>{d===0?'📅':d}</div>
                          <div className="up-days-lbl" style={{color}}>{d===0?'today':d===1?'day':'days'}</div>
                        </div>
                        <div className="up-info">
                          <div className="up-bill-name">{bill.bill_name}{isPaused?' (Paused)':''}</div>
                          <div className="up-bill-sub">{bill.recurring?'Recurring':'One-time'} · Due {fmtDate(bill.due_date)}</div>
                        </div>
                        <div className="up-bill-amt">${bill.amount.toLocaleString()}</div>
                      </div>
                      
                      <div className="up-remind-row">
                        <div className="up-remind-txt">
                          {isPaused?(
                            <span style={{color:'var(--warn)'}}>🔕 Reminders paused</span>
                          ):(
                            <>📱 Reminder: <strong>{bill.remind_days_before}d before</strong> ({fmtDate(reminderDate.toISOString().split('T')[0])})</>
                          )}
                        </div>
                        <div className="up-actions">
                          {saved===bill.id?(
                            <span className="saved-badge">✓ Saved!</span>
                          ):(
                            <>
                              <button className="up-btn preview" onClick={()=>setPreviewBill(bill)}>👁️ Preview</button>
                              <button className={`up-btn ${isPaused?'resume':'pause'}`} onClick={()=>togglePause(bill)}>
                                {isPaused?'▶️ Resume':'⏸️ Pause'}
                              </button>
                              <button className="up-btn" onClick={()=>isEditing?setEditingBill(null):startEdit(bill)}>
                                {isEditing?'Cancel':'✏️ Edit'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {isEditing&&(
                        <div className="edit-row">
                          <div className="edit-row-label">Customize reminders for {bill.bill_name}</div>
                          <div className="edit-selects">
                            <div className="edit-select-wrap">
                              <label>1st reminder</label>
                              <select value={editRemind} onChange={e=>setEditRemind(e.target.value)}>
                                <option value="1">1 day before</option>
                                <option value="2">2 days before</option>
                                <option value="3">3 days before</option>
                                <option value="5">5 days before</option>
                                <option value="7">7 days before</option>
                                <option value="10">10 days before</option>
                                <option value="14">14 days before</option>
                              </select>
                            </div>
                            {isPlus?(
                              <div className="edit-select-wrap">
                                <label>2nd reminder <span style={{color:'var(--gold)',fontSize:'.55rem'}}>PLUS</span></label>
                                <select value={editRemind2} onChange={e=>setEditRemind2(e.target.value)}>
                                  <option value="">No 2nd reminder</option>
                                  <option value="1">1 day before</option>
                                  <option value="3">3 days before</option>
                                  <option value="5">5 days before</option>
                                  <option value="7">7 days before</option>
                                </select>
                              </div>
                            ):(
                              <div className="plus-lock" onClick={()=>window.location.href='/signup?plan=Plus&price=5'}>
                                🔒 2nd reminder — Plus only
                              </div>
                            )}
                            <button className="edit-save-btn" onClick={()=>saveEdit(bill)} disabled={saving}>
                              {saving?'Saving...':'Save'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Show other bills */}
                {bills.filter(b=>!upcoming.find(u=>u.id===b.id)&&daysUntil(b.due_date)>=0).length>0&&(
                  <>
                    <div style={{fontSize:'.68rem',fontWeight:700,color:'var(--muted)',letterSpacing:'.1em',textTransform:'uppercase',padding:'16px 4px 8px'}}>
                      Later ({bills.filter(b=>!upcoming.find(u=>u.id===b.id)&&daysUntil(b.due_date)>=0).length} bills)
                    </div>
                    {bills.filter(b=>!upcoming.find(u=>u.id===b.id)&&daysUntil(b.due_date)>=0).slice(0,5).map(bill=>(
                      <div key={bill.id} className="up-card" style={{opacity:.7}}>
                        <div className="up-card-top">
                          <div className="up-emoji" style={{opacity:.7}}>{getBillEmoji(bill.bill_name,bill.bill_type)}</div>
                          <div className="up-info">
                            <div className="up-bill-name">{bill.bill_name}</div>
                            <div className="up-bill-sub">Due {fmtDate(bill.due_date)} · {daysUntil(bill.due_date)}d away</div>
                          </div>
                          <div className="up-bill-amt">${bill.amount.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* CALENDAR TAB */}
            {activeTab==='calendar'&&(
              <div className="calendar-wrap">
                <div className="cal-header">
                  <div>
                    <div className="cal-title">{monthNames[calendarMonth]} {calendarYear}</div>
                    <div style={{fontSize:'.72rem',color:'var(--muted)',marginTop:2}}>
                      {bills.length} bill{bills.length!==1?'s':''} tracked · {bills.filter(b=>b.recurring).length} recurring
                    </div>
                  </div>
                  <div className="cal-nav">
                    <button onClick={()=>{
                      if(calendarMonth===0){setCalendarMonth(11);setCalendarYear(y=>y-1);}
                      else setCalendarMonth(m=>m-1);
                    }}>←</button>
                    <button onClick={()=>{setCalendarMonth(new Date().getMonth());setCalendarYear(new Date().getFullYear());}}>Today</button>
                    <button onClick={()=>{
                      if(calendarMonth===11){setCalendarMonth(0);setCalendarYear(y=>y+1);}
                      else setCalendarMonth(m=>m+1);
                    }}>→</button>
                  </div>
                </div>
                
                <div className="cal-grid">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(
                    <div key={d} className="cal-day-header">{d}</div>
                  ))}
                  {calendarDays.map((day,i)=>{
                    if(!day.date)return <div key={i} className="cal-day empty"/>;
                    const isToday=day.date.toDateString()===new Date().toDateString();
                    const hasItems=day.reminders.length>0||day.bills.length>0;
                    return(
                      <div key={i} className={`cal-day${isToday?' today':''}`} title={hasItems?[...day.bills.map(b=>`📅 Due: ${b.bill_name}`),...day.reminders.map(r=>`🔔 Reminder: ${r.bill_name}`)].join('\n'):''}>
                        <div className="cal-day-num">{day.date.getDate()}</div>
                        <div className="cal-dots">
                          {day.reminders.map(r=><span key={`r-${r.id}`} className="cal-dot reminder"/>)}
                          {day.bills.map(b=><span key={`b-${b.id}`} className="cal-dot bill"/>)}
                        </div>
                        {hasItems&&<div className="cal-count">{day.bills.length>0?`${day.bills.length} due`:''}{day.bills.length>0&&day.reminders.length>0?' · ':''}{day.reminders.length>0?`${day.reminders.length} remind`:''}</div>}
                      </div>
                    );
                  })}
                </div>
                
                <div className="cal-legend">
                  <div className="cal-legend-item"><span className="cal-dot reminder"/> Reminder fires</div>
                  <div className="cal-legend-item"><span className="cal-dot bill"/> Bill due</div>
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {activeTab==='history'&&(
              <div className="history-list">
                {reminders.length===0?(
                  <div className="empty">
                    <div className="empty-ic">📱</div>
                    <div className="empty-h">No reminders sent yet</div>
                    <div className="empty-s">Your reminder history will appear here once Nyra starts texting you.</div>
                  </div>
                ):reminders.map(r=>(
                  <div key={r.id} className="hist-item">
                    <div className="hist-av">N</div>
                    <div style={{flex:1}}>
                      <div className="hist-msg">👋 Your <strong>{r.bill_name}</strong> payment is due soon.</div>
                      <div className="hist-time">{fmtDateTime(r.sent_at)} · SMS</div>
                    </div>
                    <div className="hist-amt">${r.amount}</div>
                  </div>
                ))}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab==='settings'&&(
              <div className="settings-content">
                <div className="setting-section">
                  <div className="setting-title">📱 Notification Preferences</div>
                  
                  <div className="setting-row">
                    <div>
                      <div className="setting-label">SMS Reminders</div>
                      <div className="setting-desc">Receive text messages for bill reminders</div>
                    </div>
                    <div className={`toggle${smsEnabled?' on':''}`} onClick={()=>setSmsEnabled(!smsEnabled)}/>
                  </div>
                  
                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Email Reminders</div>
                      <div className="setting-desc">Also receive reminders via email {!isPlus&&<span style={{color:'var(--gold)',fontSize:'.65rem'}}>(Plus)</span>}</div>
                    </div>
                    {isPlus?(
                      <div className={`toggle${emailEnabled?' on':''}`} onClick={()=>setEmailEnabled(!emailEnabled)}/>
                    ):(
                      <div className="plus-lock" style={{padding:'4px 10px'}} onClick={()=>window.location.href='/signup?plan=Plus&price=5'}>🔒 Plus</div>
                    )}
                  </div>
                  
                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Reminder Time</div>
                      <div className="setting-desc">When to send daily reminders</div>
                    </div>
                    <input 
                      type="time" 
                      className="setting-input" 
                      value={reminderTime} 
                      onChange={e=>setReminderTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="setting-section">
                  <div className="setting-title">📞 Your Phone Number</div>
                  <div className="setting-row">
                    <div>
                      <div className="setting-label">{userPhone||'Not set'}</div>
                      <div className="setting-desc">SMS reminders are sent to this number</div>
                    </div>
                    <button className="up-btn" onClick={()=>window.location.href='/settings'}>Change</button>
                  </div>
                </div>
                
                <button 
                  className="qb-btn primary" 
                  style={{marginTop:8}}
                  onClick={savePreferences}
                  disabled={prefsSaving}
                >
                  {prefsSaving?'Saving...':prefsSaved?'✓ Saved!':'Save Preferences'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="rcol">
          {/* Quick Actions */}
          <div className="panel" style={{padding:'16px 20px'}}>
            <div style={{fontSize:'.7rem',fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:12}}>Quick Actions</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <button className="qb-btn" style={{width:'100%',justifyContent:'center'}} onClick={()=>setBulkOpen(true)}>⚡ Bulk Edit Reminders</button>
              <button className="qb-btn" style={{width:'100%',justifyContent:'center'}} onClick={sendTestReminder} disabled={testSending||!userPhone}>
                {testSending?'Sending...':testSent?'✓ Sent!':'📱 Send Test SMS'}
              </button>
            </div>
            {saved==='bulk'&&<div style={{marginTop:8,fontSize:'.75rem',color:'var(--success)',fontWeight:500}}>✓ All reminders updated!</div>}
          </div>

          {/* Stats */}
          <div className="panel">
            <div className="p-hd"><div><div className="p-t">Overview</div></div></div>
            <div className="stat-cards">
              {[
                {ic:'📅',bg:'var(--blue-pale)',val:upcoming.length,lbl:'Due soon'},
                {ic:'⏰',bg:'var(--gold-pale)',val:avgBuffer.toFixed(0)+'d',lbl:'Avg buffer'},
              ].map((s,i)=>(
                <div key={i} className="stat-card">
                  <div className="stat-icon" style={{background:s.bg}}>{s.ic}</div>
                  <div><div className="stat-val">{s.val}</div><div className="stat-lbl">{s.lbl}</div></div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights - Only show if there are actionable ones */}
          {(lowBufferBills.length>0||predictiveAlerts.length>0)&&(
            <div className="panel">
              <div className="p-hd"><div><div className="p-t">✦ Insights</div></div></div>
              <div className="insight-section">
                {lowBufferBills.length>0&&(
                  <div className="insight-item">
                    <div className="insight-icon warn">⚠️</div>
                    <div className="insight-content">
                      <div className="insight-title">{lowBufferBills.length} bill{lowBufferBills.length>1?'s':''} with short notice</div>
                      <div className="insight-desc">{lowBufferBills.slice(0,2).map(b=>b.bill_name).join(', ')} — only {lowBufferBills[0]?.remind_days_before||1} day warning</div>
                      <div className="insight-action">
                        <button className="insight-btn" onClick={fixLowBufferBills}>Fix → 5 days</button>
                      </div>
                    </div>
                  </div>
                )}
                {predictiveAlerts.slice(0,2).map((a,i)=>(
                  <div key={i} className="insight-item">
                    <div className={`insight-icon ${a.severity==='warning'?'warn':'info'}`}>{a.icon}</div>
                    <div className="insight-content">
                      <div className="insight-title">{a.title}</div>
                      <div className="insight-desc">{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pattern - Simple summary */}
          {patternInsights.length>0&&(
            <div className="panel" style={{padding:'16px 20px'}}>
              <div style={{fontSize:'.7rem',fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:10}}>Your Patterns</div>
              {patternInsights.slice(0,2).map((p,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:'.8rem',color:'var(--text2)',marginBottom:8}}>
                  <span>{p.icon}</span>
                  <span>{p.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>

    {/* PREVIEW MODAL */}
    {previewBill&&(
      <div className="modal-overlay" onClick={()=>setPreviewBill(null)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <div className="modal-hd">
            <div className="modal-title">📱 SMS Preview</div>
            <button className="modal-close" onClick={()=>setPreviewBill(null)}>✕</button>
          </div>
          <div className="modal-body">
            <div style={{fontSize:'.78rem',color:'var(--muted)',marginBottom:16,textAlign:'center'}}>
              This is what your reminder will look like:
            </div>
            <div className="phone-preview">
              <div className="phone-notch"/>
              <div className="phone-msg">
                <div className="phone-msg-from">Nyra</div>
                <div className="phone-msg-text">
                  👋 Hey {userName}! Your <strong>{previewBill.bill_name}</strong> payment of <strong>${previewBill.amount}</strong> is due in {previewBill.remind_days_before} day{previewBill.remind_days_before!==1?'s':''}. Don't forget to pay it! 💰
                </div>
              </div>
              <div className="phone-time">Today, {reminderTime}</div>
            </div>
            <div style={{marginTop:20,textAlign:'center'}}>
              <button 
                className="qb-btn primary" 
                onClick={()=>{sendTestReminder();setPreviewBill(null);}}
                disabled={!userPhone}
              >
                📱 Send Test to My Phone
              </button>
              {!userPhone&&<div style={{fontSize:'.7rem',color:'var(--muted)',marginTop:8}}>Add your phone number in settings first</div>}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* BULK EDIT MODAL */}
    {bulkOpen&&(
      <div className="modal-overlay" onClick={()=>setBulkOpen(false)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <div className="modal-hd">
            <div className="modal-title">⚡ Bulk Edit All Reminders</div>
            <button className="modal-close" onClick={()=>setBulkOpen(false)}>✕</button>
          </div>
          <div className="bulk-modal">
            <div className="bulk-desc">
              This will update the reminder timing for all {bills.length} of your bills at once. Choose how many days before each due date you want to be reminded:
            </div>
            <select className="bulk-select" value={bulkDays} onChange={e=>setBulkDays(e.target.value)}>
              <option value="1">1 day before (not recommended)</option>
              <option value="2">2 days before</option>
              <option value="3">3 days before</option>
              <option value="5">5 days before (recommended)</option>
              <option value="7">7 days before (best)</option>
              <option value="10">10 days before</option>
              <option value="14">14 days before</option>
            </select>
            <div className="bulk-actions">
              <button className="up-btn" onClick={()=>setBulkOpen(false)}>Cancel</button>
              <button className="qb-btn primary" onClick={bulkUpdateReminders} disabled={bulkSaving}>
                {bulkSaving?'Updating...':'Update All Bills'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* AI COACH FLOATING BUTTON */}
    <div className="ai-fab">
      <button className="ai-fab-btn" onClick={()=>setAiCoachOpen(!aiCoachOpen)}>
        {aiCoachOpen?'✕':'✦'}
      </button>
    </div>

    {/* AI COACH CHAT PANEL */}
    {aiCoachOpen&&(
      <div className="ai-panel">
        <div className="ai-panel-header">
          <div className="ai-panel-avatar">✦</div>
          <div className="ai-panel-info">
            <div className="ai-panel-name">Nyra</div>
            <div className="ai-panel-status">● Ready to help</div>
          </div>
          <button className="ai-panel-close" onClick={()=>setAiCoachOpen(false)}>✕</button>
        </div>
        
        <div className="ai-messages">
          {aiMessages.map((m,i)=>(
            <div key={i} className={`ai-msg ${m.role}`}>
              {m.text.split('\n').map((line,j)=>(
                <span key={j}>
                  {line.replace(/\*\*(.*?)\*\*/g,'').replace(/•/g,'→')}
                  {j<m.text.split('\n').length-1&&<br/>}
                </span>
              ))}
            </div>
          ))}
          {aiThinking&&(
            <div className="ai-typing">
              <span/><span/><span/>
            </div>
          )}
        </div>
        
        <div className="ai-prompts">
          {['This week?','Prioritize','Timing tips','Patterns'].map(q=>(
            <button key={q} className="ai-prompt" onClick={()=>{setAiInput(q);setTimeout(()=>handleAISubmit(),100);}}>{q}</button>
          ))}
        </div>
        
        <div className="ai-input-row">
          <input 
            className="ai-input"
            type="text" 
            placeholder="Ask anything..." 
            value={aiInput}
            onChange={e=>setAiInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleAISubmit();}}}
          />
          <button className="ai-send" onClick={handleAISubmit} disabled={!aiInput.trim()||aiThinking}>→</button>
        </div>
      </div>
    )}
  </>);
}
