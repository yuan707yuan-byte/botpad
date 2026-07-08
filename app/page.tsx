"use client";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/bondingCurve";
import { LAUNCHPAD_ADDRESS } from "@/lib/contracts";

interface Token {
  address: string; name: string; symbol: string; imageURI: string;
  description: string; botRaised: string; price: string;
  progress: number; graduated: boolean; createdAt: number;
}

function TokenCard({ t }: { t: Token }) {
  const hasImg = t.imageURI?.startsWith("http");
  return (
    <a href={`/token/${t.address}`} style={{ textDecoration: "none" }}>
      <div className="card fade-in" style={{ cursor: "pointer", transition: "border-color .2s", height: "100%" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--primary)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, background: hasImg ? "transparent" : "linear-gradient(135deg,#00ffb2,#7b61ff)", color: "#000" }}>
            {hasImg ? <img src={t.imageURI} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : t.symbol?.slice(0, 2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
            <div className="mono" style={{ fontSize: 12, color: "var(--primary)" }}>${t.symbol}</div>
          </div>
          {t.graduated && <span className="badge-purple">🎓 DEX</span>}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div className="mono" style={{ fontSize: 12, color: "var(--primary)" }}>{fmt.bot(t.botRaised)} BOT</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>raised</div>
          </div>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{t.description}</p>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6, color: "var(--muted)" }}>
            <span>Progress to DEX</span>
            <span className="mono" style={{ color: t.progress >= 100 ? "var(--purple)" : "var(--primary)" }}>{t.progress.toFixed(1)}%</span>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${t.progress}%` }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: "var(--muted)" }}>
            <span>Price: <span className="mono" style={{ color: "var(--text)" }}>{fmt.bot(t.price, 8)} BOT</span></span>
            <span>{fmt.age(t.createdAt)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function Home() {
  const [tokens, setTokens]   = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<"all" | "live" | "graduated">("all");

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch("/api/tokens?page=0&limit=40");
      const d = await r.json();
      if (d.ok) setTokens(d.tokens);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, []);

  const shown = tokens.filter(t =>
    filter === "graduated" ? t.graduated : filter === "live" ? !t.graduated : true
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 12 }}>
          <span className="grad">Launch tokens on BOT Chain</span>
        </h1>
        <p style={{ fontSize: 18, color: "var(--muted)", marginBottom: 24 }}>
          Bonding curve trading → auto-graduates to DEX at 500 BOT
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/create" className="btn-primary" style={{ fontSize: 16, padding: "12px 32px" }}>🚀 Create Token</a>
          <a href="https://dex.botchain.ai" target="_blank" className="btn-outline" style={{ fontSize: 16, padding: "12px 32px" }}>📈 BOT DEX</a>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 32, flexWrap: "wrap" }}>
          {[["Tokens launched", tokens.length], ["Graduated", tokens.filter(t => t.graduated).length], ["Total raised", tokens.reduce((a, t) => a + Number(BigInt(t.botRaised)) / 1e18, 0).toFixed(1) + " BOT"]].map(([l, v]) => (
            <div key={l as string} style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)" }}>{v}</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {!LAUNCHPAD_ADDRESS && (
        <div className="card" style={{ padding: 20, marginBottom: 24, borderColor: "rgba(255,193,7,.3)", background: "rgba(255,193,7,.05)", textAlign: "center" }}>
          <div style={{ color: "#ffc107", fontWeight: 600, marginBottom: 6 }}>⚠️ Contract not configured</div>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Set <code style={{ background: "rgba(0,0,0,.3)", padding: "1px 6px", borderRadius: 4 }}>NEXT_PUBLIC_LAUNCHPAD_ADDRESS</code> in Vercel environment variables after deploying the contract.</p>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {(["all", "live", "graduated"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? "btn-primary" : "btn-outline"} style={{ padding: "6px 18px", fontSize: 13 }}>
            {f === "all" ? "🔥 All" : f === "live" ? "⚡ Live" : "🎓 Graduated"}
          </button>
        ))}
        <button onClick={load} className="btn-outline" style={{ marginLeft: "auto", padding: "6px 18px", fontSize: 13 }}>↻ Refresh</button>
      </div>

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card" style={{ height: 200, opacity: .4 }} />)}
        </div>
      )}

      {!loading && shown.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
          <p style={{ color: "var(--muted)", marginBottom: 16 }}>No tokens yet — be the first!</p>
          <a href="/create" className="btn-primary">Create First Token</a>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
        {shown.map(t => <TokenCard key={t.address} t={t} />)}
      </div>

      {/* How it works */}
      <div className="card" style={{ marginTop: 64, padding: 32 }}>
        <h2 style={{ fontWeight: 700, fontSize: 20, textAlign: "center", marginBottom: 24 }}>How it works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 24 }}>
          {[
            ["1. Launch", "AI generates your token. Deploy with 0.005 BOT creation fee."],
            ["2. Trade", "Anyone buys/sells via bonding curve. Price rises with each buy."],
            ["3. Graduate", "At 500 BOT raised, auto-promotes to BOT Chain DEX."],
            ["4. DEX Locked", "350 BOT + 70% supply → permanent DEX liquidity. 150 BOT → platform."],
          ].map(([t, d]) => (
            <div key={t} style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 600, color: "var(--primary)", marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
