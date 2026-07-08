"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { getSigner, explorerTx, explorerAddr } from "@/lib/blockchain";
import { LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI } from "@/lib/contracts";
import { CREATE_FEE } from "@/lib/bondingCurve";

const EMPTY = { name: "", symbol: "", description: "", imageURI: "", websiteURL: "", twitterURL: "" };

export default function CreatePage() {
  const [form, setForm]         = useState(EMPTY);
  const [prompt, setPrompt]     = useState("");
  const [aiLoading, setAI]      = useState(false);
  const [deploying, setDeploy]  = useState(false);
  const [result, setResult]     = useState<{ txHash: string; tokenAddress: string } | null>(null);
  const [error, setError]       = useState("");
  const [step, setStep]         = useState<"ai" | "form" | "deploy">("ai");

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const generate = async () => {
    if (!prompt.trim()) return;
    setAI(true); setError("");
    try {
      const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const d = await r.json();
      setForm(p => ({ ...p, name: d.name ?? p.name, symbol: d.symbol ?? p.symbol, description: d.description ?? p.description }));
      setStep("form");
    } catch (e: any) { setError(e.message); }
    finally { setAI(false); }
  };

  const deploy = async () => {
    if (!form.name || !form.symbol) { setError("Name and symbol required"); return; }
    if (!LAUNCHPAD_ADDRESS) { setError("NEXT_PUBLIC_LAUNCHPAD_ADDRESS not set in environment"); return; }
    setDeploy(true); setError("");
    try {
      const signer = await getSigner();
      const c = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer);
      const tx = await c.createToken(form.name, form.symbol, form.imageURI, form.description, form.websiteURL, form.twitterURL, { value: CREATE_FEE });
      const receipt = await tx.wait();
      const iface = new ethers.Interface(LAUNCHPAD_ABI);
      let tokenAddress = "";
      for (const log of receipt.logs) {
        try { const p = iface.parseLog(log); if (p?.name === "TokenCreated") { tokenAddress = p.args[0]; break; } } catch {}
      }
      setResult({ txHash: receipt.hash, tokenAddress });
      setStep("deploy");
    } catch (e: any) { setError(e.reason ?? e.message); }
    finally { setDeploy(false); }
  };

  const s: Record<string, React.CSSProperties> = {
    wrap:    { maxWidth: 600, margin: "0 auto", padding: "40px 16px" },
    card:    { padding: "24px" },
    label:   { display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 },
    tabRow:  { display: "flex", gap: 4, padding: 4, borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", marginBottom: 28, width: "fit-content" },
    tabA:    { padding: "6px 20px", fontSize: 13, background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", borderRadius: 7, fontFamily: "inherit" },
    row:     { display: "flex", gap: 12, marginTop: 16 },
    err:     { fontSize: 12, color: "var(--red)", marginTop: 10 },
    infoRow: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" },
  };

  if (step === "deploy" && result) {
    return (
      <div style={{ ...s.wrap, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}><span className="grad">Token Launched!</span></h1>
        <p style={{ color: "var(--muted)", marginBottom: 24 }}>{form.name} ({form.symbol}) is live on BOT Chain</p>
        <div className="card" style={{ ...s.card, textAlign: "left", marginBottom: 20 }}>
          {[["Token Address", result.tokenAddress, explorerAddr(result.tokenAddress)], ["Transaction", result.txHash, explorerTx(result.txHash)]].map(([label, val, link]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>{label}</div>
              <a href={link} target="_blank" className="mono" style={{ fontSize: 12, color: "var(--primary)", wordBreak: "break-all", textDecoration: "none" }}>{val}</a>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href={`/token/${result.tokenAddress}`} className="btn-primary">📈 Trade Now</a>
          <a href="/" className="btn-outline">← Explore</a>
        </div>
        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just launched ${form.name} ($${form.symbol}) on BOT Chain! 🚀\n@BOTChain_ai #BOTChain`)}`}
          target="_blank" className="btn-outline" style={{ marginTop: 12, display: "inline-block", fontSize: 13 }}>
          🐦 Tweet it (for hackathon submission)
        </a>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <a href="/" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", marginBottom: 16, display: "inline-block" }}>← Explore</a>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}><span className="grad">Launch a Token</span></h1>
      <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>AI-assisted deployment on BOT Chain (0.005 BOT fee)</p>

      <div style={s.tabRow}>
        {(["ai", "form", "deploy"] as const).map(t => (
          <button key={t} onClick={() => setStep(t)}
            style={step === t ? { padding: "6px 20px", fontSize: 13, borderRadius: 7, background: "var(--primary)", color: "#000", fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit" } : s.tabA}>
            {t === "ai" ? "🤖 AI" : t === "form" ? "📝 Details" : "🚀 Deploy"}
          </button>
        ))}
      </div>

      {/* AI step */}
      {step === "ai" && (
        <div className="card fade-in" style={s.card}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>🤖 AI Token Generator</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Free — uses Groq (if key set) or built-in generator. No paid API required.</div>
          </div>
          <label style={s.label}>Describe your token idea</label>
          <textarea className="input" rows={3} placeholder={`"A dog meme token for BOT Chain degens"\n"DePIN infrastructure token for compute nodes"`}
            value={prompt} onChange={e => setPrompt(e.target.value)} style={{ resize: "vertical" }} />
          {error && <p style={s.err}>{error}</p>}
          <div style={s.row}>
            <button onClick={generate} disabled={aiLoading || !prompt.trim()} className="btn-primary" style={{ flex: 1 }}>
              {aiLoading ? "✨ Generating…" : "✨ Generate with AI"}
            </button>
            <button onClick={() => setStep("form")} className="btn-outline">Skip →</button>
          </div>
        </div>
      )}

      {/* Form step */}
      {step === "form" && (
        <div className="card fade-in" style={s.card}>
          {form.name && (
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(0,255,178,.07)", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "var(--primary)" }}>✓ AI generated:</span>
              <strong>{form.name}</strong> <span className="mono" style={{ color: "var(--primary)", fontSize: 13 }}>${form.symbol}</span>
            </div>
          )}
          {([["name", "Token Name *", "Moon Ape"], ["symbol", "Symbol *", "MAPE"], ["description", "Description", "What is it about?"], ["imageURI", "Image URL", "https://…"], ["websiteURL", "Website", "https://…"], ["twitterURL", "Twitter/X", "https://x.com/…"]] as const).map(([k, label, ph]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <label style={s.label}>{label}</label>
              {k === "description"
                ? <textarea className="input" rows={2} placeholder={ph} value={form[k]} onChange={set(k)} style={{ resize: "vertical" }} />
                : <input type="text" className="input" placeholder={ph} value={form[k]} onChange={set(k)} />}
            </div>
          ))}
          <button onClick={() => setStep("deploy")} disabled={!form.name || !form.symbol} className="btn-primary" style={{ width: "100%", marginTop: 8 }}>
            Continue →
          </button>
        </div>
      )}

      {/* Deploy step */}
      {step === "deploy" && (
        <div className="card fade-in" style={s.card}>
          <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Review & Deploy</h2>
          <div style={{ marginBottom: 20 }}>
            {[["Name", form.name], ["Symbol", "$" + form.symbol], ["Description", form.description]].map(([k, v]) =>
              v ? <div key={k} style={s.infoRow}><span style={{ color: "var(--muted)" }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div> : null
            )}
          </div>
          <div className="card" style={{ padding: "14px 16px", marginBottom: 20, borderColor: "rgba(0,255,178,.2)", background: "rgba(0,255,178,.04)" }}>
            <div style={{ fontWeight: 600, color: "var(--primary)", fontSize: 13, marginBottom: 10 }}>Deployment summary</div>
            {[["Creation fee", "0.005 BOT"], ["Total supply", "1,000,000,000 tokens"], ["For bonding curve", "up to ~30%"], ["For DEX at graduation", "70% of supply"], ["Graduation at", "500 BOT raised"], ["DEX liquidity", "350 BOT + 700M tokens (locked)"], ["Platform revenue", "150 BOT → admin"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "2px 0" }}>
                <span style={{ color: "var(--muted)" }}>{k}</span>
                <span className="mono" style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          {error && <p style={s.err}>{error}</p>}
          <button onClick={deploy} disabled={deploying} className="btn-primary" style={{ width: "100%", fontSize: 16, padding: "13px" }}>
            {deploying ? "🔄 Deploying…" : "🚀 Deploy Token (0.005 BOT)"}
          </button>
          <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 10 }}>
            MetaMask will prompt to confirm. Make sure you are on BOT Chain (ID 968).
          </p>
        </div>
      )}
    </div>
  );
}
