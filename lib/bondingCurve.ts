export const VIRTUAL_BOT   = BigInt("30000000000000000000");
export const VIRTUAL_TOKEN = BigInt("1073000191000000000000000000");
export const GRADUATION    = BigInt("500000000000000000000");
export const TOTAL_SUPPLY  = BigInt("1000000000000000000000000000");
export const CREATE_FEE    = BigInt("5000000000000000");

export function getBotToTokens(botIn: bigint, vBot: bigint, vToken: bigint): bigint {
  return vToken - (vBot * vToken) / (vBot + botIn);
}
export function getTokensToBOT(tokIn: bigint, vBot: bigint, vToken: bigint): bigint {
  return vBot - (vBot * vToken) / (vToken + tokIn);
}
export function getSpotPrice(vBot: bigint, vToken: bigint): bigint {
  return vToken === 0n ? 0n : (vBot * BigInt(1e18)) / vToken;
}
export function getMarketCap(vBot: bigint, vToken: bigint): bigint {
  return (getSpotPrice(vBot, vToken) * TOTAL_SUPPLY) / BigInt(1e18);
}
export function getProgress(botRaised: bigint): number {
  return Math.min(100, Number((botRaised * 100n) / GRADUATION));
}
export function buildCurvePoints(vBot: bigint, vToken: bigint, steps = 60) {
  const k = vBot * vToken;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const b = vBot + (GRADUATION * BigInt(i)) / BigInt(steps);
    const t = k / b;
    return { bot: Number(b) / 1e18, price: t > 0n ? Number((b * 1_000_000n) / t) / 1_000_000 : 0 };
  });
}
export const fmt = {
  bot:   (v: bigint | string, dp = 4) => (Number(BigInt(v.toString())) / 1e18).toFixed(dp),
  token: (v: bigint | string, dp = 0) => (Number(BigInt(v.toString())) / 1e18).toLocaleString(undefined, { maximumFractionDigits: dp }),
  price: (v: bigint, dp = 8)          => (Number(v) / 1e18).toFixed(dp),
  short: (a: string)                  => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "",
  age:   (ts: number) => {
    const s = Math.floor(Date.now() / 1000) - ts;
    if (s < 60)   return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  },
};
