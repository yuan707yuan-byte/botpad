import { NextResponse } from "next/server";

const ADJECTIVES = ["Moon","Cyber","Quantum","Nova","Turbo","Hyper","Nano","Mega","Alpha","Sigma","Apex","Blaze","Ghost","Neon","Degen","Chad","Gigga","Ultra","Turbo","Ape"];
const NOUNS      = ["Bot","Chain","Coin","Gem","Star","Doge","Pepe","Frog","Bear","Bull","Punk","Dragon","Ninja","Rocket","Panda","Cat","Dog","Ape","King","Wizard"];
const DESCS      = ["The most based token on BOT Chain. Zero VC. 100% fair launch. WAGMI.","Born on BOT Chain to disrupt everything. Diamond hands only. LFG.","Community-driven meme token. No roadmap needed when you have vibes.","DePIN meets memes. BOT Chain's fastest growing community token.","The people's token. Fair launch, bonding curve, pure degeneracy."];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function ruleBased(theme: string) {
  const adj = pick(ADJECTIVES), noun = pick(NOUNS);
  const name = theme ? `${theme.split(" ").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ")} ${noun}` : `${adj} ${noun}`;
  const symbol = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 5);
  return { name, symbol, description: pick(DESCS) };
}

async function groq(prompt: string) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a crypto token naming assistant for BOT Chain (EVM Layer-1, Chain ID 968). Reply ONLY with valid JSON: {\"name\":\"...\",\"symbol\":\"...\",\"description\":\"...\"}. Name ≤4 words. Symbol 3-5 uppercase letters. Description ≤120 chars, fun and catchy. No markdown, no extra text." },
        { role: "user", content: prompt }
      ],
      max_tokens: 200, temperature: 0.9
    })
  });
  if (!r.ok) throw new Error("groq " + r.status);
  const d = await r.json();
  return JSON.parse(d.choices[0].message.content.replace(/```json?|```/g, "").trim());
}

async function huggingface(prompt: string) {
  const r = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.HF_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: `<s>[INST] Create a crypto token for BOT Chain about: "${prompt}". Reply ONLY as JSON: {"name":"...","symbol":"...","description":"..."} [/INST]`, parameters: { max_new_tokens: 150, temperature: 0.8, return_full_text: false } })
  });
  if (!r.ok) throw new Error("hf " + r.status);
  const d = await r.json();
  const m = (d[0]?.generated_text ?? "").match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : null;
}

export async function POST(req: Request) {
  const { prompt = "", theme = "" } = await req.json();
  const input = prompt || theme || "meme token on BOT Chain";
  let result: Record<string, string> = {};

  if (process.env.GROQ_API_KEY) {
    try { result = await groq(input); } catch {}
  }
  if (!result.name && process.env.HF_API_KEY) {
    try { result = await huggingface(input) ?? {}; } catch {}
  }
  if (!result.name) result = ruleBased(theme || prompt);

  return NextResponse.json({ ok: true, ...result });
}
