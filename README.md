# BOT Chain Launchpad 🚀

Pump-style fair-launch token launchpad on **BOT Chain (Chain ID 968)**.

## How it works
1. Creator pays 0.005 BOT → deploys a 1B supply token
2. Buyers trade via bonding curve (price rises with each buy)
3. At **500 BOT raised** → auto-graduates:
   - **350 BOT + 700M tokens** → permanent DEX liquidity (LP burned)
   - **150 BOT** → admin wallet revenue
4. Token now tradeable on BOT Chain DEX

## Setup

### 1. Install & deploy contract
```bash
npm install
cp .env.example .env
# Fill in PRIVATE_KEY, ADMIN_WALLET in .env
npm run compile
npm run deploy:botchain
# → Copy printed NEXT_PUBLIC_LAUNCHPAD_ADDRESS
```

### 2. Push to GitHub
```bash
git init && git add . && git commit -m "feat: BOT Chain Launchpad"
git remote add origin https://github.com/YOUR_USERNAME/bot-chain-launchpad.git
git push -u origin main
```

### 3. Deploy to Vercel
1. Go to **vercel.com/new** → Import GitHub repo
2. Add environment variables (from `.env.example`)  
3. Click **Deploy** — done!

## Vercel Environment Variables

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_LAUNCHPAD_ADDRESS` | Your deployed contract address |
| `NEXT_PUBLIC_CHAIN_ID` | `968` |
| `NEXT_PUBLIC_CHAIN_NAME` | `BOT Chain` |
| `NEXT_PUBLIC_EXPLORER` | `https://scan.bohr.life` |
| `NEXT_PUBLIC_FAUCET` | `https://faucet.botchain.ai/basic` |
| `BOT_CHAIN_RPC` | `https://rpc.bohr.life` |
| `GROQ_API_KEY` | Free from console.groq.com (optional) |

## Free AI — No paid API needed
- **Groq** (recommended): free at console.groq.com
- **HuggingFace**: free at huggingface.co  
- **Built-in**: rule-based generator, zero config, always works

## BOT Chain
| | |
|---|---|
| Chain ID | 968 |
| RPC | https://rpc.bohr.life |
| Explorer | https://scan.bohr.life |
| Faucet | https://faucet.botchain.ai/basic |
| DEX | https://dex.botchain.ai |

## Hackathon Submission
- [ ] Contract deployed on BOT Chain
- [ ] Frontend live on Vercel
- [ ] Repo public on GitHub
- [ ] Tweet tagging @BOTChain_ai
- [ ] Submit: https://docs.google.com/forms/d/e/1FAIpQLScscksg3In2-XeOVDOapxI9ruGMCep4KmFaXIrN52U0Yx9WoA/viewform
