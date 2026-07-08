import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { BOT_CHAIN, LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, LAUNCH_TOKEN_ABI } from "@/lib/contracts";

export const runtime = "nodejs";

const provider = new ethers.JsonRpcProvider(BOT_CHAIN.rpc, {
  chainId: BOT_CHAIN.id,
  name: BOT_CHAIN.name,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page  = Math.max(0, parseInt(searchParams.get("page")  ?? "0"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  if (!LAUNCHPAD_ADDRESS) {
    return NextResponse.json(
      { ok: false, error: "NEXT_PUBLIC_LAUNCHPAD_ADDRESS not set. Deploy the contract first." },
      { status: 503 }
    );
  }

  try {
    const lp = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, provider);
    const addresses: string[] = await lp.getTokenList(page * limit, limit);

    const tokens = await Promise.all(
      addresses.map(async (addr) => {
        try {
          const tok = new ethers.Contract(addr, LAUNCH_TOKEN_ABI, provider);
          const [info, name, symbol, imageURI, description, createdAt] = await Promise.all([
            lp.tokens(addr),
            tok.name(), tok.symbol(), tok.imageURI(),
            tok.description(), tok.createdAt(),
          ]);
          const [, vBot, vToken, botRaised, graduated] = info;
          const price    = vToken > 0n ? (vBot * BigInt(1e18)) / vToken : 0n;
          const progress = Math.min(100, Number((botRaised * 100n) / BigInt("500000000000000000000")));
          return { address: addr, name, symbol, imageURI, description, createdAt: Number(createdAt), botRaised: botRaised.toString(), price: price.toString(), progress, graduated, vBot: vBot.toString(), vToken: vToken.toString() };
        } catch { return null; }
      })
    );

    return NextResponse.json(
      { ok: true, tokens: tokens.filter(Boolean), page, limit },
      { headers: { "Cache-Control": "s-maxage=5, stale-while-revalidate=10" } }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
