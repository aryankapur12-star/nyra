'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Tab = 'profile'|'notifications'|'plan'|'security';

const PLANS = [
  {id:'Basic', price:'$3',bills:'Up to 5 bills',features:['SMS reminders','Basic badges','Money IQ score'],color:'#7a90aa'},
  {id:'Plus',  price:'$5',bills:'Up to 15 bills',features:['Everything in Basic','AI coach (10 msg/mo)','Statement upload','Analytics & Learn tab','All badges + social sharing'],color:'#2177d1'},
  {id:'Power', price:'$8',bills:'Unlimited bills',features:['Everything in Plus','Unlimited AI coach','AI memory between sessions','Proactive AI insights','Secret badges'],color:'#7c3aed'},
];

export default function SettingsPage(){
  const[activeTab,setActiveTab]=useState<Tab>('profile');
  const[userName,setUserName]=useState('');
  const[userEmail,setUserEmail]=useState('');
  const[userPhone,setUserPhone]=useState('');
  const[userPlan,setUserPlan]=useState('Plus');
  const[leaderboardAnon,setLeaderboardAnon]=useState(true);
  const[leaderboardName,setLeaderboardName]=useState('');
  const[smsEnabled,setSmsEnabled]=useState(true);
  const[reminderTime,setReminderTime]=useState('09:00');
  const[saving,setSaving]=useState<string|null>(null);
  const[saved,setSaved]=useState<string|null>(null);
  const[userId,setUserId]=useState('');
  const[billingDate,setBillingDate]=useState('');
  const[pwCurrent,setPwCurrent]=useState('');
  const[pwNew,setPwNew]=useState('');
  const[pwConfirm,setPwConfirm]=useState('');
  const[pwError,setPwError]=useState('');
  const[pwSuccess,setPwSuccess]=useState(false);
  const[cancelConfirm,setCancelConfirm]=useState(false);
  const saveTimer=useRef<Record<string,NodeJS.Timeout>>({});

  useEffect(()=>{
    async function load(){
      const{data:{user}}=await supabase.auth.getUser();
      if(!user) return;
      setUserId(user.id);
      setUserEmail(user.email||'');
      const{data:prof}=await supabase.from('profiles').select('*').eq('id',user.id).single();
      if(prof){
        setUserName(prof.full_name||'');
        setUserPhone(prof.phone||'');
        setUserPlan(prof.plan||'Plus');
        setSmsEnabled(prof.sms_enabled!==false);
        setReminderTime(prof.reminder_time||'09:00');
        setLeaderboardAnon(prof.leaderboard_anon!==false);
        setLeaderboardName(prof.leaderboard_name||'');
        // Mock billing date — in real app from Stripe
        const created=new Date(prof.created_at||Date.now());
        const next=new Date(created);
        next.setMonth(next.getMonth()+1);
        setBillingDate(next.toLocaleDateString('en-CA',{month:'long',day:'numeric',year:'numeric'}));
      }
    }
    load();
  },[]);

  function autosave(field:string, value:any){
    setSaving(field);
    if(saveTimer.current[field]) clearTimeout(saveTimer.current[field]);
    saveTimer.current[field]=setTimeout(async()=>{
      await supabase.from('profiles').update({[field]:value}).eq('id',userId);
      setSaving(null);setSaved(field);
      setTimeout(()=>setSaved(null),2000);
    },600);
  }

  async function changePassword(){
    setPwError('');setPwSuccess(false);
    if(pwNew!==pwConfirm){setPwError('New passwords don\'t match.');return;}
    if(pwNew.length<8){setPwError('Password must be at least 8 characters.');return;}
    const{error}=await supabase.auth.updateUser({password:pwNew});
    if(error){setPwError(error.message);return;}
    setPwSuccess(true);setPwCurrent('');setPwNew('');setPwConfirm('');
  }

  function SaveIndicator({field}:{field:string}){
    if(saving===field) return <span style={{fontSize:'.65rem',color:'var(--muted)'}}>Saving...</span>;
    if(saved===field) return <span style={{fontSize:'.65rem',color:'var(--success)',fontWeight:600}}>✓ Saved</span>;
    return null;
  }

  function Toggle({on,onToggle}:{on:boolean;onToggle:()=>void}){
    return(
      <div onClick={onToggle} style={{width:42,height:24,borderRadius:100,background:on?'var(--blue)':'var(--border)',cursor:'pointer',position:'relative',transition:'background .2s',flexShrink:0}}>
        <div style={{position:'absolute',top:3,left:on?21:3,width:18,height:18,borderRadius:'50%',background:'white',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
      </div>
    );
  }

  const isPlus=userPlan==='Plus'||userPlan==='Power';

  return(<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');
      :root{--blue:#2177d1;--blue-d:#1658a8;--blue-m:#3a8ee0;--blue-pale:rgba(33,119,209,0.08);--blue-glow:rgba(33,119,209,0.18);--gold:#c39a35;--gold-pale:rgba(195,154,53,0.09);--bg:#eef3fb;--text:#0c1524;--text2:#3a4f6a;--muted:#7a90aa;--border:rgba(33,119,209,0.1);--success:#22c55e;--warn:#f59e0b;--danger:#ef4444;--glass:rgba(255,255,255,0.62);--glass2:rgba(255,255,255,0.80);--gb:rgba(255,255,255,0.86);--gs:0 4px 24px rgba(33,119,209,.08),0 1px 4px rgba(0,0,0,.04),inset 0 1px 0 rgba(255,255,255,.9);}
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
      .main{margin-left:240px;padding:28px 32px;min-height:100vh;position:relative;z-index:1;}
      @keyframes fu{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
      .page-header{margin-bottom:28px;opacity:0;animation:fu .5s ease .1s forwards;}
      .page-eyebrow{font-size:.62rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);margin-bottom:8px;}
      .page-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:2rem;letter-spacing:-.04em;color:var(--text);margin-bottom:6px;}
      .page-sub{font-size:.88rem;color:var(--text2);line-height:1.7;}
      /* TABS */
      .tab-bar{display:flex;gap:4px;background:var(--glass);backdrop-filter:blur(20px);border:1px solid var(--gb);border-radius:16px;padding:6px;margin-bottom:24px;width:fit-content;opacity:0;animation:fu .5s ease .15s forwards;}
      .tab-btn{padding:9px 20px;border-radius:12px;border:none;cursor:pointer;font-family:'Inter',sans-serif;font-size:.82rem;font-weight:500;color:var(--muted);background:transparent;transition:all .2s;display:flex;align-items:center;gap:7px;}
      .tab-btn.on{background:white;color:var(--blue);font-weight:600;box-shadow:0 2px 8px rgba(33,119,209,.12);}
      .tab-btn:hover:not(.on){color:var(--text2);}
      /* CONTENT */
      .settings-content{opacity:0;animation:fu .4s ease .2s forwards;}
      .settings-grid{display:grid;grid-template-columns:1fr 320px;gap:20px;}
      .panel{background:var(--glass);backdrop-filter:blur(22px) saturate(2);border:1px solid var(--gb);border-radius:22px;box-shadow:var(--gs);overflow:hidden;margin-bottom:16px;}
      .p-hd{padding:20px 24px 16px;border-bottom:1px solid var(--border);}
      .p-t{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.95rem;color:var(--text);}
      .p-s{font-size:.72rem;color:var(--muted);margin-top:2px;}
      .p-body{padding:20px 24px;}
      /* FORM */
      .field{margin-bottom:18px;}
      .field:last-child{margin-bottom:0;}
      .field-row{display:flex;align-items:center;justify-content:space-between;gap:16px;}
      .field label{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:6px;}
      .field input,.field select{width:100%;background:white;border:1.5px solid var(--border);border-radius:10px;padding:10px 14px;font-family:'Inter',sans-serif;font-size:.85rem;color:var(--text);outline:none;transition:border .2s;}
      .field input:focus,.field select:focus{border-color:var(--blue);}
      .field-hint{font-size:.68rem;color:var(--muted);margin-top:5px;line-height:1.5;}
      .save-indicator{font-size:.65rem;margin-left:8px;}
      /* AVATAR */
      .avatar-row{display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--border);}
      .avatar-big{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--blue-m));display:flex;align-items:center;justify-content:center;font-family:'Plus Jakarta Sans',sans-serif;font-size:1.5rem;font-weight:800;color:white;flex-shrink:0;box-shadow:0 4px 14px var(--blue-glow);}
      .avatar-info{flex:1;}
      .avatar-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1rem;color:var(--text);margin-bottom:3px;}
      .avatar-email{font-size:.74rem;color:var(--muted);}
      /* PLAN CARDS */
      .plan-cards{display:flex;flex-direction:column;gap:10px;}
      .plan-card{border-radius:16px;padding:16px 18px;border:2px solid var(--border);cursor:pointer;transition:all .2s;position:relative;}
      .plan-card.current{border-color:var(--blue);background:var(--blue-pale);}
      .plan-card:hover:not(.current){border-color:rgba(33,119,209,.3);background:rgba(33,119,209,.02);}
      .plan-card-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
      .plan-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:.95rem;}
      .plan-price{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--muted);}
      .plan-current-badge{font-size:.6rem;font-weight:700;color:white;background:var(--blue);border-radius:100px;padding:2px 9px;}
      .plan-bills{font-size:.72rem;color:var(--muted);margin-bottom:8px;}
      .plan-feats{display:flex;flex-direction:column;gap:3px;}
      .plan-feat{font-size:.72rem;color:var(--text2);display:flex;align-items:center;gap:6px;}
      .plan-feat::before{content:'✓';color:var(--success);font-weight:700;flex-shrink:0;}
      .plan-upgrade-btn{width:100%;margin-top:12px;padding:10px;border-radius:10px;border:none;background:var(--blue);color:white;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px var(--blue-glow);}
      /* DANGER ZONE */
      .danger-zone{border:1px solid rgba(239,68,68,.2);border-radius:16px;padding:18px 20px;background:rgba(239,68,68,.03);}
      .danger-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--danger);margin-bottom:6px;}
      .danger-desc{font-size:.76rem;color:var(--text2);line-height:1.6;margin-bottom:14px;}
      .danger-btn{background:transparent;border:1.5px solid var(--danger);color:var(--danger);padding:9px 20px;border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .2s;}
      .danger-btn:hover{background:var(--danger);color:white;}
      .danger-confirm{background:var(--danger);color:white;padding:9px 20px;border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;font-weight:700;border:none;cursor:pointer;margin-left:8px;}
      /* BILLING INFO */
      .billing-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);}
      .billing-row:last-child{border-bottom:none;}
      .billing-lbl{font-size:.78rem;color:var(--muted);}
      .billing-val{font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:.84rem;color:var(--text);}
      /* PW */
      .pw-error{font-size:.74rem;color:var(--danger);background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:8px;padding:8px 12px;margin-bottom:10px;}
      .pw-success{font-size:.74rem;color:var(--success);background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:8px;padding:8px 12px;margin-bottom:10px;}
      .pw-btn{background:var(--blue);color:white;border:none;padding:11px 24px;border-radius:100px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:700;cursor:pointer;margin-top:4px;}
      /* RIGHT SIDEBAR */
      .right-col{display:flex;flex-direction:column;gap:16px;}
      .tip-card{background:linear-gradient(135deg,rgba(33,119,209,.05),rgba(195,154,53,.03));border:1px solid rgba(195,154,53,.18);border-radius:18px;padding:20px;}
      .tip-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--text);margin-bottom:8px;}
      .tip-body{font-size:.78rem;color:var(--text2);line-height:1.75;}
      @media(max-width:1000px){.settings-grid{grid-template-columns:1fr;}}
      @media(max-width:700px){.sb{display:none;}.main{margin-left:0;padding:16px;}}
    `}</style>

    <div className="blob b1"/><div className="blob b2"/>

    <aside className="sb">
      <div className="sb-logo"><span className="sb-logo-txt">Nyra</span><span className="sb-gem"/></div>
      <div className="nav-lbl">Menu</div>
      <a className="ni" href="/dashboard"><span className="ni-ic">📋</span>My Bills</a>
      <a className="ni" href="/reminders"><span className="ni-ic">🔔</span>Reminders</a>
      <a className="ni" href="/achievements"><span className="ni-ic">🏆</span>Achievements</a>
      <a className="ni" href="/learn"><span className="ni-ic">🧠</span>Learn</a>
      <a className="ni" href="/analytics"><span className="ni-ic">📊</span>Analytics</a>
      <a className="ni on" href="/settings"><span className="ni-ic">⚙️</span>Settings</a>
      <div className="nav-lbl">Resources</div>
      <a className="ni" href="https://financialfutureseducation.com/" target="_blank" rel="noreferrer"><span className="ni-ic">🎓</span>FFE Website</a>
      <div className="sb-bot">
        <div className="plan-pill">
          <div><div className="pp-name">{userPlan} Plan</div><div className="pp-ct">Settings</div></div>
          <div className="pp-badge">Active</div>
        </div>
        <div className="u-row">
          <div className="u-av">{userName[0]?.toUpperCase()||'?'}</div>
          <div><div className="u-name">{userName||'Loading...'}</div></div>
        </div>
      </div>
    </aside>

    <main className="main">
      <div className="page-header">
        <div className="page-eyebrow">Account</div>
        <div className="page-title">⚙️ Settings</div>
        <div className="page-sub">Changes save automatically as you type.</div>
      </div>

      {/* TAB BAR */}
      <div className="tab-bar">
        {([['profile','👤','Profile'],['notifications','🔔','Notifications'],['plan','💳','Plan & Billing'],['security','🔒','Security']] as [Tab,string,string][]).map(([id,ic,lbl])=>(
          <button key={id} className={`tab-btn ${activeTab===id?'on':''}`} onClick={()=>setActiveTab(id)}>{ic} {lbl}</button>
        ))}
      </div>

      <div className="settings-content">
        <div className="settings-grid">
          <div>

            {/* ── PROFILE TAB ── */}
            {activeTab==='profile'&&(<>
              <div className="panel">
                <div className="p-hd"><div className="p-t">Profile</div><div className="p-s">Your personal info</div></div>
                <div className="p-body">
                  <div className="avatar-row">
                    <div className="avatar-big">{userName[0]?.toUpperCase()||'?'}</div>
                    <div className="avatar-info">
                      <div className="avatar-name">{userName||'Your Name'}</div>
                      <div className="avatar-email">{userEmail}</div>
                    </div>
                  </div>
                  <div className="field">
                    <label>Full name <SaveIndicator field="full_name"/></label>
                    <input type="text" value={userName} placeholder="Your full name"
                      onChange={e=>{setUserName(e.target.value);autosave('full_name',e.target.value);}}/>
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input type="email" value={userEmail} disabled style={{opacity:.6,cursor:'not-allowed'}}/>
                    <div className="field-hint">Email can't be changed here. Contact support if needed.</div>
                  </div>
                  <div className="field">
                    <label>Phone number <SaveIndicator field="phone"/></label>
                    <input type="tel" value={userPhone} placeholder="+1 (416) 555-0123"
                      onChange={e=>{setUserPhone(e.target.value);autosave('phone',e.target.value);}}/>
                    <div className="field-hint">Used for SMS bill reminders. Include country code.</div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="p-hd"><div className="p-t">🌍 Leaderboard Display</div><div className="p-s">How you appear on the global leaderboard</div></div>
                <div className="p-body">
                  <div className="field">
                    <div className="field-row">
                      <div>
                        <label style={{marginBottom:2}}>Show my name publicly <SaveIndicator field="leaderboard_anon"/></label>
                        <div className="field-hint" style={{marginTop:0}}>Off = you appear as &quot;Anonymous&quot;</div>
                      </div>
                      <Toggle on={!leaderboardAnon} onToggle={()=>{const next=!leaderboardAnon;setLeaderboardAnon(next);autosave('leaderboard_anon',next);}}/>
                    </div>
                  </div>
                  {!leaderboardAnon&&(
                    <div className="field">
                      <label>Display name on leaderboard <SaveIndicator field="leaderboard_name"/></label>
                      <input type="text" value={leaderboardName} placeholder="e.g. Aryan K. or leave blank for your full name"
                        onChange={e=>{setLeaderboardName(e.target.value);autosave('leaderboard_name',e.target.value);}}/>
                      <div className="field-hint">Leave blank to use your full name.</div>
                    </div>
                  )}
                </div>
              </div>
            </>)}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab==='notifications'&&(
              <div className="panel">
                <div className="p-hd"><div className="p-t">Notification Preferences</div><div className="p-s">Control when and how Nyra contacts you</div></div>
                <div className="p-body">
                  <div className="field">
                    <div className="field-row">
                      <div>
                        <label style={{marginBottom:2}}>SMS reminders <SaveIndicator field="sms_enabled"/></label>
                        <div className="field-hint" style={{marginTop:0}}>Receive text reminders before bills are due</div>
                      </div>
                      <Toggle on={smsEnabled} onToggle={()=>{const next=!smsEnabled;setSmsEnabled(next);autosave('sms_enabled',next);}}/>
                    </div>
                  </div>
                  {smsEnabled&&(<>
                    <div className="field" style={{marginTop:16}}>
                      <label>Reminder delivery time <SaveIndicator field="reminder_time"/></label>
                      <select value={reminderTime} onChange={e=>{setReminderTime(e.target.value);autosave('reminder_time',e.target.value);}}>
                        <option value="07:00">7:00 AM</option>
                        <option value="08:00">8:00 AM</option>
                        <option value="09:00">9:00 AM (default)</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="17:00">5:00 PM</option>
                        <option value="18:00">6:00 PM</option>
                        <option value="20:00">8:00 PM</option>
                      </select>
                      <div className="field-hint">All reminders are sent at this time on the day they&apos;re scheduled.</div>
                    </div>
                    <div style={{background:'var(--blue-pale)',border:'1px solid rgba(33,119,209,.15)',borderRadius:12,padding:'12px 14px',marginTop:8,fontSize:'.76rem',color:'var(--text2)',lineHeight:1.7}}>
                      📱 Make sure your phone number is saved in Profile so Nyra knows where to send reminders.
                      {!userPhone&&<span style={{color:'var(--warn)',fontWeight:600}}> No phone number on file!</span>}
                    </div>
                  </>)}
                  {!smsEnabled&&(
                    <div style={{background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.2)',borderRadius:12,padding:'12px 14px',marginTop:8,fontSize:'.76rem',color:'var(--text2)',lineHeight:1.7}}>
                      ⚠️ SMS reminders are off. You won&apos;t receive any texts about upcoming bills. Make sure to check Nyra manually.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── PLAN & BILLING TAB ── */}
            {activeTab==='plan'&&(<>
              <div className="panel">
                <div className="p-hd"><div className="p-t">Your Plan</div><div className="p-s">Upgrade or downgrade anytime</div></div>
                <div className="p-body">
                  <div className="plan-cards">
                    {PLANS.map(p=>(
                      <div key={p.id} className={`plan-card ${userPlan===p.id?'current':''}`}>
                        <div className="plan-card-hd">
                          <div className="plan-name" style={{color:p.color}}>{p.id}</div>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div className="plan-price">{p.price}/mo</div>
                            {userPlan===p.id&&<div className="plan-current-badge">Current</div>}
                          </div>
                        </div>
                        <div className="plan-bills">{p.bills}</div>
                        <div className="plan-feats">{p.features.map(f=><div key={f} className="plan-feat">{f}</div>)}</div>
                        {userPlan!==p.id&&(
                          <button className="plan-upgrade-btn" style={{background:p.color,boxShadow:`0 4px 14px ${p.color}44`}}
                            onClick={()=>window.location.href=`/signup?plan=${p.id}&price=${p.price.replace('$','')}`}>
                            {PLANS.indexOf(p)>PLANS.findIndex(pl=>pl.id===userPlan)?'Upgrade':'Downgrade'} to {p.id} →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="p-hd"><div className="p-t">Billing Info</div><div className="p-s">Your subscription details</div></div>
                <div className="p-body">
                  <div className="billing-row"><div className="billing-lbl">Current plan</div><div className="billing-val">{userPlan}</div></div>
                  <div className="billing-row"><div className="billing-lbl">Next billing date</div><div className="billing-val">{billingDate||'—'}</div></div>
                  <div className="billing-row"><div className="billing-lbl">Billing cycle</div><div className="billing-val">Monthly</div></div>
                  <div className="billing-row"><div className="billing-lbl">Payment method</div><div className="billing-val">•••• •••• •••• 4242</div></div>
                </div>
              </div>

              <div className="danger-zone">
                <div className="danger-title">⚠️ Cancel Subscription</div>
                <div className="danger-desc">Cancelling will downgrade you to Basic at the end of your billing period. Your bills and data will be preserved but AI features and advanced analytics will be locked.</div>
                {!cancelConfirm?(
                  <button className="danger-btn" onClick={()=>setCancelConfirm(true)}>Cancel subscription</button>
                ):(
                  <div style={{display:'flex',alignItems:'center',gap:0}}>
                    <span style={{fontSize:'.78rem',color:'var(--text2)'}}>Are you sure?</span>
                    <button className="danger-confirm" onClick={()=>setCancelConfirm(false)}>Yes, cancel</button>
                    <button style={{background:'transparent',border:'none',color:'var(--muted)',padding:'9px 14px',cursor:'pointer',fontSize:'.8rem'}} onClick={()=>setCancelConfirm(false)}>Never mind</button>
                  </div>
                )}
              </div>
            </>)}

            {/* ── SECURITY TAB ── */}
            {activeTab==='security'&&(
              <div className="panel">
                <div className="p-hd"><div className="p-t">Password & Security</div><div className="p-s">Keep your account safe</div></div>
                <div className="p-body">
                  {pwError&&<div className="pw-error">{pwError}</div>}
                  {pwSuccess&&<div className="pw-success">✅ Password updated successfully!</div>}
                  <div className="field">
                    <label>Current password</label>
                    <input type="password" value={pwCurrent} placeholder="••••••••" onChange={e=>setPwCurrent(e.target.value)}/>
                  </div>
                  <div className="field">
                    <label>New password</label>
                    <input type="password" value={pwNew} placeholder="••••••••" onChange={e=>setPwNew(e.target.value)}/>
                    <div className="field-hint">At least 8 characters.</div>
                  </div>
                  <div className="field">
                    <label>Confirm new password</label>
                    <input type="password" value={pwConfirm} placeholder="••••••••" onChange={e=>setPwConfirm(e.target.value)}/>
                  </div>
                  <button className="pw-btn" onClick={changePassword} disabled={!pwNew||!pwConfirm}>Update password →</button>
                  <div style={{marginTop:24,paddingTop:20,borderTop:'1px solid var(--border)'}}>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:'.88rem',color:'var(--text)',marginBottom:6}}>Sign out</div>
                    <div style={{fontSize:'.76rem',color:'var(--muted)',marginBottom:12}}>Sign out of your Nyra account on this device.</div>
                    <button style={{background:'transparent',border:'1.5px solid var(--border)',color:'var(--text2)',padding:'9px 20px',borderRadius:10,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'.82rem',fontWeight:600,cursor:'pointer',transition:'all .2s'}}
                      onClick={async()=>{await supabase.auth.signOut();window.location.href='/';}}>
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COL */}
          <div className="right-col">
            <div className="tip-card">
              <div className="tip-title">💡 Pro tip</div>
              <div className="tip-body">
                {activeTab==='profile'&&'Add your phone number to make sure Nyra can reach you with bill reminders. Without it, you won\'t receive any SMS alerts.'}
                {activeTab==='notifications'&&'Setting your reminder time to the morning (8–9am) means you\'ll see alerts before your day gets busy — giving you more time to move money if needed.'}
                {activeTab==='plan'&&'Upgrading to Power gives you unlimited AI coach messages, memory between sessions, and proactive insights when Nyra spots something in your finances.'}
                {activeTab==='security'&&'Use a unique password for Nyra that you don\'t use elsewhere. Your financial data deserves its own lock. 🔐'}
              </div>
            </div>
            <div className="panel" style={{padding:'20px 22px'}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:'.88rem',color:'var(--text)',marginBottom:12}}>🎓 FFE Mission</div>
              <div style={{fontSize:'.76rem',color:'var(--text2)',lineHeight:1.75,marginBottom:14}}>20% of all Nyra profits go directly to Financial Futures Education — delivering financial literacy to youth across Canada.</div>
              <a href="https://financialfutureseducation.com/" target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:6,fontSize:'.76rem',fontWeight:600,color:'var(--gold)',textDecoration:'none'}}>Visit FFE →</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  </>);
}
