require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const bal = await hre.ethers.provider.getBalance(deployer.address);
  console.log("\n🚀  Deploying to BOT Chain (Chain ID 968)");
  console.log("   Wallet :", deployer.address);
  console.log("   Balance:", hre.ethers.formatEther(bal), "BOT\n");

  const DEX_ROUTER   = process.env.DEX_ROUTER_ADDRESS || hre.ethers.ZeroAddress;
  const ADMIN_WALLET = process.env.ADMIN_WALLET        || deployer.address;

  const Launchpad = await hre.ethers.getContractFactory("TokenLaunchpad");
  const launchpad = await Launchpad.deploy(DEX_ROUTER, ADMIN_WALLET);
  await launchpad.waitForDeployment();
  const addr = await launchpad.getAddress();

  console.log("✅  TokenLaunchpad:", addr);
  console.log("   Explorer:", `https://scan.bohr.life/address/${addr}`);
  console.log("\n── Add to Vercel env vars ──────────────────────");
  console.log(`NEXT_PUBLIC_LAUNCHPAD_ADDRESS=${addr}`);
  console.log("────────────────────────────────────────────────\n");
}

main().catch(e => { console.error(e); process.exitCode = 1; });
