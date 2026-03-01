"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Bill = {
  id: string;
  bill_name: string;
  amount: number;
  due_date: string;
  recurring: boolean;
  remind_days_before: number;
};

// Automatically roll forward a past due date based on frequency
function getNextDueDate(dueDateStr: string, recurring: boolean): string {
  if (!recurring) return dueDateStr;
  const due = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  while (due < today) {
    due.setMonth(due.getMonth() + 1);
  }
  return due.toISOString().split("T")[0];
}

// AI-powered billing cycle suggestion based on bill name
async function suggestBillingInfo(billName: string): Promise<{ frequency: string; typical_due_day: number | null }> {
  try {
    const res = await fetch("/api/suggest-billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billName }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { frequency: "monthly", typical_due_day: null };
  }
}

export default function Dashboard() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [newBill, setNewBill] = useState({ bill_name: "", amount: "", due_date: "", recurring: true, remind_days_before: 3 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      setUser(session.user);
      supabase.from("bills").select("*").eq("user_id", session.user.id).order("due_date")
        .then(async ({ data }) => {
          const bills = data || [];
          // Auto-update any past due dates
          const updatedBills = await Promise.all(bills.map(async (bill) => {
            if (!bill.recurring) return bill;
            const nextDate = getNextDueDate(bill.due_date, bill.recurring);
            if (nextDate !== bill.due_date) {
              await supabase.from("bills").update({ due_date: nextDate }).eq("id", bill.id);
              return { ...bill, due_date: nextDate };
            }
            return bill;
          }));
          setBills(updatedBills.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()));
          setLoading(false);
        });
    });
  }, []);

  // When bill name is typed, ask AI for suggestions after a short delay
  useEffect(() => {
    if (newBill.bill_name.length < 3) { setAiSuggestion(null); return; }
    const timeout = setTimeout(async () => {
      setAiLoading(true);
      const suggestion = await suggestBillingInfo(newBill.bill_name);
      setAiSuggestion(`💡 AI suggests: ${suggestion.frequency} billing${suggestion.typical_due_day ? `, typically due on the ${suggestion.typical_due_day}th` : ""}`);
      setAiLoading(false);
    }, 800);
    return () => clearTimeout(timeout);
  }, [newBill.bill_name]);

  const handleAddBill = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!user) return;
    const newTotal = bills.length + 1;
    const confirmed = window.confirm(
      `Adding this bill will increase your monthly payment by $1 to $${newTotal}/month. Confirm?`
    );
    if (!confirmed) return;
    const { data, error } = await supabase.from("bills").insert({
      user_id: user.id,
      bill_name: newBill.bill_name,
      amount: parseFloat(newBill.amount) || 0,
      due_date: newBill.due_date,
      recurring: newBill.recurring,
      remind_days_before: newBill.remind_days_before,
    }).select().single();
    if (!error && data) {
      setBills([...bills, data].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()));
      setNewBill({ bill_name: "", amount: "", due_date: "", recurring: true, remind_days_before: 3 });
      setAiSuggestion(null);
      setAdding(false);
      await fetch("/api/update-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, billCount: newTotal }),
      });
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Remove this bill from Nyra?")) return;
    await supabase.from("bills").delete().eq("id", id);
    const updatedBills = bills.filter(b => b.id !== id);
    setBills(updatedBills);
    await fetch("/api/update-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, billCount: updatedBills.length }),
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const totalMonthly = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const nextBill = bills.length > 0 ? bills[0] : null;
  const daysUntil = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading || !user) return (
    <div style={{background:"#0a0a0f", color:"#f0eeff", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif", fontSize:"1.1rem"}}>
      Loading your bills...
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0a0a0f; --surface: #13131a; --border: #1e1e2e;
          --accent: #7c6aff; --accent2: #ff6a9b; --accent3: #6affda;
          --text: #f0eeff; --muted: #7a7a9a;
        }
        body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
        nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 48px; border-bottom: 1px solid var(--border); background: rgba(10,10,15,0.8); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 10; }
        .logo-name { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.4rem; background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .logo-sub { font-size: 0.6rem; color: var(--muted); letter-spacing: 0.04em; }
        .sign-out { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 8px 18px; border-radius: 100px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; transition: border-color 0.2s, color 0.2s; }
        .sign-out:hover { border-color: var(--accent2); color: var(--accent2); }
        .main { max-width: 900px; margin: 0 auto; padding: 48px 24px; }
        .greeting { font-family: 'Syne', sans-serif; font-weight: 800; font-size: clamp(1.6rem, 3vw, 2.2rem); letter-spacing: -0.02em; margin-bottom: 8px; }
        .greeting-sub { color: var(--muted); font-size: 0.95rem; margin-bottom: 40px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 40px; }
        .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 24px; }
        .stat-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .stat-value { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.8rem; letter-spacing: -0.02em; }
        .stat-sub { font-size: 0.8rem; color: var(--muted); margin-top: 4px; }
        .green { color: var(--accent3); } .purple { color: var(--accent); } .pink { color: var(--accent2); }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .section-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.1rem; }
        .add-btn { background: var(--accent); color: white; border: none; padding: 10px 20px; border-radius: 100px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: opacity 0.2s; }
        .add-btn:hover { opacity: 0.85; }
        .bill-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; transition: border-color 0.2s; }
        .bill-card:hover { border-color: rgba(124,106,255,0.25); }
        .bill-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; margin-bottom: 4px; }
        .bill-meta { font-size: 0.8rem; color: var(--muted); }
        .bill-amount { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.2rem; margin-right: 16px; }
        .cancel-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 6px 14px; border-radius: 100px; font-size: 0.8rem; cursor: pointer; transition: border-color 0.2s, color 0.2s; font-family: 'DM Sans', sans-serif; }
        .cancel-btn:hover { border-color: var(--accent2); color: var(--accent2); }
        .add-form { background: var(--surface); border: 1px solid rgba(124,106,255,0.3); border-radius: 16px; padding: 24px; margin-bottom: 12px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .form-full { grid-column: 1 / -1; }
        label { display: block; font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; font-weight: 500; }
        input, select { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
        input:focus, select:focus { border-color: var(--accent); }
        input::placeholder { color: var(--muted); }
        select option { background: var(--surface); }
        .form-actions { display: flex; gap: 10px; }
        .save-btn { background: linear-gradient(135deg, var(--accent), #9b5fff); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-family: 'Syne', sans-serif; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
        .save-btn:hover { opacity: 0.9; }
        .discard-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 12px 24px; border-radius: 10px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: border-color 0.2s; }
        .discard-btn:hover { border-color: var(--accent2); }
        .empty { text-align: center; padding: 48px; color: var(--muted); font-size: 0.95rem; }
        .due-soon { color: var(--accent2); font-weight: 500; }
        .remind-badge { display: inline-block; background: rgba(124,106,255,0.1); color: var(--accent); padding: 2px 8px; border-radius: 100px; font-size: 0.72rem; margin-left: 8px; }
        .ai-suggestion { background: rgba(106,255,218,0.08); border: 1px solid rgba(106,255,218,0.2); color: var(--accent3); padding: 10px 14px; border-radius: 10px; font-size: 0.82rem; margin-top: 8px; }
        .ai-loading { color: var(--muted); font-size: 0.82rem; margin-top: 8px; }
        @media (max-width: 600px) {
          nav { padding: 16px 20px; } .main { padding: 32px 16px; }
          .form-grid { grid-template-columns: 1fr; } .bill-card { flex-wrap: wrap; gap: 12px; }
        }
      `}</style>

      <nav>
        <div>
          <div className="logo-name">Nyra</div>
          <div className="logo-sub">by Financial Futures Education</div>
        </div>
        <button className="sign-out" onClick={handleSignOut}>Sign out</button>
      </nav>

      <div className="main">
        <div className="greeting">Your bills 👋</div>
        <div className="greeting-sub">{user?.email ?? ""} · Managing {bills.length} bill{bills.length !== 1 ? "s" : ""}</div>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-label">Total monthly</div>
            <div className="stat-value green">${totalMonthly.toFixed(2)}</div>
            <div className="stat-sub">across {bills.length} bills</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Next due</div>
            <div className="stat-value purple">{nextBill ? nextBill.bill_name : "—"}</div>
            <div className="stat-sub">{nextBill ? `in ${daysUntil(nextBill.due_date)} days · $${nextBill.amount}` : "No bills yet"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Nyra plan</div>
            <div className="stat-value pink">${bills.length}/mo</div>
            <div className="stat-sub">{bills.length} bill{bills.length !== 1 ? "s" : ""} × $1 each</div>
          </div>
        </div>

        <div className="section-header">
          <div className="section-title">Your bills</div>
          <button className="add-btn" onClick={() => setAdding(!adding)}>+ Add bill</button>
        </div>

        {adding && (
          <div className="add-form">
            <form onSubmit={handleAddBill}>
              <div className="form-grid">
                <div className="form-full">
                  <label>Bill name</label>
                  <input type="text" placeholder="e.g. Netflix, Rent, Spotify" value={newBill.bill_name} onChange={e => setNewBill({...newBill, bill_name: e.target.value})} required />
                  {aiLoading && <div className="ai-loading">🤖 AI is thinking...</div>}
                  {aiSuggestion && !aiLoading && <div className="ai-suggestion">{aiSuggestion}</div>}
                </div>
                <div>
                  <label>Amount ($)</label>
                  <input type="number" placeholder="0.00" value={newBill.amount} onChange={e => setNewBill({...newBill, amount: e.target.value})} />
                </div>
                <div>
                  <label>Due date</label>
                  <input type="date" value={newBill.due_date} onChange={e => setNewBill({...newBill, due_date: e.target.value})} required />
                </div>
                <div className="form-full">
                  <label>Frequency</label>
                  <select value={newBill.recurring ? "recurring" : "once"} onChange={e => setNewBill({...newBill, recurring: e.target.value === "recurring"})}>
                    <option value="recurring">Monthly (recurring)</option>
                    <option value="once">One-time</option>
                  </select>
                </div>
                <div className="form-full">
                  <label>Remind me how many days before?</label>
                  <select value={newBill.remind_days_before} onChange={e => setNewBill({...newBill, remind_days_before: parseInt(e.target.value)})}>
                    <option value={1}>1 day before</option>
                    <option value={2}>2 days before</option>
                    <option value={3}>3 days before (recommended)</option>
                    <option value={5}>5 days before</option>
                    <option value={7}>7 days before</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn">Save bill</button>
                <button type="button" className="discard-btn" onClick={() => { setAdding(false); setAiSuggestion(null); }}>Discard</button>
              </div>
            </form>
          </div>
        )}

        {bills.length === 0 && !adding ? (
          <div className="empty">No bills yet — click "Add bill" to get started!</div>
        ) : (
          bills.map(bill => (
            <div className="bill-card" key={bill.id}>
              <div>
                <div className="bill-name">
                  {bill.bill_name}
                  <span className="remind-badge">⏰ {bill.remind_days_before || 3}d before</span>
                </div>
                <div className="bill-meta">
                  Due: {new Date(bill.due_date).toLocaleDateString()} ·{" "}
                  {daysUntil(bill.due_date) <= 3
                    ? <span className="due-soon">Due in {daysUntil(bill.due_date)} days!</span>
                    : `in ${daysUntil(bill.due_date)} days`
                  } · {bill.recurring ? "Monthly" : "One-time"}
                </div>
              </div>
              <div style={{display:"flex", alignItems:"center"}}>
                <div className="bill-amount">${bill.amount?.toFixed(2)}</div>
                <button className="cancel-btn" onClick={() => handleCancel(bill.id)}>Remove</button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
