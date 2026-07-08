"use client";
import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { getSigner, getReadProvider, explorerAddr, explorerTx } from "@/lib/blockchain";
import { LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, LAUNCH_TOKEN_ABI } from "@/lib/contracts";
import { fmt, buildCurvePoints, getProgress, GRADUATION, getBotToTokens, getTokensToBOT } from "@/lib/bondingCurve";

interface State {
  name: string; symbol: string; description: string; imageURI: string;
  websiteURL: string; twitterURL: string; creator: string; createdAt: number;
  vBot: bigint; vToken: bigint; botRaised: bigint;
  graduated: boolean; progress: number;
  userTokenBal: bigint; userBotBal: bigint;
}

function CurveChart({ vBot, vToken, botRaised }: { vBot: bigint; vToken: bigint; botRaised: bigint }) {
  const pts = buildCurvePoints(vBot, vToken, 80);
  const maxP = Math.max(...pts.map(p => p.price), 0.000001);
  const W = 500; const H = 180; const P = 30;
  const cx = (b: number) => P + ((b - pts[0].bot) / (pts[pts.length-1].bot - pts[0].bot || 1)) * (W - P * 2);
  const cy = (p: number) => H - P - (p / maxP) * (H - P * 2);
  const curB = Number(vBot) / 1e18;
  const all = pts.map((p, i) => `${i===0?"M":"L"}${cx(p.bot).toFixed(1)},${cy(p.price).toFixed(1)}`).join(" ");
  const filled = pts.filter(p => p.bot <= curB);
  const filledPath = filled.map((p,i) => `${i===0?"M":"L"}${cx(p.bot).toFixed(1)},${cy(p.price).toFixed(1)}`).join(" ");
  const curY = filled.length ? cy(filled[filled.length-1].price) : cy(pts[0].price);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 8, letterSpacing: 1 }}>BONDING CURVE</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxHeight: 190 }}>
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00ffb2" stopOpacity=".2"/>
            <stop offset="100%" stopColor="#00ffb2" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {filled.length > 1 && <path d={`${filledPath} L${cx(curB)},${H-P} L${P},${H-P} Z`} fill="url(#g)" />}
        <path d={all} fill="none" stroke="var(--border)" strokeWidth="2"/>
        {filled.length > 1 && <path d={filledPath} fill="none" stroke="var(--primary)" strokeWidth="2.5"/>}
        <line x1={cx(Number(vBot)/1e18 + Number(GRADUATION - botRaised)/1e18)} y1={P}
              x2={cx(Number(vBot)/1e18 + Number(GRADUATION - botRaised)/1e18)} y2={H-P}
              stroke="var(--purple)" strokeWidth="1" strokeDasharray="4,3" opacity=".7"/>
        <circle cx={cx(curB)} cy={curY} r="5" fill="var(--primary)"/>
        <circle cx={cx(curB)} cy={curY} r="9" fill="var(--primary)" opacity=".2"/>
        <text x={P} y={H-6} fontSize="9" fill="var(--muted)">0 BOT</text>
        <text x={W-P} y={H-6} fontSize="9" fill="var(--muted)" textAnchor="end">530 BOT</text>
        <text x={cx(Number(vBot)/1e18+Number(GRADUATION-botRaised)/1e18)} y={P-4} fontSize="9" fill="var(--purple)" textAnchor="middle">🎓 500 BOT</text>
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
        <span className="mono">Reserve: <span style={{ color: "var(--primary)" }}>{fmt.bot(vBot, 2)} BOT</span></span>
        <span className="mono">Raised: <span style={{ color: "var(--primary)" }}>{fmt.bot(botRaised, 2)} / 500 BOT</span></span>
      </div>
    </div>
  );
}

function TradePanel({ addr, state, onRefresh }: { addr: string; state: State; onRefresh: () => void }) {
  const [tab, setTab]       = useState<"buy"|"sell">("buy");
  const [amount, setAmount] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash]   = useState("");
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!amount || isNaN(+amount) || +amount <= 0) { setPreview(""); return; }
    try {
      if (tab === "buy") {
        const out = getBotToTokens(ethers.parseEther(amount), state.vBot, state.vToken);
        setPreview(`≈ ${fmt.token(out)} ${state.symbol}`);
      } else {
        const out = getTokensToBOT(ethers.parseUnits(amount, 18), state.vBot, state.vToken);
        setPreview(`≈ ${fmt.bot(out)} BOT`);
      }
    } catch { setPreview(""); }
  }, [amount, tab, state]);

  const execute = async () => {
    if (!amount || !LAUNCHPAD_ADDRESS) return;
    setLoading(true); setError(""); setTxHash("");
    try {
      const signer = await getSigner();
      const lp = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer);
      let tx;
      if (tab === "buy") {
        const botIn = ethers.parseEther(amount);
        tx = await lp.buyTokens(addr, getBotToTokens(botIn, state.vBot, state.vToken) * 95n / 100n, { value: botIn });
      } else {
        const tokIn = ethers.parseUnits(amount, 18);
        const tc = new ethers.Contract(addr, LAUNCH_TOKEN_ABI, signer);
        const al: bigint = await tc.allowance(await signer.getAddress(), LAUNCHPAD_ADDRESS);
        if (al < tokIn) { const a = await tc.approve(LAUNCHPAD_ADDRESS, ethers.MaxUint256); await a.wait(); }
        tx = await lp.sellTokens(addr, tokIn, getTokensToBOT(tokIn, state.vBot, state.vToken) * 95n / 100n);
      }
      const r = await tx.wait();
      setTxHash(r.hash); setAmount(""); onRefresh();
    } catch (e: any) { setError(e.reason ?? e.message); }
    finally { setLoading(false); }
  };

  const cs: Record<string, React.CSSProperties> = {
    card:  { padding: 20 },
    tabs:  { display: "flex", gap: 4, padding: 4, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", marginBottom: 18, width: "fit-content" },
    tabA:  { padding: "5px 22px", fontSize: 13, background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", borderRadius: 7, fontFamily: "inherit" },
    label: { display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 5 },
    rel:   { position: "relative", marginBottom: 12 },
    max:   { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: 11, fontWeight: 700 },
  };

  return (
    <div className="card" style={cs.card}>
      <div style={cs.tabs}>
        {(["buy","sell"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setAmount(""); setPreview(""); }}
            style={tab===t ? { padding:"5px 22px", fontSize:13, borderRadius:7, background:"var(--primary)", color:"#000", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"inherit" } : cs.tabA}>
            {t === "buy" ? "🟢 Buy" : "🔴 Sell"}
          </button>
        ))}
      </div>
      <label style={cs.label}>{tab === "buy" ? "BOT Amount" : `${state.symbol} Amount`}</label>
      <div style={cs.rel}>
        <input type="number" className="input" placeholder="0.0" value={amount} onChange={e => setAmount(e.target.value)} style={{ paddingRight: 50 }}/>
        <button style={cs.max} onClick={() => setAmount(tab === "buy" ? fmt.bot(state.userBotBal) : fmt.token(state.userTokenBal))}>MAX</button>
      </div>
      {preview && <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, marginBottom: 10 }}>You receive: {preview}</div>}
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
        BOT balance: <span className="mono">{fmt.bot(state.userBotBal)} BOT</span> · {state.symbol}: <span className="mono">{fmt.token(state.userTokenBal)}</span>
      </div>
      {error && <p style={{ fontSize: 12, color: "var(--red)", marginBottom: 10 }}>{error}</p>}
      {txHash && <a href={explorerTx(txHash)} target="_blank" style={{ fontSize: 12, color: "var(--primary)", display: "block", marginBottom: 10, textDecoration: "none" }}>✓ Tx: {txHash.slice(0,10)}…{txHash.slice(-6)}</a>}
      <button onClick={execute} disabled={loading || !amount || state.graduated} className="btn-primary" style={{ width: "100%", fontSize: 15, padding: 13 }}>
        {loading ? "⏳ Confirming…" : state.graduated ? "Graduated → trade on DEX" : tab === "buy" ? "Buy" : "Sell"}
      </button>
      <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 8 }}>5% slippage tolerance</p>
    </div>
  );
}

export default function TokenPage({ params }: { params: { address: string } }) {
  const { address } = params;
  const [state, setState]   = useState<State | null>(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState("");
  const [wallet, setWallet] = useState("");

  const load = useCallback(async () => {
    if (!LAUNCHPAD_ADDRESS) { setError("Contract not configured"); setLoad(false); return; }
    try {
      const prov = getReadProvider();
      const lp  = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, prov);
      const tok = new ethers.Contract(address, LAUNCH_TOKEN_ABI, prov);
      const [info, name, symbol, imageURI, description, websiteURL, twitterURL, creator, createdAt] = await Promise.all([
        lp.tokens(address), tok.name(), tok.symbol(), tok.imageURI(), tok.description(), tok.websiteURL(), tok.twitterURL(), tok.creator(), tok.createdAt()
      ]);
      const [, vBot, vToken, botRaised, graduated] = info;
      let userTokenBal = 0n, userBotBal = 0n;
      if (wallet) [userTokenBal, userBotBal] = await Promise.all([tok.balanceOf(wallet), prov.getBalance(wallet)]);
      setState({ name, symbol, imageURI, description, websiteURL, twitterURL, creator, createdAt: Number(createdAt), vBot, vToken, botRaised, graduated, progress: getProgress(botRaised), userTokenBal, userBotBal });
    } catch (e: any) { setError(e.message); }
    finally { setLoad(false); }
  }, [address, wallet]);

  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, [load]);

  const connect = async () => { try { const s = await getSigner(); setWallet(await s.getAddress()); } catch (e: any) { setError(e.message); } };

  if (loading) return <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 16px" }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>{[1,2,3].map(i=><div key={i} className="card" style={{ height: 200, opacity: .4 }}/>)}</div></div>;
  if (!state || error) return <div style={{ textAlign: "center", padding: 80, color: "var(--red)" }}>{error || "Token not found"}</div>;

  const price = state.vToken > 0n ? (state.vBot * BigInt(1e18)) / state.vToken : 0n;
  const mcap  = (price * BigInt("1000000000000000000000000000")) / BigInt(1e18);
  const hasImg = state.imageURI?.startsWith("http");

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
      <a href="/" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none", marginBottom: 20, display: "inline-block" }}>← Explore</a>

      {state.graduated && (
        <div className="card fade-in" style={{ padding: 20, marginBottom: 20, borderColor: "var(--purple)", background: "rgba(123,97,255,.07)", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🎓</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "var(--purple)", marginBottom: 6 }}>Graduated to BOT Chain DEX!</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>350 BOT + 700M tokens locked as permanent DEX liquidity.</div>
          <a href="https://dex.botchain.ai" target="_blank" className="btn-primary">Trade on BOT Chain DEX →</a>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{ width: 60, height: 60, borderRadius: 14, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20, background: hasImg ? "transparent" : "linear-gradient(135deg,#00ffb2,#7b61ff)", color: "#000" }}>
          {hasImg ? <img src={state.imageURI} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/> : state.symbol?.slice(0,2)}
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>{state.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
            <span className="mono" style={{ fontSize: 13, color: "var(--primary)" }}>${state.symbol}</span>
            <a href={explorerAddr(address)} target="_blank" className="mono" style={{ fontSize: 11, color: "var(--muted)", textDecoration: "none" }}>{fmt.short(address)}</a>
            {!wallet
              ? <button onClick={connect} className="btn-outline" style={{ padding: "3px 12px", fontSize: 12 }}>Connect Wallet</button>
              : <span className="badge-green">{fmt.short(wallet)}</span>}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
        {[["Price", fmt.bot(price, 8) + " BOT"], ["Market Cap", fmt.bot(mcap, 2) + " BOT"], ["Raised", fmt.bot(state.botRaised, 2) + " / 500"], ["Progress", state.progress.toFixed(1) + "%"]].map(([l, v]) => (
          <div key={l} className="card" style={{ padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{l}</div>
            <div className="mono" style={{ fontWeight: 700, color: "var(--primary)", fontSize: 15 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card" style={{ padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8, color: "var(--muted)" }}>
          <span>Graduation progress</span><span className="mono">{fmt.bot(state.botRaised, 2)} / 500 BOT</span>
        </div>
        <div className="progress-track" style={{ height: 10 }}><div className="progress-fill" style={{ width: `${state.progress}%` }}/></div>
        <div style={{ fontSize: 12, marginTop: 8, color: "var(--muted)" }}>
          {state.graduated ? "✅ Graduated — trading on DEX with locked liquidity"
            : `${(500 - Number(state.botRaised) / 1e18).toFixed(2)} BOT remaining → then 350 BOT + 700M tokens locked to DEX`}
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <CurveChart vBot={state.vBot} vToken={state.vToken} botRaised={state.botRaised}/>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 12, letterSpacing: 1 }}>ABOUT</div>
            <p style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>{state.description}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12 }}>
              {[["Creator", fmt.short(state.creator)], ["Created", fmt.age(state.createdAt)], ["Supply", "1,000,000,000"], ["Chain", "BOT Chain (968)"]].map(([k,v]) => (
                <div key={k}><span style={{ color: "var(--muted)" }}>{k}: </span><span className="mono">{v}</span></div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              {state.websiteURL && <a href={state.websiteURL} target="_blank" className="btn-outline" style={{ padding: "4px 12px", fontSize: 12 }}>🌐 Website</a>}
              {state.twitterURL && <a href={state.twitterURL} target="_blank" className="btn-outline" style={{ padding: "4px 12px", fontSize: 12 }}>🐦 X</a>}
              <a href={explorerAddr(address)} target="_blank" className="btn-outline" style={{ padding: "4px 12px", fontSize: 12 }}>🔍 Explorer</a>
            </div>
          </div>
        </div>
        <div><TradePanel addr={address} state={state} onRefresh={load}/></div>
      </div>
    </div>
  );
}
