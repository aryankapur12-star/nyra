"use client";
import { useEffect, useState } from "react";

type Bill = {
  id: string;
  bill_name: string;
  amount: number;
  due_date: string;
  recurring: boolean;
};

type User = {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  created_at: string;
  bills: Bill[];
};

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setAuthed(true);
    } else {
      setError("Incorrect password");
    }
  };

  const totalRevenue = users.reduce((sum, u) => sum + u.bills.length, 0);
  const totalBills = users.reduce((sum, u) => sum + u.bills.length, 0);

  if (!authed) return (
    <div style={{background:"#0a0a0f",color:"#f0eeff",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
      <div style={{background:"#13131a",border:"1px solid #1e1e2e",borderRadius:"24px",padding:"48px 40px",width:"100%",maxWidth:"400px"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1.8rem",marginBottom:"8px",background:"linear-gradient(135deg,#7c6aff,#ff6a9b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          Nyra Admin
        </div>
        <div style={{color:"#7a7a9a",fontSize:"0.9rem",marginBottom:"32px"}}>by Financial Futures Education</div>
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:"16px"}}>
            <label style={{display:"block",fontSize:"0.75rem",color:"#7a7a9a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"6px"}}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              style={{width:"100%",background:"#0a0a0f",border:"1px solid #1e1e2e",borderRadius:"10px",padding:"12px 14px",color:"#f0eeff",fontFamily:"sans-serif",fontSize:"0.9rem",outline:"none"}}
              required
            />
          </div>
          {error && <div style={{color:"#ff6a9b",fontSize:"0.85rem",marginBottom:"12px"}}>{error}</div>}
          <button type="submit" style={{width:"100%",background:"linear-gradient(135deg,#7c6aff,#9b5fff)",color:"white",border:"none",padding:"14px",borderRadius:"10px",fontFamily:"sans-serif",fontWeight:700,fontSize:"1rem",cursor:"pointer"}}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{background:"#0a0a0f",color:"#f0eeff",minHeight:"100vh",fontFamily:"sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 48px",borderBottom:"1px solid #1e1e2e",background:"rgba(10,10,15,0.8)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:10}}>
        <div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1.4rem",background:"linear-gradient(135deg,#7c6aff,#ff6a9b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Nyra Admin</div>
          <div style={{fontSize:"0.6rem",color:"#7a7a9a",letterSpacing:"0.04em"}}>by Financial Futures Education</div>
        </div>
        <button onClick={() => setAuthed(false)} style={{background:"transparent",border:"1px solid #1e1e2e",color:"#7a7a9a",padding:"8px 18px",borderRadius:"100px",fontFamily:"sans-serif",fontSize:"0.85rem",cursor:"pointer"}}>
          Sign out
        </button>
      </nav>

      <div style={{maxWidth:"1000px",margin:"0 auto",padding:"48px 24px"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"2rem",letterSpacing:"-0.02em",marginBottom:"8px"}}>Dashboard</div>
        <div style={{color:"#7a7a9a",marginBottom:"40px"}}>Overview of all Nyra users</div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px",marginBottom:"40px"}}>
          <div style={{background:"#13131a",border:"1px solid #1e1e2e",borderRadius:"20px",padding:"24px"}}>
            <div style={{fontSize:"0.75rem",color:"#7a7a9a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"8px"}}>Total Users</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"2rem",color:"#6affda"}}>{users.length}</div>
          </div>
          <div style={{background:"#13131a",border:"1px solid #1e1e2e",borderRadius:"20px",padding:"24px"}}>
            <div style={{fontSize:"0.75rem",color:"#7a7a9a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"8px"}}>Total Bills</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"2rem",color:"#7c6aff"}}>{totalBills}</div>
          </div>
          <div style={{background:"#13131a",border:"1px solid #1e1e2e",borderRadius:"20px",padding:"24px"}}>
            <div style={{fontSize:"0.75rem",color:"#7a7a9a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"8px"}}>Monthly Revenue</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"2rem",color:"#ff6a9b"}}>${totalRevenue}</div>
          </div>
        </div>

        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"1.1rem",marginBottom:"16px"}}>All Users</div>

        {users.length === 0 ? (
          <div style={{textAlign:"center",padding:"48px",color:"#7a7a9a"}}>No users yet</div>
        ) : (
          users.map(user => (
            <div key={user.id} style={{background:"#13131a",border:"1px solid #1e1e2e",borderRadius:"16px",padding:"24px",marginBottom:"12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"16px"}}>
                <div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"1rem",marginBottom:"4px"}}>{user.full_name || "—"}</div>
                  <div style={{fontSize:"0.82rem",color:"#7a7a9a"}}>{user.email} · {user.phone_number || "No phone"}</div>
                  <div style={{fontSize:"0.75rem",color:"#7a7a9a",marginTop:"2px"}}>Joined {new Date(user.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"1.4rem",color:"#ff6a9b"}}>${user.bills.length}/mo</div>
                  <div style={{fontSize:"0.75rem",color:"#7a7a9a"}}>{user.bills.length} bill{user.bills.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
              {user.bills.length > 0 && (
                <div style={{borderTop:"1px solid #1e1e2e",paddingTop:"12px",display:"flex",flexWrap:"wrap",gap:"8px"}}>
                  {user.bills.map(bill => (
                    <div key={bill.id} style={{background:"rgba(124,106,255,0.1)",border:"1px solid rgba(124,106,255,0.2)",borderRadius:"8px",padding:"6px 12px",fontSize:"0.8rem"}}>
                      {bill.bill_name} · ${bill.amount} · {new Date(bill.due_date).toLocaleDateString()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
