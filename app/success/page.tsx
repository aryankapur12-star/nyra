"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;

    fetch("/api/save-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).then(() => {
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 3000);
    });
  }, []);

  return (
    <div className="card">
      <div className="icon">🎉</div>
      <h1>You're all set!</h1>
      <p><span className="dot" />Redirecting you to your dashboard...</p>
    </div>
  );
}

export default function Success() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; color: #f0eeff; font-family: 'DM Sans', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .card { text-align: center; padding: 48px 40px; max-width: 440px; background: #13131a; border: 1px solid #1e1e2e; border-radius: 24px; }
        .icon { font-size: 4rem; margin-bottom: 24px; }
        h1 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 2rem; margin-bottom: 12px; letter-spacing: -0.02em; }
        p { color: #7a7a9a; line-height: 1.6; }
        .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #7c6aff; animation: pulse 1s infinite; margin-right: 8px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
      <Suspense fallback={<div style={{color:"#f0eeff", fontFamily:"sans-serif"}}>Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </>
  );
}
