'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Only these emails can access admin
const ADMIN_EMAILS = ['info@financialfutureseducation.com'];

// Fallback userId for testing (remove in production)
const ADMIN_FALLBACK_ID = 'ef38b136-4454-4599-9eb8-06a4197dfed5';

interface UserProfile {
  id: string;
  full_name: string;
  first_name: string;
  email?: string;
  plan: string;
  created_at: string;
  phone_verified: boolean;
  phone_number?: string;
}

interface FeedbackItem {
  id: string;
  user_email: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

interface DailySignup {
  date: string;
  count: number;
}

interface Bill {
  id: string;
  user_id: string;
  bill_name: string;
  amount: number;
  created_at: string;
}

interface ActivityItem {
  id: string;
  type: 'signup' | 'feedback' | 'bill_added' | 'payment';
  description: string;
  user_name: string;
  created_at: string;
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [signupsByDay, setSignupsByDay] = useState<DailySignup[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'feedback' | 'activity'>('overview');
  
  // Search & filter
  const [userSearch, setUserSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'Basic' | 'Plus' | 'Power'>('all');
  
  // Email modal
  const [emailModal, setEmailModal] = useState<{ open: boolean; userId?: string; userName?: string }>({ open: false });
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    newThisWeek: 0,
    newThisMonth: 0,
    basicUsers: 0,
    plusUsers: 0,
    powerUsers: 0,
    verifiedPhones: 0,
    pendingFeedback: 0,
    monthlyRevenue: 0,
    totalBills: 0,
    avgBillsPerUser: 0,
  });

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  async function checkAuthAndLoad() {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Allow fallback user for testing
    if (!user?.email) {
      // Check if using fallback userId
      const isTestingMode = true; // Set to false in production
      if (isTestingMode) {
        setAuthorized(true);
        setUserEmail('(Test Mode)');
        await loadAllData();
        setLoading(false);
        return;
      }
      
      setAuthorized(false);
      setLoading(false);
      return;
    }
    
    setUserEmail(user.email);
    
    if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    
    setAuthorized(true);
    await loadAllData();
    setLoading(false);
  }

  async function loadAllData() {
    // Load all users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersData) {
      setUsers(usersData);
      
      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const newThisWeek = usersData.filter(u => new Date(u.created_at) > weekAgo).length;
      const newThisMonth = usersData.filter(u => new Date(u.created_at) > monthAgo).length;
      
      const basicUsers = usersData.filter(u => u.plan === 'Basic').length;
      const plusUsers = usersData.filter(u => u.plan === 'Plus' || !u.plan).length;
      const powerUsers = usersData.filter(u => u.plan === 'Power').length;
      
      const verifiedPhones = usersData.filter(u => u.phone_verified).length;
      
      // Revenue estimate: Basic=$3, Plus=$5, Power=$8
      const monthlyRevenue = (basicUsers * 3) + (plusUsers * 5) + (powerUsers * 8);
      
      // Signups by day (last 30 days)
      const signupMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split('T')[0];
        signupMap[key] = 0;
      }
      usersData.forEach(u => {
        const key = new Date(u.created_at).toISOString().split('T')[0];
        if (signupMap[key] !== undefined) signupMap[key]++;
      });
      setSignupsByDay(Object.entries(signupMap).map(([date, count]) => ({ date, count })));
      
      setStats(s => ({
        ...s,
        totalUsers: usersData.length,
        newThisWeek,
        newThisMonth,
        basicUsers,
        plusUsers,
        powerUsers,
        verifiedPhones,
        monthlyRevenue,
      }));
    }
    
    // Load bills
    const { data: billsData } = await supabase
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (billsData) {
      setBills(billsData);
      const totalBills = billsData.length;
      const avgBillsPerUser = users.length > 0 ? (totalBills / users.length).toFixed(1) : 0;
      setStats(s => ({
        ...s,
        totalBills,
        avgBillsPerUser: parseFloat(avgBillsPerUser as string) || 0,
      }));
    }
    
    // Load feedback
    const { data: feedbackData } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (feedbackData) {
      setFeedback(feedbackData);
      setStats(s => ({
        ...s,
        pendingFeedback: feedbackData.filter(f => f.status === 'new').length,
      }));
    }
    
    // Build activity feed from all data
    const activityItems: ActivityItem[] = [];
    
    // Add signups
    if (usersData) {
      usersData.slice(0, 20).forEach(u => {
        activityItems.push({
          id: `signup-${u.id}`,
          type: 'signup',
          description: `New user signed up (${u.plan || 'Plus'} plan)`,
          user_name: u.first_name || u.full_name || 'Unknown',
          created_at: u.created_at,
        });
      });
    }
    
    // Add feedback
    if (feedbackData) {
      feedbackData.slice(0, 10).forEach(f => {
        activityItems.push({
          id: `feedback-${f.id}`,
          type: 'feedback',
          description: `Submitted ${f.category} feedback: "${f.subject}"`,
          user_name: f.user_email || 'Anonymous',
          created_at: f.created_at,
        });
      });
    }
    
    // Add recent bills
    if (billsData) {
      const userMap: Record<string, string> = {};
      usersData?.forEach(u => { userMap[u.id] = u.first_name || u.full_name || 'Unknown'; });
      
      billsData.slice(0, 15).forEach(b => {
        activityItems.push({
          id: `bill-${b.id}`,
          type: 'bill_added',
          description: `Added bill "${b.bill_name}" ($${b.amount})`,
          user_name: userMap[b.user_id] || 'Unknown',
          created_at: b.created_at,
        });
      });
    }
    
    // Sort by date and take top 30
    activityItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setActivity(activityItems.slice(0, 30));
  }
  
  // Export to CSV
  function exportUsersCSV() {
    const headers = ['Name', 'Email', 'Plan', 'Phone Verified', 'Joined'];
    const rows = users.map(u => [
      u.first_name || u.full_name || 'Unknown',
      u.id,
      u.plan || 'Plus',
      u.phone_verified ? 'Yes' : 'No',
      new Date(u.created_at).toISOString().split('T')[0]
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nyra-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }
  
  function exportBillsCSV() {
    const headers = ['Bill Name', 'Amount', 'User ID', 'Created'];
    const rows = bills.map(b => [
      b.bill_name,
      b.amount,
      b.user_id,
      new Date(b.created_at).toISOString().split('T')[0]
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nyra-bills-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }
  
  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = !userSearch || 
      (u.first_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase());
    const matchesPlan = planFilter === 'all' || (u.plan || 'Plus') === planFilter;
    return matchesSearch && matchesPlan;
  });

  async function updateFeedbackStatus(id: string, status: string) {
    await supabase.from('feedback').update({ 
      status,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null 
    }).eq('id', id);
    
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    if (status !== 'new') {
      setStats(s => ({ ...s, pendingFeedback: s.pendingFeedback - 1 }));
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef3fb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
          <div style={{ color: '#7a90aa' }}>Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef3fb' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 40, background: 'white', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: '1.4rem', marginBottom: 8, color: '#0c1524' }}>Access Denied</div>
          <div style={{ color: '#7a90aa', marginBottom: 20, lineHeight: 1.7 }}>
            {userEmail 
              ? `${userEmail} is not authorized to access the admin dashboard.`
              : 'Please sign in to access the admin dashboard.'}
          </div>
          <a href="/dashboard" style={{
            display: 'inline-block',
            padding: '12px 28px',
            background: '#2177d1',
            color: 'white',
            borderRadius: 10,
            fontWeight: 600,
            textDecoration: 'none'
          }}>
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const planColors = { Basic: '#7a90aa', Plus: '#2177d1', Power: '#7c3aed' };
  const maxSignups = Math.max(...signupsByDay.map(d => d.count), 1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500&display=swap');
        :root{--blue:#2177d1;--blue-pale:rgba(33,119,209,0.08);--gold:#c39a35;--bg:#eef3fb;--text:#0c1524;--text2:#3a4f6a;--muted:#7a90aa;--border:rgba(33,119,209,0.1);--success:#22c55e;--warn:#f59e0b;--danger:#ef4444;--glass:rgba(255,255,255,0.85);}
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);font-family:'Inter',sans-serif;color:var(--text);}
        .admin-wrap{max-width:1400px;margin:0 auto;padding:32px 40px;}
        .admin-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;}
        .admin-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.8rem;color:var(--text);display:flex;align-items:center;gap:12px;}
        .admin-badge{font-size:.65rem;font-weight:700;background:var(--danger);color:white;padding:4px 10px;border-radius:100px;text-transform:uppercase;letter-spacing:.05em;}
        .admin-back{display:flex;align-items:center;gap:8px;color:var(--muted);text-decoration:none;font-size:.85rem;font-weight:500;transition:color .2s;}
        .admin-back:hover{color:var(--blue);}
        
        .tab-bar{display:flex;gap:4px;background:var(--glass);border:1px solid var(--border);border-radius:14px;padding:5px;margin-bottom:28px;width:fit-content;}
        .tab-btn{padding:10px 22px;border-radius:10px;border:none;cursor:pointer;font-family:'Inter',sans-serif;font-size:.84rem;font-weight:500;color:var(--muted);background:transparent;transition:all .2s;}
        .tab-btn.on{background:white;color:var(--blue);font-weight:600;box-shadow:0 2px 8px rgba(33,119,209,.1);}
        
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;}
        .stat-card{background:var(--glass);border:1px solid var(--border);border-radius:18px;padding:20px 24px;transition:transform .2s,box-shadow .2s;}
        .stat-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(33,119,209,.1);}
        .stat-icon{font-size:1.6rem;margin-bottom:10px;}
        .stat-value{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:2rem;color:var(--text);margin-bottom:4px;}
        .stat-label{font-size:.78rem;color:var(--muted);}
        .stat-change{font-size:.72rem;font-weight:600;margin-top:8px;display:flex;align-items:center;gap:4px;}
        .stat-change.up{color:var(--success);}
        .stat-change.down{color:var(--danger);}
        
        .panel{background:var(--glass);border:1px solid var(--border);border-radius:20px;overflow:hidden;margin-bottom:24px;}
        .panel-hd{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .panel-title{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1rem;color:var(--text);}
        .panel-sub{font-size:.75rem;color:var(--muted);margin-top:2px;}
        .panel-body{padding:20px 24px;}
        
        .chart-bar{display:flex;align-items:flex-end;gap:4px;height:120px;padding:10px 0;}
        .chart-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;}
        .chart-bar-fill{width:100%;max-width:24px;background:linear-gradient(180deg,var(--blue),rgba(33,119,209,.6));border-radius:4px 4px 0 0;transition:height .3s;}
        .chart-label{font-size:.6rem;color:var(--muted);writing-mode:vertical-rl;text-orientation:mixed;transform:rotate(180deg);}
        
        .plan-dist{display:flex;gap:20px;align-items:center;}
        .plan-bar{flex:1;height:32px;background:var(--border);border-radius:100px;overflow:hidden;display:flex;}
        .plan-seg{height:100%;transition:width .5s;}
        .plan-legend{display:flex;flex-direction:column;gap:8px;}
        .plan-legend-item{display:flex;align-items:center;gap:8px;font-size:.8rem;}
        .plan-dot{width:10px;height:10px;border-radius:50%;}
        
        .user-table{width:100%;border-collapse:collapse;}
        .user-table th{text-align:left;padding:12px 16px;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);border-bottom:1px solid var(--border);}
        .user-table td{padding:14px 16px;border-bottom:1px solid var(--border);font-size:.84rem;color:var(--text2);}
        .user-table tr:hover td{background:rgba(33,119,209,.02);}
        .user-name{font-weight:600;color:var(--text);}
        .user-email{font-size:.75rem;color:var(--muted);}
        .plan-badge{font-size:.68rem;font-weight:700;padding:4px 10px;border-radius:100px;}
        .plan-badge.Basic{background:rgba(122,144,170,.1);color:#7a90aa;}
        .plan-badge.Plus{background:rgba(33,119,209,.1);color:#2177d1;}
        .plan-badge.Power{background:rgba(124,58,237,.1);color:#7c3aed;}
        
        .fb-item{padding:16px 0;border-bottom:1px solid var(--border);}
        .fb-item:last-child{border-bottom:none;}
        .fb-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:10px;}
        .fb-cat{font-size:.68rem;font-weight:700;padding:4px 10px;border-radius:100px;}
        .fb-cat.bug{background:rgba(239,68,68,.1);color:var(--danger);}
        .fb-cat.feature{background:rgba(33,119,209,.1);color:var(--blue);}
        .fb-cat.general{background:rgba(34,197,94,.1);color:var(--success);}
        .fb-cat.complaint{background:rgba(245,158,11,.1);color:var(--warn);}
        .fb-subject{font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:.92rem;color:var(--text);margin-bottom:4px;}
        .fb-meta{font-size:.72rem;color:var(--muted);}
        .fb-message{font-size:.82rem;color:var(--text2);line-height:1.7;margin-bottom:12px;padding:12px 14px;background:var(--bg);border-radius:10px;}
        .fb-actions{display:flex;gap:8px;}
        .fb-btn{padding:7px 14px;border-radius:8px;font-size:.75rem;font-weight:600;cursor:pointer;border:1px solid var(--border);background:white;color:var(--text2);transition:all .2s;}
        .fb-btn:hover{border-color:var(--blue);color:var(--blue);}
        .fb-btn.resolve{background:var(--success);border-color:var(--success);color:white;}
        .fb-btn.resolve:hover{background:#1da750;}
        
        .revenue-card{background:linear-gradient(135deg,#2177d1,#6366f1);border-radius:20px;padding:28px 32px;color:white;}
        .revenue-label{font-size:.8rem;opacity:.85;margin-bottom:6px;}
        .revenue-value{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:2.8rem;margin-bottom:8px;}
        .revenue-sub{font-size:.78rem;opacity:.75;}
        
        @media(max-width:1000px){.stats-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:600px){.stats-grid{grid-template-columns:1fr;}.admin-wrap{padding:20px 16px;}.plan-dist{flex-direction:column;}}
      `}</style>

      <div className="admin-wrap">
        <div className="admin-header">
          <div className="admin-title">
            🛠️ Admin Dashboard
            <span className="admin-badge">Admin Only</span>
          </div>
          <a href="/dashboard" className="admin-back">← Back to Dashboard</a>
        </div>

        <div className="tab-bar">
          <button className={`tab-btn ${activeTab === 'overview' ? 'on' : ''}`} onClick={() => setActiveTab('overview')}>📊 Overview</button>
          <button className={`tab-btn ${activeTab === 'users' ? 'on' : ''}`} onClick={() => setActiveTab('users')}>👥 Users ({stats.totalUsers})</button>
          <button className={`tab-btn ${activeTab === 'activity' ? 'on' : ''}`} onClick={() => setActiveTab('activity')}>⚡ Activity</button>
          <button className={`tab-btn ${activeTab === 'feedback' ? 'on' : ''}`} onClick={() => setActiveTab('feedback')}>💬 Feedback {stats.pendingFeedback > 0 && `(${stats.pendingFeedback})`}</button>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Total Users</div>
                <div className="stat-change up">+{stats.newThisWeek} this week</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-value">{stats.newThisMonth}</div>
                <div className="stat-label">New This Month</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-value">{stats.totalBills}</div>
                <div className="stat-label">Total Bills</div>
                <div className="stat-change">{stats.avgBillsPerUser} avg per user</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📱</div>
                <div className="stat-value">{stats.verifiedPhones}</div>
                <div className="stat-label">Verified Phones</div>
                <div className="stat-change">{stats.totalUsers > 0 ? Math.round((stats.verifiedPhones / stats.totalUsers) * 100) : 0}% of users</div>
              </div>
            </div>

            {/* Revenue Card */}
            <div className="revenue-card" style={{ marginBottom: 24 }}>
              <div className="revenue-label">Estimated Monthly Revenue</div>
              <div className="revenue-value">${stats.monthlyRevenue} CAD</div>
              <div className="revenue-sub">Based on {stats.basicUsers} Basic ($3) + {stats.plusUsers} Plus ($5) + {stats.powerUsers} Power ($8)</div>
            </div>

            {/* Signups Chart */}
            <div className="panel">
              <div className="panel-hd">
                <div>
                  <div className="panel-title">📅 Signups (Last 30 Days)</div>
                  <div className="panel-sub">{stats.newThisMonth} new users this month</div>
                </div>
              </div>
              <div className="panel-body">
                <div className="chart-bar">
                  {signupsByDay.map((d, i) => (
                    <div key={d.date} className="chart-col">
                      <div 
                        className="chart-bar-fill" 
                        style={{ height: `${(d.count / maxSignups) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
                        title={`${d.date}: ${d.count} signups`}
                      />
                      {i % 5 === 0 && <div className="chart-label">{d.date.slice(5)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Plan Distribution */}
            <div className="panel">
              <div className="panel-hd">
                <div>
                  <div className="panel-title">💳 Plan Distribution</div>
                  <div className="panel-sub">{stats.totalUsers} total users across all plans</div>
                </div>
              </div>
              <div className="panel-body">
                <div className="plan-dist">
                  <div className="plan-bar">
                    <div className="plan-seg" style={{ width: `${(stats.basicUsers / Math.max(stats.totalUsers, 1)) * 100}%`, background: planColors.Basic }} />
                    <div className="plan-seg" style={{ width: `${(stats.plusUsers / Math.max(stats.totalUsers, 1)) * 100}%`, background: planColors.Plus }} />
                    <div className="plan-seg" style={{ width: `${(stats.powerUsers / Math.max(stats.totalUsers, 1)) * 100}%`, background: planColors.Power }} />
                  </div>
                  <div className="plan-legend">
                    <div className="plan-legend-item"><div className="plan-dot" style={{ background: planColors.Basic }} /> Basic: {stats.basicUsers}</div>
                    <div className="plan-legend-item"><div className="plan-dot" style={{ background: planColors.Plus }} /> Plus: {stats.plusUsers}</div>
                    <div className="plan-legend-item"><div className="plan-dot" style={{ background: planColors.Power }} /> Power: {stats.powerUsers}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="panel">
            <div className="panel-hd">
              <div>
                <div className="panel-title">👥 All Users</div>
                <div className="panel-sub">{filteredUsers.length} of {stats.totalUsers} users shown</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={exportUsersCSV} style={{
                  padding: '8px 14px',
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: '.78rem',
                  fontWeight: 600,
                  color: 'var(--text2)',
                  cursor: 'pointer'
                }}>
                  📥 Export CSV
                </button>
                <button onClick={exportBillsCSV} style={{
                  padding: '8px 14px',
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: '.78rem',
                  fontWeight: 600,
                  color: 'var(--text2)',
                  cursor: 'pointer'
                }}>
                  📋 Export Bills
                </button>
              </div>
            </div>
            
            {/* Search & Filter Bar */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search users..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: '10px 14px',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: '.85rem',
                  outline: 'none'
                }}
              />
              <select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value as any)}
                style={{
                  padding: '10px 14px',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: '.85rem',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Plans</option>
                <option value="Basic">Basic</option>
                <option value="Plus">Plus</option>
                <option value="Power">Power</option>
              </select>
            </div>
            
            <div className="panel-body" style={{ padding: 0 }}>
              <table className="user-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Phone</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="user-name">{u.first_name || u.full_name || 'Unknown'}</div>
                        <div className="user-email">{u.id.slice(0, 8)}...</div>
                      </td>
                      <td><span className={`plan-badge ${u.plan || 'Plus'}`}>{u.plan || 'Plus'}</span></td>
                      <td>
                        {u.phone_verified 
                          ? '✅ Verified' 
                          : u.phone_number 
                            ? '⚠️ Unverified' 
                            : '❌ None'}
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td>
                        <button
                          onClick={() => setEmailModal({ open: true, userId: u.id, userName: u.first_name || u.full_name || 'User' })}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--blue-pale)',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: '.72rem',
                            fontWeight: 600,
                            color: 'var(--blue)',
                            cursor: 'pointer'
                          }}
                        >
                          ✉️ Email
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="panel">
            <div className="panel-hd">
              <div>
                <div className="panel-title">⚡ Recent Activity</div>
                <div className="panel-sub">Last 30 actions across all users</div>
              </div>
            </div>
            <div className="panel-body">
              {activity.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                  No activity yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {activity.map((a, i) => (
                    <div key={a.id} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      padding: '14px 0',
                      borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none'
                    }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: a.type === 'signup' ? 'rgba(34,197,94,.1)' : 
                                    a.type === 'feedback' ? 'rgba(245,158,11,.1)' : 
                                    a.type === 'bill_added' ? 'rgba(33,119,209,.1)' : 'rgba(122,144,170,.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        flexShrink: 0
                      }}>
                        {a.type === 'signup' ? '👤' : a.type === 'feedback' ? '💬' : a.type === 'bill_added' ? '📋' : '💰'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.84rem', color: 'var(--text)', marginBottom: 2 }}>
                          <strong>{a.user_name}</strong> {a.description}
                        </div>
                        <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>
                          {new Date(a.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="panel">
            <div className="panel-hd">
              <div>
                <div className="panel-title">💬 User Feedback</div>
                <div className="panel-sub">{feedback.length} total submissions, {stats.pendingFeedback} pending</div>
              </div>
            </div>
            <div className="panel-body">
              {feedback.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                  No feedback yet
                </div>
              ) : (
                feedback.map(fb => (
                  <div key={fb.id} className="fb-item">
                    <div className="fb-header">
                      <div>
                        <span className={`fb-cat ${fb.category}`}>{fb.category}</span>
                        <div className="fb-subject" style={{ marginTop: 8 }}>{fb.subject}</div>
                        <div className="fb-meta">{fb.user_email || 'Anonymous'} · {new Date(fb.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <span className={`plan-badge ${fb.status === 'new' ? 'Plus' : fb.status === 'resolved' ? 'Power' : 'Basic'}`}>
                        {fb.status}
                      </span>
                    </div>
                    <div className="fb-message">{fb.message}</div>
                    {fb.status !== 'resolved' && (
                      <div className="fb-actions">
                        {fb.status === 'new' && (
                          <button className="fb-btn" onClick={() => updateFeedbackStatus(fb.id, 'in_progress')}>
                            Mark In Progress
                          </button>
                        )}
                        <button className="fb-btn resolve" onClick={() => updateFeedbackStatus(fb.id, 'resolved')}>
                          ✓ Resolve
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Email Modal */}
        {emailModal.open && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(12,21,36,.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }} onClick={() => setEmailModal({ open: false })}>
            <div style={{
              background: 'white',
              borderRadius: 20,
              padding: 28,
              width: '100%',
              maxWidth: 500,
              boxShadow: '0 20px 60px rgba(0,0,0,.2)'
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>
                    ✉️ Email {emailModal.userName}
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 2 }}>
                    Send a direct message to this user
                  </div>
                </div>
                <button onClick={() => setEmailModal({ open: false })} style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--bg)',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}>✕</button>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="e.g., Your Nyra account"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 10,
                    fontSize: '.9rem',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Message</label>
                <textarea
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  placeholder="Write your message..."
                  style={{
                    width: '100%',
                    minHeight: 140,
                    padding: '12px 14px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 10,
                    fontSize: '.9rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'Inter, sans-serif'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setEmailModal({ open: false })} style={{
                  padding: '12px 20px',
                  background: 'transparent',
                  border: '1.5px solid var(--border)',
                  borderRadius: 10,
                  fontSize: '.85rem',
                  fontWeight: 600,
                  color: 'var(--text2)',
                  cursor: 'pointer'
                }}>Cancel</button>
                <button onClick={() => {
                  // For now, open mailto link - in production, use email API
                  const mailto = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                  window.open(mailto, '_blank');
                  setEmailModal({ open: false });
                  setEmailSubject('');
                  setEmailBody('');
                }} style={{
                  padding: '12px 24px',
                  background: 'var(--blue)',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '.85rem',
                  fontWeight: 700,
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(33,119,209,.25)'
                }}>Send Email →</button>
              </div>
              
              <div style={{ marginTop: 16, padding: 12, background: 'var(--bg)', borderRadius: 10, fontSize: '.75rem', color: 'var(--muted)', textAlign: 'center' }}>
                💡 This opens your email client. For bulk emails, integrate with SendGrid or Resend.
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
