'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Tab = 'profile'|'notifications'|'plan'|'security'|'feedback';

const PLANS = [
  {id:'Basic', price:'$3',bills:'Up to 5 bills',features:['SMS reminders','Basic badges','Money IQ score'],color:'#7a90aa'},
  {id:'Plus',  price:'$5',bills:'Up to 15 bills',features:['Everything in Basic','AI coach (10 msg/mo)','Statement upload','Analytics & Learn tab','All badges + social sharing'],color:'#2177d1'},
  {id:'Power', price:'$8',bills:'Unlimited bills',features:['Everything in Plus','Unlimited AI coach','AI memory between sessions','Proactive AI insights','Secret badges'],color:'#7c3aed'},
];

export default function SettingsPage(){
  const[activeTab,setActiveTab]=useState<Tab>('profile');
  const[firstName,setFirstName]=useState('');
  const[middleName,setMiddleName]=useState('');
  const[lastName,setLastName]=useState('');
  const[userEmail,setUserEmail]=useState('');
  const[userPhone,setUserPhone]=useState('');
  const[userPlan,setUserPlan]=useState('Plus');
  const[leaderboardAnon,setLeaderboardAnon]=useState(true);
  const[leaderboardName,setLeaderboardName]=useState('');
  const[smsEnabled,setSmsEnabled]=useState(true);
  const[emailPref,setEmailPref]=useState<'none'|'email'|'both'>('both');
  const[confirmPayments,setConfirmPayments]=useState(true);
  const[reminderTime,setReminderTime]=useState('09:00');
  const[saving,setSaving]=useState<string|null>(null);
  const[saved,setSaved]=useState<string|null>(null);
  const[billingDate,setBillingDate]=useState('');
  const[pwCurrent,setPwCurrent]=useState('');
  const[pwNew,setPwNew]=useState('');
  const[pwConfirm,setPwConfirm]=useState('');
  const[pwError,setPwError]=useState('');
  const[pwSuccess,setPwSuccess]=useState(false);
  const[cancelConfirm,setCancelConfirm]=useState(false);
  const saveTimer=useRef<Record<string,NodeJS.Timeout>>({});
  const userIdRef=useRef<string>(''); // Use ref to avoid closure issues
  
  // Feedback state
  const[feedbackCategory,setFeedbackCategory]=useState<'bug'|'feature'|'general'|'complaint'>('general');
  const[feedbackSubject,setFeedbackSubject]=useState('');
  const[feedbackMessage,setFeedbackMessage]=useState('');
  const[feedbackSubmitting,setFeedbackSubmitting]=useState(false);
  const[feedbackSuccess,setFeedbackSuccess]=useState(false);
  const[feedbackError,setFeedbackError]=useState('');
  const[pastFeedback,setPastFeedback]=useState<{id:string;category:string;subject:string;status:string;created_at:string}[]>([]);
  
  // Phone verification state
  const[phoneCountry,setPhoneCountry]=useState('CA');
  const[phoneNumber,setPhoneNumber]=useState('');
  const[phoneVerified,setPhoneVerified]=useState(false);
  const[verifyStep,setVerifyStep]=useState<'idle'|'sending'|'code'|'verifying'>('idle');
  const[verifyCode,setVerifyCode]=useState('');
  const[verifyError,setVerifyError]=useState('');
  const[createdAt,setCreatedAt]=useState<Date|null>(null);
  const[billCount,setBillCount]=useState(0);
  
  // Computed full name for display
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ') || 'Your Name';
  const displayInitial = firstName?.[0]?.toUpperCase() || '?';
  
  // Country codes for phone
  const COUNTRIES=[
    {code:'CA',dial:'+1',flag:'🇨🇦',name:'Canada'},
    {code:'US',dial:'+1',flag:'🇺🇸',name:'United States'},
    {code:'GB',dial:'+44',flag:'🇬🇧',name:'United Kingdom'},
    {code:'AU',dial:'+61',flag:'🇦🇺',name:'Australia'},
    {code:'IN',dial:'+91',flag:'🇮🇳',name:'India'},
    {code:'DE',dial:'+49',flag:'🇩🇪',name:'Germany'},
    {code:'FR',dial:'+33',flag:'🇫🇷',name:'France'},
    {code:'MX',dial:'+52',flag:'🇲🇽',name:'Mexico'},
    {code:'BR',dial:'+55',flag:'🇧🇷',name:'Brazil'},
    {code:'JP',dial:'+81',flag:'🇯🇵',name:'Japan'},
  ];

  useEffect(()=>{
    async function load(){
      console.log('Settings: load() starting...');
      const{data:{user}}=await supabase.auth.getUser();
      
      // Use logged in user, or fallback for testing
      let uid = user?.id || '';
      if(!uid){
        // Fallback for testing - same as dashboard
        uid = 'ef38b136-4454-4599-9eb8-06a4197dfed5';
        console.log('Settings: No user session, using fallback userId');
      }
      
      console.log('Settings: user =', uid);
      userIdRef.current = uid;
      console.log('Settings: userIdRef set to', userIdRef.current);
      setUserEmail(user?.email||'');
      
      // Get profile
      const{data:prof}=await supabase.from('profiles').select('*').eq('id',uid).single();
      console.log('Settings: profile loaded', prof?.full_name);
      if(prof){
        // Load separate name fields if they exist, otherwise parse full_name
        if(prof.first_name){
          setFirstName(prof.first_name||'');
          setMiddleName(prof.middle_name||'');
          setLastName(prof.last_name||'');
        }else if(prof.full_name){
          // Parse existing full_name into parts and save them
          const nameParts=(prof.full_name||'').trim().split(/\s+/);
          let first='',middle='',last='';
          if(nameParts.length===1){
            first=nameParts[0];
          }else if(nameParts.length===2){
            first=nameParts[0];
            last=nameParts[1];
          }else if(nameParts.length>=3){
            first=nameParts[0];
            middle=nameParts.slice(1,-1).join(' ');
            last=nameParts[nameParts.length-1];
          }
          setFirstName(first);
          setMiddleName(middle);
          setLastName(last);
          
          // Save parsed names to database so dashboard can use first_name
          if(first){
           if (!user) return;

          await supabase
            .from('profiles')
            .update({
              first_name: first || null,
              middle_name: middle || null,
              last_name: last || null
            }).eq('id', user!.id);
          }
        }
        
        setUserPhone(prof.phone_number||prof.phone||'');
        setUserPlan(prof.plan||'Plus');
        setSmsEnabled(prof.sms_enabled!==false);
        setEmailPref(prof.email_pref||'both');
        setConfirmPayments(prof.confirm_payments!==false);
        setReminderTime(prof.reminder_time||'09:00');
        setLeaderboardAnon(prof.leaderboard_anon!==false);
        setLeaderboardName(prof.leaderboard_name||'');
        setPhoneVerified(prof.phone_verified===true);
        setCreatedAt(prof.created_at?new Date(prof.created_at):null);
        
        // Parse existing phone to separate country/number
        const phone=prof.phone_number||prof.phone||'';
        if(phone){
          // Try to detect country code
          const country=COUNTRIES.find(c=>phone.startsWith(c.dial));
          if(country){
            setPhoneCountry(country.code);
            setPhoneNumber(phone.replace(country.dial,'').replace(/\D/g,''));
          }else{
            setPhoneNumber(phone.replace(/\D/g,''));
          }
        }
        
        // Mock billing date — in real app from Stripe
        const created=new Date(prof.created_at||Date.now());
        const next=new Date(created);
        next.setMonth(next.getMonth()+1);
        setBillingDate(next.toLocaleDateString('en-CA',{month:'long',day:'numeric',year:'numeric'}));
      }
      
      // Get bill count
      const{count}=await supabase.from('bills').select('*',{count:'exact',head:true}).eq('user_id',uid);
      setBillCount(count||0);
      
      // Load past feedback
      const{data:fb}=await supabase.from('feedback').select('id,category,subject,status,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(5);
      if(fb)setPastFeedback(fb);
    }
    load();
  },[]);

  function autosave(field:string, value:any){
    const uid=userIdRef.current;
    if(!uid){
      console.error('autosave: userId is empty, cannot save');
      return;
    }
    setSaving(field);
    if(saveTimer.current[field]) clearTimeout(saveTimer.current[field]);
    saveTimer.current[field]=setTimeout(async()=>{
      const{error}=await supabase.from('profiles').update({[field]:value}).eq('id',uid);
      if(error){
        console.error('autosave error:',error);
      }else{
        console.log('autosave success:',field,'=',value,'for user',uid);
      }
      setSaving(null);setSaved(field);
      setTimeout(()=>setSaved(null),2000);
    },600);
  }
  
  // Format phone number as user types
  function formatPhoneNumber(value:string):string{
    const digits=value.replace(/\D/g,'');
    if(digits.length<=3)return digits;
    if(digits.length<=6)return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6,10)}`;
  }
  
  // Get full phone number with country code
  function getFullPhone():string{
    const country=COUNTRIES.find(c=>c.code===phoneCountry);
    const digits=phoneNumber.replace(/\D/g,'');
    if(!country||!digits)return '';
    return `${country.dial}${digits}`;
  }
  
  // Save phone number
  async function savePhone(){
    const fullPhone=getFullPhone();
    if(!fullPhone)return;
    setSaving('phone_number');
    await supabase.from('profiles').update({
      phone_number:fullPhone,
      phone_verified:false
    }).eq('id',userIdRef.current);
    setUserPhone(fullPhone);
    setPhoneVerified(false);
    setSaving(null);
    setSaved('phone_number');
    setTimeout(()=>setSaved(null),2000);
  }
  
  // Send verification code (mock for now - would connect to Twilio)
  async function sendVerificationCode(){
    const fullPhone=getFullPhone();
    if(!fullPhone){setVerifyError('Please enter a phone number first.');return;}
    
    setVerifyStep('sending');
    setVerifyError('');
    
    // Simulate sending code
    await new Promise(r=>setTimeout(r,1500));
    
    // In production, this would call a Twilio API via Next.js API route
    // For now, we'll simulate with a mock code
    setVerifyStep('code');
  }
  
  // Verify the code
  async function submitVerifyCode(){
    if(verifyCode.length!==6){setVerifyError('Please enter the 6-digit code.');return;}
    
    setVerifyStep('verifying');
    setVerifyError('');
    
    // Simulate verification
    await new Promise(r=>setTimeout(r,1000));
    
    // Mock: accept any 6-digit code for demo
    // In production, validate against Twilio
    await supabase.from('profiles').update({phone_verified:true}).eq('id',userIdRef.current);
    setPhoneVerified(true);
    setVerifyStep('idle');
    setVerifyCode('');
  }

  async function changePassword(){
    setPwError('');setPwSuccess(false);
    if(pwNew!==pwConfirm){setPwError('New passwords don\'t match.');return;}
    if(pwNew.length<8){setPwError('Password must be at least 8 characters.');return;}
    const{error}=await supabase.auth.updateUser({password:pwNew});
    if(error){setPwError(error.message);return;}
    setPwSuccess(true);setPwCurrent('');setPwNew('');setPwConfirm('');
  }
  
  async function submitFeedback(){
    if(!feedbackSubject.trim()){setFeedbackError('Please enter a subject.');return;}
    if(!feedbackMessage.trim()){setFeedbackError('Please enter your feedback.');return;}
    
    setFeedbackSubmitting(true);
    setFeedbackError('');
    
    try{
      // Insert into Supabase
      const{data,error}=await supabase.from('feedback').insert({
        user_id:userIdRef.current||null,
        user_email:userEmail,
        category:feedbackCategory,
        subject:feedbackSubject.trim(),
        message:feedbackMessage.trim(),
      }).select().single();
      
      if(error){
        throw new Error(error.message || error.code || 'Database error');
      }
      
      // Add to past feedback list
      if(data){
        setPastFeedback(prev=>[{
          id:data.id,
          category:data.category,
          subject:data.subject,
          status:data.status||'new',
          created_at:data.created_at
        },...prev].slice(0,5));
      }
      
      // Clear form
      setFeedbackSubject('');
      setFeedbackMessage('');
      setFeedbackSuccess(true);
      setTimeout(()=>setFeedbackSuccess(false),5000);
    }catch(err:any){
      console.error('Feedback submit error:',err);
      setFeedbackError(err.message||'Failed to submit feedback. Please try again.');
    }finally{
      setFeedbackSubmitting(false);
    }
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
      
      /* ═══ PROFILE HERO ═══ */
      .profile-hero{background:linear-gradient(135deg,var(--blue-pale),rgba(99,102,241,.04));border:1px solid var(--border);border-radius:20px;padding:24px 28px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;}
      .profile-hero-left{display:flex;align-items:center;gap:20px;}
      .profile-avatar-large{width:80px;height:80px;border-radius:20px;background:linear-gradient(135deg,var(--blue),#6366f1);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 8px 24px rgba(33,119,209,.25);}
      .profile-avatar-large span{font-family:'Plus Jakarta Sans',sans-serif;font-size:2rem;font-weight:800;color:white;}
      .profile-hero-info{display:flex;flex-direction:column;gap:4px;}
      .profile-hero-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.35rem;color:var(--text);letter-spacing:-.02em;}
      .profile-hero-email{font-size:.84rem;color:var(--muted);}
      .profile-hero-meta{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;}
      .profile-meta-item{display:flex;align-items:center;gap:5px;font-size:.74rem;color:var(--text2);background:white;padding:4px 10px;border-radius:100px;border:1px solid var(--border);}
      .profile-meta-item.plus{color:var(--blue);background:var(--blue-pale);border-color:rgba(33,119,209,.15);}
      .profile-meta-item.power{color:#7c3aed;background:rgba(124,58,237,.08);border-color:rgba(124,58,237,.15);}
      .profile-meta-icon{font-size:.8rem;}
      
      /* ═══ FIELD LOCKED ═══ */
      .field-locked{position:relative;display:flex;align-items:center;}
      .field-locked input{flex:1;background:#f8fafc;opacity:.7;cursor:not-allowed;}
      .field-locked-badge{position:absolute;right:12px;font-size:.65rem;font-weight:700;color:var(--success);background:rgba(34,197,94,.1);padding:3px 8px;border-radius:100px;}
      
      /* ═══ NAME FIELDS ═══ */
      .name-fields-row{display:grid;grid-template-columns:1.2fr .8fr 1.2fr;gap:12px;margin-bottom:18px;}
      .name-field-first,.name-field-middle,.name-field-last{margin-bottom:0;}
      @media(max-width:600px){.name-fields-row{grid-template-columns:1fr;gap:14px;}}
      
      /* ═══ PHONE INPUT ═══ */
      .verified-badge{font-size:.68rem;font-weight:700;color:var(--success);background:rgba(34,197,94,.1);padding:4px 10px;border-radius:100px;}
      .phone-input-row{display:flex;gap:10px;align-items:stretch;}
      .phone-country{flex-shrink:0;}
      .phone-country-select{height:100%;padding:10px 12px;background:white;border:1.5px solid var(--border);border-radius:10px;font-size:.9rem;cursor:pointer;outline:none;min-width:100px;}
      .phone-country-select:focus{border-color:var(--blue);}
      .phone-number-field{flex:1;position:relative;display:flex;align-items:center;gap:8px;}
      .phone-input{flex:1;background:white;border:1.5px solid var(--border);border-radius:10px;padding:10px 14px;font-family:'Inter',sans-serif;font-size:.9rem;color:var(--text);outline:none;transition:border .2s;letter-spacing:.02em;}
      .phone-input:focus{border-color:var(--blue);}
      .phone-status{margin-top:14px;}
      .phone-actions{display:flex;gap:10px;}
      .phone-save-btn{padding:9px 18px;background:white;border:1.5px solid var(--border);border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;font-weight:600;color:var(--text2);cursor:pointer;transition:all .2s;}
      .phone-save-btn:hover{border-color:var(--blue);color:var(--blue);}
      .phone-verify-btn{padding:9px 18px;background:var(--blue);border:none;border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;font-weight:600;color:white;cursor:pointer;transition:all .2s;}
      .phone-verify-btn:hover{background:var(--blue-d);}
      .phone-verify-status{display:flex;align-items:center;gap:10px;font-size:.82rem;color:var(--text2);}
      .phone-spinner{width:18px;height:18px;border:2px solid var(--border);border-top-color:var(--blue);border-radius:50%;animation:spin .8s linear infinite;}
      @keyframes spin{to{transform:rotate(360deg)}}
      .phone-code-entry{display:flex;flex-direction:column;gap:10px;}
      .phone-code-label{font-size:.8rem;color:var(--text2);}
      .phone-code-row{display:flex;gap:10px;}
      .phone-code-input{width:140px;background:white;border:1.5px solid var(--border);border-radius:10px;padding:10px 14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:1.1rem;font-weight:600;letter-spacing:.3em;text-align:center;outline:none;}
      .phone-code-input:focus{border-color:var(--blue);}
      .phone-verify-submit{padding:10px 20px;background:var(--blue);border:none;border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;font-weight:600;color:white;cursor:pointer;}
      .phone-verify-submit:disabled{background:var(--border);cursor:not-allowed;}
      .phone-resend{background:none;border:none;font-size:.74rem;color:var(--blue);cursor:pointer;text-decoration:underline;padding:0;}
      .phone-error{font-size:.76rem;color:var(--danger);margin-top:8px;}
      .phone-verified-msg{display:flex;align-items:center;gap:8px;font-size:.8rem;color:var(--success);background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:10px;padding:12px 16px;}
      .phone-empty-msg{display:flex;align-items:center;gap:8px;font-size:.8rem;color:var(--warn);background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15);border-radius:10px;padding:12px 16px;}
      
      /* RIGHT SIDEBAR */
      .right-col{display:flex;flex-direction:column;gap:16px;}
      .tip-card{background:linear-gradient(135deg,rgba(33,119,209,.05),rgba(195,154,53,.03));border:1px solid rgba(195,154,53,.18);border-radius:18px;padding:20px;}
      .tip-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--text);margin-bottom:8px;}
      .tip-body{font-size:.78rem;color:var(--text2);line-height:1.75;}
      
      /* ═══ NOTIFICATIONS TAB STYLES ═══ */
      .notif-status{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:14px;margin-bottom:4px;}
      .notif-status.on{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);}
      .notif-status.off{background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.15);}
      .notif-status-icon{font-size:1.4rem;}
      .notif-status-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--text);}
      .notif-status-sub{font-size:.75rem;color:var(--muted);margin-top:2px;}
      .notif-fix-link{font-size:.75rem;font-weight:600;color:var(--blue);text-decoration:none;margin-left:auto;white-space:nowrap;}
      .notif-fix-link:hover{text-decoration:underline;}
      .notif-email-info{display:flex;align-items:center;gap:10px;background:var(--blue-pale);border:1px solid rgba(33,119,209,.12);border-radius:10px;padding:12px 14px;margin-top:16px;font-size:.76rem;color:var(--text2);}
      .notif-email-info strong{color:var(--text);font-weight:600;}
      
      /* Email Options */
      .email-options{display:flex;flex-direction:column;gap:10px;}
      .email-option{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:14px;border:1.5px solid var(--border);background:white;cursor:pointer;transition:all .2s;}
      .email-option:hover{border-color:rgba(33,119,209,.3);background:rgba(33,119,209,.02);}
      .email-option.selected{border-color:var(--blue);background:var(--blue-pale);}
      .email-option-icon{font-size:1.3rem;}
      .email-option-content{flex:1;}
      .email-option-label{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.84rem;color:var(--text);}
      .email-option-sub{font-size:.72rem;color:var(--muted);margin-top:2px;}
      .email-option-check{color:var(--blue);font-weight:700;font-size:.9rem;}
      
      /* Confirm Payment Options */
      .confirm-options{display:flex;flex-direction:column;gap:12px;}
      .confirm-option{padding:18px;border-radius:16px;border:1.5px solid var(--border);background:white;cursor:pointer;transition:all .2s;}
      .confirm-option:hover{border-color:rgba(33,119,209,.3);box-shadow:0 4px 12px rgba(12,21,36,.06);}
      .confirm-option.selected{border-color:var(--blue);background:linear-gradient(135deg,rgba(33,119,209,.04),rgba(33,119,209,.08));}
      .confirm-option-header{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
      .confirm-option-icon{font-size:1.2rem;}
      .confirm-option-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.9rem;color:var(--text);flex:1;}
      .confirm-option-check{color:var(--blue);font-weight:700;font-size:.9rem;}
      .confirm-option-desc{font-size:.76rem;color:var(--text2);line-height:1.7;padding-left:30px;}
      .confirm-option-tag{display:inline-block;font-size:.65rem;font-weight:700;padding:4px 10px;border-radius:100px;margin-top:10px;margin-left:30px;}
      .confirm-option-tag.recommended{background:rgba(34,197,94,.1);color:var(--success);}
      
      /* Coming Soon Badge */
      .coming-soon-badge{font-size:.65rem;font-weight:700;color:var(--muted);background:var(--bg);padding:5px 12px;border-radius:100px;border:1px solid var(--border);}
      
      /* ═══ PLAN & BILLING TAB STYLES ═══ */
      .plan-hero{display:flex;align-items:center;gap:18px;padding:24px;background:linear-gradient(135deg,rgba(33,119,209,.04),rgba(195,154,53,.04));border:1px solid rgba(33,119,209,.12);border-radius:20px;margin-bottom:20px;}
      .plan-hero-badge{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;color:white;}
      .plan-hero-info{flex:1;}
      .plan-hero-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.2rem;color:var(--text);}
      .plan-hero-price{font-size:1.5rem;font-weight:700;color:var(--text);margin-top:2px;}
      .plan-hero-price span{font-size:.85rem;font-weight:500;color:var(--muted);}
      .plan-hero-status{display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:600;color:var(--success);background:rgba(34,197,94,.1);padding:8px 14px;border-radius:100px;}
      .plan-status-dot{width:8px;height:8px;border-radius:50%;background:var(--success);animation:pulse 2s infinite;}
      @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}
      
      .plan-cards-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
      .plan-card-v2{position:relative;padding:24px;border-radius:18px;border:1.5px solid var(--border);background:white;transition:all .3s;}
      .plan-card-v2:hover{border-color:rgba(33,119,209,.3);box-shadow:0 8px 24px rgba(12,21,36,.08);}
      .plan-card-v2.current{border-color:var(--blue);background:linear-gradient(135deg,rgba(33,119,209,.03),rgba(33,119,209,.06));}
      .plan-popular{position:absolute;top:-10px;left:50%;transform:translateX(-50%);font-size:.65rem;font-weight:700;color:white;background:linear-gradient(135deg,var(--blue),#6366f1);padding:4px 12px;border-radius:100px;}
      .plan-card-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;margin-bottom:14px;}
      .plan-card-name{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.1rem;margin-bottom:6px;}
      .plan-card-price{font-size:1.6rem;font-weight:700;color:var(--text);margin-bottom:4px;}
      .plan-card-price span{font-size:.8rem;font-weight:500;color:var(--muted);}
      .plan-card-bills{font-size:.78rem;color:var(--muted);margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border);}
      .plan-card-features{display:flex;flex-direction:column;gap:10px;margin-bottom:20px;}
      .plan-card-feat{display:flex;align-items:flex-start;gap:8px;font-size:.76rem;color:var(--text2);line-height:1.5;}
      .plan-feat-check{font-weight:700;flex-shrink:0;}
      .plan-current-label{text-align:center;font-size:.78rem;font-weight:700;color:var(--blue);padding:12px;background:var(--blue-pale);border-radius:10px;}
      .plan-action-btn{width:100%;padding:12px;border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;transition:all .2s;border:none;}
      .plan-action-btn.upgrade{color:white;}
      .plan-action-btn.upgrade:hover{transform:translateY(-2px);}
      .plan-action-btn.downgrade{background:transparent;border:1.5px solid var(--border);color:var(--text2);}
      .plan-action-btn.downgrade:hover{border-color:var(--text2);}
      
      .billing-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;}
      .billing-item{display:flex;align-items:center;gap:14px;padding:16px;background:var(--bg);border-radius:14px;}
      .billing-item-icon{font-size:1.3rem;}
      .billing-item-content{flex:1;}
      .billing-item-label{font-size:.72rem;color:var(--muted);margin-bottom:2px;}
      .billing-item-value{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--text);}
      .billing-item-action{background:transparent;border:1px solid var(--border);color:var(--blue);padding:6px 12px;border-radius:8px;font-size:.72rem;font-weight:600;cursor:pointer;}
      .billing-actions{display:flex;gap:10px;}
      .billing-btn{flex:1;padding:12px;background:transparent;border:1.5px solid var(--border);border-radius:10px;font-size:.78rem;font-weight:600;color:var(--text2);cursor:pointer;transition:all .2s;}
      .billing-btn:hover{border-color:var(--blue);color:var(--blue);}
      
      .danger-zone{background:rgba(239,68,68,.03);border:1px solid rgba(239,68,68,.15);border-radius:18px;padding:20px;}
      .danger-zone-header{display:flex;gap:14px;margin-bottom:16px;}
      .danger-icon{font-size:1.4rem;}
      .danger-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.92rem;color:var(--danger);margin-bottom:4px;}
      .danger-desc{font-size:.76rem;color:var(--text2);line-height:1.7;}
      .danger-btn{background:transparent;border:1.5px solid rgba(239,68,68,.3);color:var(--danger);padding:10px 18px;border-radius:10px;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .2s;}
      .danger-btn:hover{background:rgba(239,68,68,.08);}
      .danger-confirm-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
      .danger-confirm-text{font-size:.78rem;color:var(--text2);}
      .danger-confirm-yes{background:var(--danger);color:white;border:none;padding:10px 16px;border-radius:10px;font-size:.78rem;font-weight:600;cursor:pointer;}
      .danger-confirm-no{background:transparent;border:none;color:var(--muted);padding:10px 16px;font-size:.78rem;cursor:pointer;}
      
      /* ═══ SECURITY TAB STYLES ═══ */
      .security-overview{display:flex;gap:30px;padding:24px;background:linear-gradient(135deg,rgba(34,197,94,.04),rgba(33,119,209,.04));border:1px solid rgba(34,197,94,.15);border-radius:20px;margin-bottom:20px;}
      .security-score{display:flex;align-items:center;gap:16px;}
      .security-score-ring{position:relative;width:70px;height:70px;}
      .security-score-ring svg{width:100%;height:100%;transform:rotate(-90deg);}
      .security-score-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.6rem;}
      .security-score-info{}
      .security-score-label{font-size:.75rem;color:var(--muted);margin-bottom:4px;}
      .security-score-status{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1.1rem;}
      .security-score-status.good{color:var(--success);}
      .security-score-status.fair{color:var(--warn);}
      .security-checklist{display:flex;flex-direction:column;gap:8px;flex:1;}
      .security-check{display:flex;align-items:center;gap:10px;font-size:.78rem;color:var(--text2);}
      .security-check.done{color:var(--success);}
      .security-check.pending{color:var(--warn);}
      
      .pw-strength{height:4px;background:var(--border);border-radius:100px;margin-top:8px;overflow:hidden;}
      .pw-strength-bar{height:100%;border-radius:100px;transition:all .3s;}
      .pw-strength-bar.weak{background:var(--danger);}
      .pw-strength-bar.medium{background:var(--warn);}
      .pw-strength-bar.strong{background:var(--success);}
      .field-error{font-size:.72rem;color:var(--danger);margin-top:6px;}
      
      .session-item{display:flex;align-items:center;gap:14px;padding:16px;background:var(--bg);border-radius:14px;margin-bottom:14px;}
      .session-item.current{border:1px solid rgba(34,197,94,.2);background:rgba(34,197,94,.04);}
      .session-icon{font-size:1.4rem;}
      .session-info{flex:1;}
      .session-device{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.88rem;color:var(--text);}
      .session-details{font-size:.72rem;color:var(--muted);margin-top:2px;}
      .session-badge{font-size:.68rem;font-weight:700;color:var(--success);background:rgba(34,197,94,.1);padding:4px 10px;border-radius:100px;}
      .signout-all-btn{width:100%;padding:12px;background:transparent;border:1.5px solid var(--border);border-radius:10px;font-size:.78rem;font-weight:600;color:var(--text2);cursor:pointer;transition:all .2s;}
      .signout-all-btn:hover{border-color:var(--danger);color:var(--danger);}
      
      @media(max-width:1000px){.settings-grid{grid-template-columns:1fr;}.profile-hero{flex-direction:column;text-align:center;}.profile-hero-left{flex-direction:column;}.profile-hero-meta{justify-content:center;}.plan-cards-grid{grid-template-columns:1fr;}.billing-grid{grid-template-columns:1fr;}.security-overview{flex-direction:column;gap:20px;}}
      @media(max-width:700px){.sb{display:none;}.main{margin-left:0;padding:16px;}.phone-input-row{flex-direction:column;}.phone-actions{flex-direction:column;}.confirm-option-desc{padding-left:0;}.confirm-option-tag{margin-left:0;}.billing-actions{flex-direction:column;}}

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
          <div className="u-av">{displayInitial}</div>
          <div><div className="u-name">{firstName||'Loading...'}</div></div>
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
        {([['profile','👤','Profile'],['notifications','🔔','Notifications'],['plan','💳','Plan & Billing'],['security','🔒','Security'],['feedback','💬','Feedback']] as [Tab,string,string][]).map(([id,ic,lbl])=>(
          <button key={id} className={`tab-btn ${activeTab===id?'on':''}`} onClick={()=>setActiveTab(id)}>{ic} {lbl}</button>
        ))}
      </div>

      <div className="settings-content">
        <div className="settings-grid">
          <div>

            {/* ── PROFILE TAB ── */}
            {activeTab==='profile'&&(<>
              {/* Account Overview Card */}
              <div className="profile-hero">
                <div className="profile-hero-left">
                  <div className="profile-avatar-large">
                    <span>{displayInitial}</span>
                  </div>
                  <div className="profile-hero-info">
                    <div className="profile-hero-name">{fullName}</div>
                    <div className="profile-hero-email">{userEmail}</div>
                    <div className="profile-hero-meta">
                      <span className="profile-meta-item">
                        <span className="profile-meta-icon">📅</span>
                        Member since {createdAt?createdAt.toLocaleDateString('en-CA',{month:'short',year:'numeric'}):'—'}
                      </span>
                      <span className="profile-meta-item">
                        <span className="profile-meta-icon">📋</span>
                        {billCount} bill{billCount!==1?'s':''} tracked
                      </span>
                      <span className={`profile-meta-item ${userPlan==='Power'?'power':userPlan==='Plus'?'plus':''}`}>
                        <span className="profile-meta-icon">✨</span>
                        {userPlan} Plan
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="panel">
                <div className="p-hd"><div className="p-t">Personal Information</div><div className="p-s">Your account details</div></div>
                <div className="p-body">
                  {/* Name fields row */}
                  <div className="name-fields-row">
                    <div className="field name-field-first">
                      <label>First name <SaveIndicator field="first_name"/></label>
                      <input type="text" value={firstName} placeholder="First"
                        onChange={e=>{setFirstName(e.target.value);autosave('first_name',e.target.value);}}/>
                    </div>
                    <div className="field name-field-middle">
                      <label>Middle <SaveIndicator field="middle_name"/></label>
                      <input type="text" value={middleName} placeholder="Middle (optional)"
                        onChange={e=>{setMiddleName(e.target.value);autosave('middle_name',e.target.value);}}/>
                    </div>
                    <div className="field name-field-last">
                      <label>Last name <SaveIndicator field="last_name"/></label>
                      <input type="text" value={lastName} placeholder="Last"
                        onChange={e=>{setLastName(e.target.value);autosave('last_name',e.target.value);}}/>
                    </div>
                  </div>
                  <div className="field-hint" style={{marginTop:'-10px',marginBottom:'18px'}}>
                    Your first name is used for personalized greetings throughout the app.
                  </div>
                  
                  <div className="field">
                    <label>Email address</label>
                    <div className="field-locked">
                      <input type="email" value={userEmail} disabled/>
                      <span className="field-locked-badge">Verified ✓</span>
                    </div>
                    <div className="field-hint">Email can't be changed here. Contact support if needed.</div>
                  </div>
                </div>
              </div>

              {/* Phone Number - Enhanced Section */}
              <div className="panel">
                <div className="p-hd">
                  <div>
                    <div className="p-t">📱 Phone Number</div>
                    <div className="p-s">Required for SMS bill reminders</div>
                  </div>
                  {phoneVerified&&<div className="verified-badge">✓ Verified</div>}
                </div>
                <div className="p-body">
                  <div className="phone-input-row">
                    {/* Country selector */}
                    <div className="phone-country">
                      <select 
                        value={phoneCountry} 
                        onChange={e=>{setPhoneCountry(e.target.value);setPhoneVerified(false);}}
                        className="phone-country-select"
                      >
                        {COUNTRIES.map(c=>(
                          <option key={c.code} value={c.code}>{c.flag} {c.dial}</option>
                        ))}
                      </select>
                    </div>
                    {/* Phone number input */}
                    <div className="phone-number-field">
                      <input 
                        type="tel" 
                        value={formatPhoneNumber(phoneNumber)}
                        placeholder="(416) 555-0123"
                        onChange={e=>{
                          const digits=e.target.value.replace(/\D/g,'').slice(0,10);
                          setPhoneNumber(digits);
                          setPhoneVerified(false);
                        }}
                        className="phone-input"
                      />
                      <SaveIndicator field="phone_number"/>
                    </div>
                  </div>
                  
                  {/* Phone status and actions */}
                  <div className="phone-status">
                    {phoneNumber.length>=10&&!phoneVerified&&verifyStep==='idle'&&(
                      <div className="phone-actions">
                        <button className="phone-save-btn" onClick={savePhone}>
                          Save Number
                        </button>
                        <button className="phone-verify-btn" onClick={sendVerificationCode}>
                          Verify via SMS
                        </button>
                      </div>
                    )}
                    
                    {verifyStep==='sending'&&(
                      <div className="phone-verify-status">
                        <div className="phone-spinner"/>
                        <span>Sending verification code...</span>
                      </div>
                    )}
                    
                    {verifyStep==='code'&&(
                      <div className="phone-code-entry">
                        <div className="phone-code-label">Enter the 6-digit code sent to {getFullPhone()}</div>
                        <div className="phone-code-row">
                          <input 
                            type="text" 
                            value={verifyCode}
                            onChange={e=>setVerifyCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                            placeholder="000000"
                            className="phone-code-input"
                            maxLength={6}
                          />
                          <button 
                            className="phone-verify-submit" 
                            onClick={submitVerifyCode}
                            disabled={verifyCode.length!==6||(verifyStep as string)==='verifying'}
                          >
                            {(verifyStep as string)==='verifying'?'Verifying...':'Verify'}
                          </button>
                        </div>
                        <button className="phone-resend" onClick={sendVerificationCode}>
                          Didn't receive it? Resend code
                        </button>
                      </div>
                    )}
                    
                    {verifyError&&<div className="phone-error">{verifyError}</div>}
                    
                    {phoneVerified&&(
                      <div className="phone-verified-msg">
                        <span>✅</span> Your phone number is verified. You'll receive SMS reminders at this number.
                      </div>
                    )}
                    
                    {!phoneNumber&&(
                      <div className="phone-empty-msg">
                        <span>⚠️</span> Add your phone number to receive SMS bill reminders. Without it, you'll only get email notifications.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Leaderboard Display */}
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
            {activeTab==='notifications'&&(<>
              {/* SMS Reminders Section */}
              <div className="panel">
                <div className="p-hd">
                  <div>
                    <div className="p-t">📱 SMS Reminders</div>
                    <div className="p-s">Get text messages before bills are due</div>
                  </div>
                  <Toggle on={smsEnabled} onToggle={()=>{const next=!smsEnabled;setSmsEnabled(next);autosave('sms_enabled',next);}}/>
                </div>
                <div className="p-body">
                  {smsEnabled?(
                    <>
                      <div className="notif-status on">
                        <span className="notif-status-icon">✅</span>
                        <div>
                          <div className="notif-status-title">SMS reminders are on</div>
                          <div className="notif-status-sub">
                            {userPhone?`Sending to ${userPhone}`:'No phone number saved yet'}
                          </div>
                        </div>
                        {!userPhone&&<a href="#" onClick={(e)=>{e.preventDefault();setActiveTab('profile');}} className="notif-fix-link">Add phone →</a>}
                      </div>
                      
                      <div className="field" style={{marginTop:20}}>
                        <label>⏰ Delivery time <SaveIndicator field="reminder_time"/></label>
                        <select value={reminderTime} onChange={e=>{setReminderTime(e.target.value);autosave('reminder_time',e.target.value);}}>
                          <option value="06:00">6:00 AM — Early bird</option>
                          <option value="07:00">7:00 AM</option>
                          <option value="08:00">8:00 AM</option>
                          <option value="09:00">9:00 AM (recommended)</option>
                          <option value="10:00">10:00 AM</option>
                          <option value="12:00">12:00 PM — Noon</option>
                          <option value="14:00">2:00 PM</option>
                          <option value="17:00">5:00 PM</option>
                          <option value="18:00">6:00 PM</option>
                          <option value="20:00">8:00 PM — Evening</option>
                        </select>
                        <div className="field-hint">All reminders are sent at this time in your local timezone.</div>
                      </div>
                    </>
                  ):(
                    <div className="notif-status off">
                      <span className="notif-status-icon">🔕</span>
                      <div>
                        <div className="notif-status-title">SMS reminders are off</div>
                        <div className="notif-status-sub">You won't receive any text messages about upcoming bills</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Preferences Section */}
              <div className="panel">
                <div className="p-hd">
                  <div>
                    <div className="p-t">📧 Email Notifications</div>
                    <div className="p-s">Choose what emails you receive</div>
                  </div>
                </div>
                <div className="p-body">
                  <div className="email-options">
                    {([
                      ['none','🚫','No emails','I\'ll rely on SMS only'],
                      ['reminders','📬','Bill reminders','Get email reminders before due dates'],
                      ['both','📱📧','SMS + Email','Double coverage — reminders on both']
                    ] as [string,string,string,string][]).map(([val,ic,label,sub])=>(
                      <div key={val} 
                        className={`email-option ${emailPref===val?'selected':''}`}
                        onClick={()=>{setEmailPref(val as any);autosave('email_pref',val);}}>
                        <span className="email-option-icon">{ic}</span>
                        <div className="email-option-content">
                          <div className="email-option-label">{label}</div>
                          <div className="email-option-sub">{sub}</div>
                        </div>
                        {emailPref===val&&<span className="email-option-check">✓</span>}
                      </div>
                    ))}
                  </div>
                  <div className="notif-email-info">
                    <span>📩</span>
                    <span>Emails are sent to <strong>{userEmail||'your account email'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Payment Confirmation Section */}
              <div className="panel">
                <div className="p-hd">
                  <div>
                    <div className="p-t">✅ Payment Confirmation</div>
                    <div className="p-s">What happens after a bill's due date passes</div>
                  </div>
                </div>
                <div className="p-body">
                  <div className="confirm-options">
                    <div 
                      className={`confirm-option ${confirmPayments?'selected':''}`}
                      onClick={()=>{setConfirmPayments(true);autosave('confirm_payments',true);}}>
                      <div className="confirm-option-header">
                        <span className="confirm-option-icon">🔔</span>
                        <div className="confirm-option-title">Ask me to confirm</div>
                        {confirmPayments&&<span className="confirm-option-check">✓</span>}
                      </div>
                      <div className="confirm-option-desc">
                        After a bill passes its due date, Nyra will ask "Did you pay this?" with Paid/Missed buttons. This helps track your actual payment history.
                      </div>
                      <div className="confirm-option-tag recommended">Recommended</div>
                    </div>
                    
                    <div 
                      className={`confirm-option ${!confirmPayments?'selected':''}`}
                      onClick={()=>{setConfirmPayments(false);autosave('confirm_payments',false);}}>
                      <div className="confirm-option-header">
                        <span className="confirm-option-icon">⚡</span>
                        <div className="confirm-option-title">Auto-assume paid</div>
                        {!confirmPayments&&<span className="confirm-option-check">✓</span>}
                      </div>
                      <div className="confirm-option-desc">
                        Nyra will automatically assume you paid each bill and roll the due date forward. Less clicks, but less accurate tracking.
                      </div>
                    </div>
                  </div>
                  <SaveIndicator field="confirm_payments"/>
                </div>
              </div>

              {/* Quiet Hours (Future Feature Preview) */}
              <div className="panel" style={{opacity:0.6}}>
                <div className="p-hd">
                  <div>
                    <div className="p-t">🌙 Quiet Hours</div>
                    <div className="p-s">Pause notifications during certain times</div>
                  </div>
                  <div className="coming-soon-badge">Coming Soon</div>
                </div>
                <div className="p-body">
                  <div className="field-hint">Set hours when you don't want to receive any notifications (e.g., 10pm - 7am).</div>
                </div>
              </div>
            </>)}

            {/* ── PLAN & BILLING TAB ── */}
            {activeTab==='plan'&&(<>
              {/* Current Plan Hero */}
              <div className="plan-hero">
                <div className="plan-hero-badge" style={{background:PLANS.find(p=>p.id===userPlan)?.color||'var(--blue)'}}>
                  {userPlan==='Power'?'⚡':userPlan==='Plus'?'✨':'🌱'}
                </div>
                <div className="plan-hero-info">
                  <div className="plan-hero-name">{userPlan} Plan</div>
                  <div className="plan-hero-price">{PLANS.find(p=>p.id===userPlan)?.price||'$0'}<span>/month</span></div>
                </div>
                <div className="plan-hero-status">
                  <div className="plan-status-dot"></div>
                  <span>Active</span>
                </div>
              </div>

              {/* Plan Comparison */}
              <div className="panel">
                <div className="p-hd">
                  <div>
                    <div className="p-t">Compare Plans</div>
                    <div className="p-s">Choose the plan that fits your needs</div>
                  </div>
                </div>
                <div className="p-body">
                  <div className="plan-cards-grid">
                    {PLANS.map(p=>{
                      const isCurrent = userPlan===p.id;
                      const currentIdx = PLANS.findIndex(pl=>pl.id===userPlan);
                      const thisIdx = PLANS.indexOf(p);
                      const isUpgrade = thisIdx > currentIdx;
                      return(
                      <div key={p.id} className={`plan-card-v2 ${isCurrent?'current':''}`}>
                        {p.id==='Plus'&&<div className="plan-popular">Most Popular</div>}
                        <div className="plan-card-icon" style={{background:`${p.color}15`,color:p.color}}>
                          {p.id==='Power'?'⚡':p.id==='Plus'?'✨':'🌱'}
                        </div>
                        <div className="plan-card-name" style={{color:p.color}}>{p.id}</div>
                        <div className="plan-card-price">
                          {p.price}<span>/mo</span>
                        </div>
                        <div className="plan-card-bills">{p.bills}</div>
                        <div className="plan-card-features">
                          {p.features.map(f=>(
                            <div key={f} className="plan-card-feat">
                              <span className="plan-feat-check" style={{color:p.color}}>✓</span>
                              {f}
                            </div>
                          ))}
                        </div>
                        {isCurrent?(
                          <div className="plan-current-label">Your Current Plan</div>
                        ):(
                          <button 
                            className={`plan-action-btn ${isUpgrade?'upgrade':'downgrade'}`}
                            style={isUpgrade?{background:p.color,boxShadow:`0 4px 14px ${p.color}33`}:{}}
                            onClick={()=>window.location.href=`/signup?plan=${p.id}&price=${p.price.replace('$','')}`}>
                            {isUpgrade?`Upgrade to ${p.id}`:`Switch to ${p.id}`}
                          </button>
                        )}
                      </div>
                    );})}
                  </div>
                </div>
              </div>

              {/* Billing Details */}
              <div className="panel">
                <div className="p-hd">
                  <div>
                    <div className="p-t">💳 Billing Details</div>
                    <div className="p-s">Manage your subscription and payment</div>
                  </div>
                </div>
                <div className="p-body">
                  <div className="billing-grid">
                    <div className="billing-item">
                      <div className="billing-item-icon">📅</div>
                      <div className="billing-item-content">
                        <div className="billing-item-label">Next billing date</div>
                        <div className="billing-item-value">{billingDate||'—'}</div>
                      </div>
                    </div>
                    <div className="billing-item">
                      <div className="billing-item-icon">🔄</div>
                      <div className="billing-item-content">
                        <div className="billing-item-label">Billing cycle</div>
                        <div className="billing-item-value">Monthly</div>
                      </div>
                    </div>
                    <div className="billing-item">
                      <div className="billing-item-icon">💰</div>
                      <div className="billing-item-content">
                        <div className="billing-item-label">Amount</div>
                        <div className="billing-item-value">{PLANS.find(p=>p.id===userPlan)?.price||'$0'} CAD</div>
                      </div>
                    </div>
                    <div className="billing-item">
                      <div className="billing-item-icon">💳</div>
                      <div className="billing-item-content">
                        <div className="billing-item-label">Payment method</div>
                        <div className="billing-item-value">•••• 4242</div>
                      </div>
                      <button className="billing-item-action">Update</button>
                    </div>
                  </div>
                  
                  <div className="billing-actions">
                    <button className="billing-btn">📄 View billing history</button>
                    <button className="billing-btn">📧 Update billing email</button>
                  </div>
                </div>
              </div>

              {/* Cancel Subscription */}
              <div className="danger-zone">
                <div className="danger-zone-header">
                  <div className="danger-icon">⚠️</div>
                  <div>
                    <div className="danger-title">Cancel Subscription</div>
                    <div className="danger-desc">
                      Cancelling will downgrade you to Basic at the end of your billing period ({billingDate}). 
                      Your bills and data will be preserved, but AI features and advanced analytics will be locked.
                    </div>
                  </div>
                </div>
                {!cancelConfirm?(
                  <button className="danger-btn" onClick={()=>setCancelConfirm(true)}>Cancel subscription</button>
                ):(
                  <div className="danger-confirm-row">
                    <span className="danger-confirm-text">Are you sure you want to cancel?</span>
                    <button className="danger-confirm-yes" onClick={()=>setCancelConfirm(false)}>Yes, cancel my plan</button>
                    <button className="danger-confirm-no" onClick={()=>setCancelConfirm(false)}>Keep my plan</button>
                  </div>
                )}
              </div>
            </>)}

            {/* ── SECURITY TAB ── */}
            {activeTab==='security'&&(<>
              {/* Account Security Overview */}
              <div className="security-overview">
                <div className="security-score">
                  <div className="security-score-ring">
                    <svg viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(34,197,94,.15)" strokeWidth="3"/>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--success)" strokeWidth="3" strokeDasharray="75, 100" strokeLinecap="round"/>
                    </svg>
                    <div className="security-score-text">🛡️</div>
                  </div>
                  <div className="security-score-info">
                    <div className="security-score-label">Account Security</div>
                    <div className="security-score-status good">Good</div>
                  </div>
                </div>
                <div className="security-checklist">
                  <div className="security-check done"><span>✅</span> Email verified</div>
                  <div className={`security-check ${phoneVerified?'done':'pending'}`}>
                    <span>{phoneVerified?'✅':'⚠️'}</span> 
                    {phoneVerified?'Phone verified':'Phone not verified'}
                  </div>
                  <div className="security-check done"><span>✅</span> Password set</div>
                  <div className="security-check pending"><span>🔒</span> Two-factor auth (coming soon)</div>
                </div>
              </div>

              {/* Change Password */}
              <div className="panel">
                <div className="p-hd">
                  <div>
                    <div className="p-t">🔑 Change Password</div>
                    <div className="p-s">Update your account password</div>
                  </div>
                </div>
                <div className="p-body">
                  {pwError&&<div className="pw-error"><span>❌</span> {pwError}</div>}
                  {pwSuccess&&<div className="pw-success"><span>✅</span> Password updated successfully!</div>}
                  <div className="field">
                    <label>Current password</label>
                    <input type="password" value={pwCurrent} placeholder="Enter current password" onChange={e=>setPwCurrent(e.target.value)}/>
                  </div>
                  <div className="field">
                    <label>New password</label>
                    <input type="password" value={pwNew} placeholder="Enter new password" onChange={e=>setPwNew(e.target.value)}/>
                    <div className="pw-strength">
                      <div className={`pw-strength-bar ${pwNew.length>=12?'strong':pwNew.length>=8?'medium':'weak'}`} style={{width:`${Math.min(100,pwNew.length*8)}%`}}></div>
                    </div>
                    <div className="field-hint">
                      {pwNew.length===0?'At least 8 characters required':
                       pwNew.length<8?`${8-pwNew.length} more characters needed`:
                       pwNew.length<12?'Good — try 12+ characters for extra security':'Strong password! 💪'}
                    </div>
                  </div>
                  <div className="field">
                    <label>Confirm new password</label>
                    <input type="password" value={pwConfirm} placeholder="Confirm new password" onChange={e=>setPwConfirm(e.target.value)}/>
                    {pwConfirm&&pwNew!==pwConfirm&&<div className="field-error">Passwords don't match</div>}
                  </div>
                  <button className="pw-btn" onClick={changePassword} disabled={!pwNew||!pwConfirm||pwNew!==pwConfirm||pwNew.length<8}>
                    Update password →
                  </button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="panel" style={{opacity:0.6}}>
                <div className="p-hd">
                  <div>
                    <div className="p-t">📱 Two-Factor Authentication</div>
                    <div className="p-s">Add an extra layer of security</div>
                  </div>
                  <div className="coming-soon-badge">Coming Soon</div>
                </div>
                <div className="p-body">
                  <div className="field-hint">Enable 2FA to require a code from your phone when signing in. This protects your account even if your password is compromised.</div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="panel">
                <div className="p-hd">
                  <div>
                    <div className="p-t">🖥️ Active Sessions</div>
                    <div className="p-s">Manage where you're signed in</div>
                  </div>
                </div>
                <div className="p-body">
                  <div className="session-item current">
                    <div className="session-icon">💻</div>
                    <div className="session-info">
                      <div className="session-device">This device</div>
                      <div className="session-details">Chrome on Windows · Burlington, ON</div>
                    </div>
                    <div className="session-badge">Current</div>
                  </div>
                  <button className="signout-all-btn" onClick={async()=>{await supabase.auth.signOut();window.location.href='/';}}>
                    Sign out of all devices
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="danger-zone">
                <div className="danger-zone-header">
                  <div className="danger-icon">🗑️</div>
                  <div>
                    <div className="danger-title">Delete Account</div>
                    <div className="danger-desc">
                      Permanently delete your Nyra account and all associated data. This action cannot be undone.
                    </div>
                  </div>
                </div>
                <button className="danger-btn">Delete my account</button>
              </div>
            </>)}

            {/* ── FEEDBACK TAB ── */}
            {activeTab==='feedback'&&(<>
              {/* Success Message */}
              {feedbackSuccess&&(
                <div style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.2)',borderRadius:16,padding:'16px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:'1.4rem'}}>✅</span>
                  <div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:'.9rem',color:'var(--success)'}}>Feedback submitted!</div>
                    <div style={{fontSize:'.78rem',color:'var(--text2)',marginTop:2}}>Thank you for helping us improve Nyra. We'll review your feedback soon.</div>
                  </div>
                </div>
              )}

              {/* Submit Feedback */}
              <div className="panel">
                <div className="p-hd">
                  <div>
                    <div className="p-t">💬 Send Us Feedback</div>
                    <div className="p-s">Found a bug? Have an idea? Let us know!</div>
                  </div>
                </div>
                <div className="p-body">
                  {feedbackError&&(
                    <div style={{background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.15)',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:'.8rem',color:'var(--danger)'}}>
                      ❌ {feedbackError}
                    </div>
                  )}
                  
                  <div className="field">
                    <label>Category</label>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
                      {([
                        ['bug','🐛','Bug Report','Something isn\'t working'],
                        ['feature','💡','Feature Request','I have an idea'],
                        ['general','💬','General Feedback','Thoughts or suggestions'],
                        ['complaint','😤','Complaint','Something frustrated me']
                      ] as ['bug'|'feature'|'general'|'complaint',string,string,string][]).map(([val,ic,label,sub])=>(
                        <div key={val}
                          onClick={()=>setFeedbackCategory(val)}
                          style={{
                            padding:'14px 16px',
                            borderRadius:12,
                            border:`1.5px solid ${feedbackCategory===val?'var(--blue)':'var(--border)'}`,
                            background:feedbackCategory===val?'var(--blue-pale)':'white',
                            cursor:'pointer',
                            transition:'all .2s'
                          }}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                            <span style={{fontSize:'1.1rem'}}>{ic}</span>
                            <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:'.84rem',color:feedbackCategory===val?'var(--blue)':'var(--text)'}}>{label}</span>
                          </div>
                          <div style={{fontSize:'.72rem',color:'var(--muted)',paddingLeft:28}}>{sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="field">
                    <label>Subject</label>
                    <input 
                      type="text" 
                      value={feedbackSubject}
                      onChange={e=>setFeedbackSubject(e.target.value)}
                      placeholder={
                        feedbackCategory==='bug'?'e.g., Dashboard won\'t load on mobile':
                        feedbackCategory==='feature'?'e.g., Add dark mode':
                        feedbackCategory==='complaint'?'e.g., Reminders came too late':
                        'e.g., Love the new badges!'
                      }
                      maxLength={100}
                    />
                  </div>
                  
                  <div className="field">
                    <label>Your feedback</label>
                    <textarea
                      value={feedbackMessage}
                      onChange={e=>setFeedbackMessage(e.target.value)}
                      placeholder={
                        feedbackCategory==='bug'?'Please describe what happened, what you expected, and any steps to reproduce the issue...':
                        feedbackCategory==='feature'?'Describe your idea and how it would help you...':
                        feedbackCategory==='complaint'?'Tell us what went wrong and how we can make it right...':
                        'Share your thoughts with us...'
                      }
                      style={{
                        width:'100%',
                        minHeight:140,
                        background:'white',
                        border:'1.5px solid var(--border)',
                        borderRadius:10,
                        padding:'12px 14px',
                        fontFamily:'Inter,sans-serif',
                        fontSize:'.85rem',
                        color:'var(--text)',
                        resize:'vertical',
                        outline:'none'
                      }}
                      maxLength={2000}
                    />
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                      <div className="field-hint">Be as detailed as possible — it helps us help you!</div>
                      <div style={{fontSize:'.7rem',color:'var(--muted)'}}>{feedbackMessage.length}/2000</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={submitFeedback}
                    disabled={feedbackSubmitting||!feedbackSubject.trim()||!feedbackMessage.trim()}
                    style={{
                      width:'100%',
                      padding:'14px',
                      background:feedbackSubmitting||!feedbackSubject.trim()||!feedbackMessage.trim()?'var(--border)':'var(--blue)',
                      color:feedbackSubmitting||!feedbackSubject.trim()||!feedbackMessage.trim()?'var(--muted)':'white',
                      border:'none',
                      borderRadius:12,
                      fontFamily:"'Plus Jakarta Sans',sans-serif",
                      fontSize:'.88rem',
                      fontWeight:700,
                      cursor:feedbackSubmitting||!feedbackSubject.trim()||!feedbackMessage.trim()?'not-allowed':'pointer',
                      transition:'all .2s',
                      boxShadow:feedbackSubmitting||!feedbackSubject.trim()||!feedbackMessage.trim()?'none':'0 4px 14px var(--blue-glow)'
                    }}>
                    {feedbackSubmitting?'Submitting...':'Submit Feedback →'}
                  </button>
                </div>
              </div>

              {/* Past Feedback */}
              {pastFeedback.length>0&&(
                <div className="panel">
                  <div className="p-hd">
                    <div>
                      <div className="p-t">📋 Your Recent Feedback</div>
                      <div className="p-s">Track the status of your submissions</div>
                    </div>
                  </div>
                  <div className="p-body">
                    {pastFeedback.map(fb=>(
                      <div key={fb.id} style={{
                        display:'flex',
                        alignItems:'center',
                        gap:14,
                        padding:'14px 0',
                        borderBottom:'1px solid var(--border)'
                      }}>
                        <div style={{
                          width:36,height:36,borderRadius:10,
                          background:fb.category==='bug'?'rgba(239,68,68,.1)':fb.category==='feature'?'rgba(33,119,209,.1)':fb.category==='complaint'?'rgba(245,158,11,.1)':'rgba(34,197,94,.1)',
                          display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',flexShrink:0
                        }}>
                          {fb.category==='bug'?'🐛':fb.category==='feature'?'💡':fb.category==='complaint'?'😤':'💬'}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:'.84rem',color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{fb.subject}</div>
                          <div style={{fontSize:'.72rem',color:'var(--muted)',marginTop:2}}>
                            {new Date(fb.created_at).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'})}
                          </div>
                        </div>
                        <div style={{
                          fontSize:'.68rem',fontWeight:700,
                          padding:'4px 10px',borderRadius:100,
                          background:fb.status==='resolved'?'rgba(34,197,94,.1)':fb.status==='in_progress'?'rgba(33,119,209,.1)':'rgba(122,144,170,.1)',
                          color:fb.status==='resolved'?'var(--success)':fb.status==='in_progress'?'var(--blue)':'var(--muted)',
                          textTransform:'capitalize'
                        }}>
                          {fb.status==='in_progress'?'In Progress':fb.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="panel" style={{background:'linear-gradient(135deg,rgba(33,119,209,.04),rgba(195,154,53,.03))'}}>
                <div className="p-body" style={{textAlign:'center',padding:'28px 24px'}}>
                  <div style={{fontSize:'2rem',marginBottom:12}}>📧</div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:'.95rem',color:'var(--text)',marginBottom:6}}>Need urgent help?</div>
                  <div style={{fontSize:'.8rem',color:'var(--text2)',marginBottom:14,lineHeight:1.7}}>For urgent issues or account problems, email us directly:</div>
                  <a href="mailto:info@financialfutureseducation.com" style={{
                    display:'inline-flex',alignItems:'center',gap:8,
                    background:'white',border:'1.5px solid var(--border)',
                    borderRadius:10,padding:'10px 20px',
                    fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'.85rem',fontWeight:600,
                    color:'var(--blue)',textDecoration:'none',
                    transition:'all .2s'
                  }}>
                    info@financialfutureseducation.com
                  </a>
                </div>
              </div>
            </>)}

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
                {activeTab==='feedback'&&'Your feedback directly shapes Nyra\'s roadmap. Bug reports get prioritized, and feature requests with the most votes get built first!'}
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
