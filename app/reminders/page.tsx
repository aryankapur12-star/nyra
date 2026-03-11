'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Bill { id:string;name:string;amount:number;due_date:string;recurring:string;remind_days_before:number; }
interface ReminderLog { id:string;bill_name:string;amount:number;sent_at:string;message?:string; }

function daysUntil(d:string){const t=new Date();t.setHours(0,0,0,0);return Math.ceil((new Date(d+'T00:00:00').getTime()-t.getTime())/86400000);}
function fmtDate(d:string){return new Date(d+'T00:00:00').toLocaleDateString('en-CA',{month:'short',day:'numeric'});}
function fmtDateTime(d:string){return new Date(d).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'});}

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

export default function RemindersPage(){
  const[userName,setUserName]=useState('there');
  const[userPlan,setUserPlan]=useState('Plus');
  const[bills,setBills]=useState<Bill[]>([]);
  const[reminders,setReminders]=useState<ReminderLog[]>([]);
  const[loading,setLoading]=useState(true);
  const[editingBill,setEditingBill]=useState<string|null>(null);
  const[editRemind,setEditRemind]=useState('3');
  const[editRemind2,setEditRemind2]=useState('');
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState<string|null>(null);
  const[activeTab,setActiveTab]=useState<'upcoming'|'history'>('upcoming');

  useEffect(()=>{
    async function load(){
      const{data:{user}}=await supabase.auth.getUser();if(!user)return;
      const{data:prof}=await supabase.from('profiles').select('full_name,plan').eq('id',user.id).single();
      if(prof){setUserName(prof.full_name?.split(' ')[0]||'there');setUserPlan(prof.plan||'Plus');}
      const{data:bd}=await supabase.from('bills').select('*').eq('user_id',user.id).order('due_date',{ascending:true});
      const{data:rd}=await supabase.from('reminder_logs').select('*').eq('user_id',user.id).order('sent_at',{ascending:false});
      setBills(bd||[]);setReminders(rd||[]);setLoading(false);
    }
    load();
  },[]);

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

  const isPlus=userPlan!=='Basic';
  const upcoming=bills.filter(b=>{const d=daysUntil(b.due_date);return d>=0&&d<=7;}).sort((a,b)=>daysUntil(a.due_date)-daysUntil(b.due_date));
  const allBillsWithReminders=bills.map(b=>({...b,reminderDate:daysUntil(b.due_date)-b.remind_days_before}));

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
      .page-sub{font-size:.88rem;color:var(--text2);line-height:1.7;}
      .dash-grid{display:grid;grid-template-columns:1fr 360px;gap:20px;opacity:0;animation:fu .5s ease .2s forwards;}
      .panel{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:22px;box-shadow:var(--gs);overflow:hidden;}
      .p-hd{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 0;}
      .p-t{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;color:var(--text);}
      .p-s{font-size:.72rem;color:var(--muted);margin-top:1px;}
      /* TABS */
      .tab-row{display:flex;gap:4px;padding:14px 24px 0;}
      .tab{font-size:.78rem;font-weight:500;padding:7px 16px;border-radius:100px;border:none;cursor:pointer;background:transparent;color:var(--muted);transition:background .2s,color .2s;}
      .tab.on{background:var(--blue-pale);color:var(--blue);font-weight:600;}
      /* UPCOMING */
      .upcoming-list{padding:16px 20px;}
      .up-card{background:var(--glass2);border:1px solid var(--gb);border-radius:16px;padding:16px 18px;margin-bottom:10px;transition:box-shadow .2s;}
      .up-card:hover{box-shadow:var(--gsl);}
      .up-card-top{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
      .up-countdown{width:48px;height:48px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;}
      .up-days-num{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.1rem;line-height:1;}
      .up-days-lbl{font-size:.5rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-top:1px;}
      .up-bill-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.92rem;color:var(--text);}
      .up-bill-sub{font-size:.68rem;color:var(--muted);margin-top:2px;}
      .up-bill-amt{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1rem;color:var(--text);margin-left:auto;}
      .up-remind-row{display:flex;align-items:center;justify-content:space-between;background:var(--bg);border-radius:10px;padding:8px 12px;}
      .up-remind-txt{font-size:.72rem;color:var(--text2);}
      .up-edit-btn{font-size:.68rem;font-weight:600;color:var(--blue);background:none;border:none;cursor:pointer;padding:2px 8px;border-radius:100px;transition:background .2s;}
      .up-edit-btn:hover{background:var(--blue-pale);}
      /* EDIT ROW */
      .edit-row{background:var(--blue-pale);border:1px solid rgba(33,119,209,.15);border-radius:12px;padding:12px 14px;margin-top:8px;}
      .edit-row-label{font-size:.62rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;}
      .edit-selects{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
      .edit-select-wrap{display:flex;flex-direction:column;gap:4px;flex:1;}
      .edit-select-wrap label{font-size:.6rem;color:var(--muted);font-weight:600;}
      .edit-select-wrap select{background:white;border:1.5px solid rgba(33,119,209,.15);border-radius:9px;padding:7px 10px;font-family:'Inter',sans-serif;font-size:.8rem;color:var(--text);outline:none;cursor:pointer;}
      .edit-select-wrap select:focus{border-color:var(--blue);}
      .plus-lock{display:flex;align-items:center;gap:6px;font-size:.68rem;color:var(--muted);background:rgba(122,144,170,.08);border:1px dashed rgba(122,144,170,.2);border-radius:8px;padding:7px 10px;cursor:pointer;transition:all .2s;}
      .plus-lock:hover{background:var(--blue-pale);color:var(--blue);border-color:rgba(33,119,209,.2);}
      .edit-save-btn{background:var(--blue);color:white;border:none;padding:8px 18px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer;white-space:nowrap;}
      .edit-cancel{background:transparent;border:1px solid var(--border);color:var(--muted);padding:8px 14px;border-radius:100px;font-size:.78rem;cursor:pointer;}
      .saved-badge{font-size:.68rem;font-weight:600;color:var(--success);background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.2);border-radius:100px;padding:3px 10px;}
      /* HISTORY */
      .history-list{padding:12px 20px;}
      .hist-item{display:flex;align-items:flex-start;gap:12px;padding:12px 10px;border-radius:12px;margin-bottom:4px;transition:background .2s;}
      .hist-item:hover{background:rgba(33,119,209,.04);}
      .hist-av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--blue-m));display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.7rem;color:white;flex-shrink:0;}
      .hist-msg{font-size:.78rem;color:var(--text2);line-height:1.5;}
      .hist-time{font-size:.62rem;color:var(--muted);margin-top:3px;}
      .hist-amt{font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:700;color:var(--text);margin-left:auto;white-space:nowrap;}
      .empty{padding:40px 24px;text-align:center;}
      .empty-ic{font-size:2rem;margin-bottom:10px;}
      .empty-h{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.92rem;color:var(--text2);margin-bottom:6px;}
      .empty-s{font-size:.78rem;color:var(--muted);}
      /* RIGHT COL */
      .rcol{display:flex;flex-direction:column;gap:16px;}
      /* STATS */
      .stat-cards{display:flex;flex-direction:column;gap:10px;padding:16px 20px;}
      .stat-card{display:flex;align-items:center;gap:14px;background:var(--glass2);border:1px solid var(--gb);border-radius:14px;padding:14px 16px;}
      .stat-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;}
      .stat-val{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.2rem;color:var(--text);}
      .stat-lbl{font-size:.68rem;color:var(--muted);margin-top:1px;}
      /* ALL BILLS REMINDERS */
      .bill-remind-list{padding:12px 20px;}
      .br-item{display:flex;align-items:center;gap:12px;padding:10px 8px;border-radius:12px;margin-bottom:4px;transition:background .2s;}
      .br-item:hover{background:rgba(33,119,209,.04);}
      .br-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
      .br-name{font-size:.84rem;font-weight:600;color:var(--text);flex:1;}
      .br-chip{font-size:.62rem;font-weight:600;padding:3px 9px;border-radius:100px;white-space:nowrap;}
      .br-chip-soon{background:rgba(245,158,11,.1);color:var(--warn);border:1px solid rgba(245,158,11,.2);}
      .br-chip-ok{background:var(--blue-pale);color:var(--blue);border:1px solid rgba(33,119,209,.15);}
      @media(max-width:1000px){.dash-grid{grid-template-columns:1fr;}}
      @media(max-width:700px){.sb{display:none;}.main{margin-left:0;padding:16px;}}
    `}</style>

    <div className="blob b1"/><div className="blob b2"/>

    <aside className="sb">
      <div className="sb-logo"><span className="sb-logo-txt">Nyra</span><span className="sb-gem"/></div>
      <div className="nav-lbl">Menu</div>
      <a className="ni" href="/dashboard"><span className="ni-ic">📋</span>My Bills</a>
      <a className="ni on" href="/reminders"><span className="ni-ic">🔔</span>Reminders</a>
      <div className="ni"><span className="ni-ic">🏆</span>Achievements</div>
      <a className="ni" href="/learn"><span className="ni-ic">🧠</span>Learn</a>
      <a className="ni" href="/analytics"><span className="ni-ic">📊</span>Analytics</a>
      <div className="ni"><span className="ni-ic">⚙️</span>Settings</div>
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
        <div className="page-sub">See what&apos;s coming up, edit your timing, and review every text Nyra has sent you.</div>
      </div>

      <div className="dash-grid">
        <div>
          {/* Tab switcher */}
          <div className="panel">
            <div className="p-hd">
              <div>
                <div className="p-t">{activeTab==='upcoming'?'Upcoming Reminders':'Reminder History'}</div>
                <div className="p-s">{activeTab==='upcoming'?'Next 7 days':'Every text Nyra has sent you'}</div>
              </div>
            </div>
            <div className="tab-row">
              <button className={`tab ${activeTab==='upcoming'?'on':''}`} onClick={()=>setActiveTab('upcoming')}>📅 Upcoming</button>
              <button className={`tab ${activeTab==='history'?'on':''}`} onClick={()=>setActiveTab('history')}>📜 History ({reminders.length})</button>
            </div>

            {activeTab==='upcoming'&&(
              <div className="upcoming-list">
                {upcoming.length===0?(
                  <div className="empty"><div className="empty-ic">🎉</div><div className="empty-h">Nothing due in the next 7 days!</div><div className="empty-s">You&apos;re all clear. Nyra will text you when something&apos;s coming up.</div></div>
                ):upcoming.map(bill=>{
                  const d=daysUntil(bill.due_date);
                  const isEditing=editingBill===bill.id;
                  const color=d<=2?'var(--danger)':d<=5?'var(--warn)':'var(--blue)';
                  const bgColor=d<=2?'rgba(239,68,68,.08)':d<=5?'rgba(245,158,11,.08)':'var(--blue-pale)';
                  return(
                    <div key={bill.id} className="up-card">
                      <div className="up-card-top">
                        <div className="up-countdown" style={{background:bgColor}}>
                          <div className="up-days-num" style={{color}}>{d}</div>
                          <div className="up-days-lbl" style={{color}}>days</div>
                        </div>
                        <div style={{flex:1}}>
                          <div className="up-bill-name">{bill.name}</div>
                          <div className="up-bill-sub">{bill.recurring} · Due {fmtDate(bill.due_date)}</div>
                        </div>
                        <div className="up-bill-amt">${bill.amount.toLocaleString()}</div>
                      </div>
                      <div className="up-remind-row">
                        <div className="up-remind-txt">
                          📱 Reminder set for <strong>{bill.remind_days_before} day{bill.remind_days_before!==1?'s':''} before</strong> ({fmtDate(new Date(new Date(bill.due_date+'T00:00:00').getTime()-bill.remind_days_before*86400000).toISOString().split('T')[0])})
                        </div>
                        {saved===bill.id?<span className="saved-badge">✓ Saved!</span>:<button className="up-edit-btn" onClick={()=>isEditing?setEditingBill(null):startEdit(bill)}>✏️ Edit</button>}
                      </div>
                      {isEditing&&(
                        <div className="edit-row">
                          <div className="edit-row-label">Customize reminders for {bill.name}</div>
                          <div className="edit-selects">
                            <div className="edit-select-wrap">
                              <label>1st reminder</label>
                              <select value={editRemind} onChange={e=>setEditRemind(e.target.value)}>
                                <option value="1">1 day before</option>
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
                            <button className="edit-save-btn" onClick={()=>saveEdit(bill)} disabled={saving}>{saving?'Saving...':'Save'}</button>
                            <button className="edit-cancel" onClick={()=>setEditingBill(null)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* All bills with reminder dates */}
                {bills.filter(b=>!upcoming.find(u=>u.id===b.id)).length>0&&(
                  <>
                    <div style={{fontSize:'.7rem',fontWeight:700,color:'var(--muted)',letterSpacing:'.1em',textTransform:'uppercase',padding:'8px 4px 4px',marginTop:8}}>All other bills</div>
                    {bills.filter(b=>!upcoming.find(u=>u.id===b.id)).map(bill=>{
                      const d=daysUntil(bill.due_date);
                      const isEditing=editingBill===bill.id;
                      return(
                        <div key={bill.id} className="up-card" style={{opacity:.8}}>
                          <div className="up-card-top">
                            <div className="up-countdown" style={{background:'var(--blue-pale)'}}>
                              <div className="up-days-num" style={{color:'var(--blue)',fontSize:'.85rem'}}>{d}d</div>
                            </div>
                            <div style={{flex:1}}>
                              <div className="up-bill-name">{bill.name}</div>
                              <div className="up-bill-sub">{bill.recurring} · Due {fmtDate(bill.due_date)}</div>
                            </div>
                            <div className="up-bill-amt">${bill.amount.toLocaleString()}</div>
                          </div>
                          <div className="up-remind-row">
                            <div className="up-remind-txt">📱 Reminder: <strong>{bill.remind_days_before}d before</strong></div>
                            {saved===bill.id?<span className="saved-badge">✓ Saved!</span>:<button className="up-edit-btn" onClick={()=>isEditing?setEditingBill(null):startEdit(bill)}>✏️ Edit</button>}
                          </div>
                          {isEditing&&(
                            <div className="edit-row">
                              <div className="edit-row-label">Customize reminders for {bill.name}</div>
                              <div className="edit-selects">
                                <div className="edit-select-wrap">
                                  <label>1st reminder</label>
                                  <select value={editRemind} onChange={e=>setEditRemind(e.target.value)}>
                                    <option value="1">1 day before</option><option value="3">3 days before</option><option value="5">5 days before</option><option value="7">7 days before</option><option value="10">10 days before</option><option value="14">14 days before</option>
                                  </select>
                                </div>
                                {isPlus?(
                                  <div className="edit-select-wrap">
                                    <label>2nd reminder <span style={{color:'var(--gold)',fontSize:'.55rem'}}>PLUS</span></label>
                                    <select value={editRemind2} onChange={e=>setEditRemind2(e.target.value)}>
                                      <option value="">No 2nd reminder</option><option value="1">1 day before</option><option value="3">3 days before</option><option value="5">5 days before</option><option value="7">7 days before</option>
                                    </select>
                                  </div>
                                ):(
                                  <div className="plus-lock" onClick={()=>window.location.href='/signup?plan=Plus&price=5'}>🔒 2nd reminder — Plus only</div>
                                )}
                                <button className="edit-save-btn" onClick={()=>saveEdit(bill)} disabled={saving}>{saving?'Saving...':'Save'}</button>
                                <button className="edit-cancel" onClick={()=>setEditingBill(null)}>Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {activeTab==='history'&&(
              <div className="history-list">
                {reminders.length===0?(
                  <div className="empty"><div className="empty-ic">📱</div><div className="empty-h">No reminders sent yet</div><div className="empty-s">Your reminder history will appear here once Nyra starts texting you.</div></div>
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
          </div>
        </div>

        {/* Right col */}
        <div className="rcol">
          {/* Stats */}
          <div className="panel">
            <div className="p-hd"><div><div className="p-t">Reminder Stats</div><div className="p-s">Your reminder activity</div></div></div>
            <div className="stat-cards">
              {[
                {ic:'📱',bg:'var(--blue-pale)',val:reminders.length,lbl:'Total reminders sent'},
                {ic:'⏰',bg:'rgba(195,154,53,.1)',val:bills.length>0?(bills.reduce((s,b)=>s+b.remind_days_before,0)/bills.length).toFixed(1)+'d':'—',lbl:'Avg reminder timing'},
                {ic:'📅',bg:'rgba(34,197,94,.08)',val:upcoming.length,lbl:'Due in next 7 days'},
                {ic:'✅',bg:'rgba(34,197,94,.08)',val:bills.filter(b=>b.remind_days_before>=5).length,lbl:'Bills with 5+ day buffer'},
              ].map((s,i)=>(
                <div key={i} className="stat-card">
                  <div className="stat-icon" style={{background:s.bg}}>{s.ic}</div>
                  <div><div className="stat-val">{s.val}</div><div className="stat-lbl">{s.lbl}</div></div>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="panel" style={{padding:'20px 22px'}}>
            <div style={{fontSize:'.72rem',fontWeight:700,color:'var(--gold)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:10}}>💡 Pro tip</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:'.9rem',color:'var(--text)',marginBottom:6}}>Set reminders 5–7 days early</div>
            <div style={{fontSize:'.78rem',color:'var(--text2)',lineHeight:1.75}}>
              A 7-day buffer gives you time to move money between accounts, avoid NSF fees, and keep your credit score clean. 1-day reminders are stressful. 7-day reminders are smooth. 🟢
            </div>
            {!isPlus&&<button style={{marginTop:14,background:'var(--blue)',color:'white',border:'none',padding:'8px 18px',borderRadius:100,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'.76rem',fontWeight:700,cursor:'pointer',boxShadow:'0 3px 10px var(--blue-glow)'}} onClick={()=>window.location.href='/signup?plan=Plus&price=5'}>Unlock 2nd reminders on Plus →</button>}
          </div>
        </div>
      </div>
    </main>
  </>);
}
