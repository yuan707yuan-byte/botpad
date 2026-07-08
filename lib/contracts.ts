export const LAUNCHPAD_ADDRESS =
  process.env.NEXT_PUBLIC_LAUNCHPAD_ADDRESS ?? "";

export const BOT_CHAIN = {
  id:       parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? "968"),
  name:     process.env.NEXT_PUBLIC_CHAIN_NAME ?? "BOT Chain",
  rpc:      process.env.BOT_CHAIN_RPC ?? "https://rpc.bohr.life",
  explorer: process.env.NEXT_PUBLIC_EXPLORER ?? "https://scan.bohr.life",
  faucet:   process.env.NEXT_PUBLIC_FAUCET ?? "https://faucet.botchain.ai/basic",
  currency: { name: "BOT", symbol: "BOT", decimals: 18 },
};

export const LAUNCHPAD_ABI = [
  "function createToken(string,string,string,string,string,string) payable returns (address)",
  "function buyTokens(address,uint256) payable",
  "function sellTokens(address,uint256,uint256)",
  "function previewBuy(address,uint256) view returns (uint256)",
  "function previewSell(address,uint256) view returns (uint256)",
  "function getCurrentPrice(address) view returns (uint256)",
  "function getProgress(address) view returns (uint256)",
  "function getTokenCount() view returns (uint256)",
  "function getTokenList(uint256,uint256) view returns (address[])",
  "function tokens(address) view returns (address,uint256,uint256,uint256,bool,uint256)",
  "function GRADUATION_BOT() view returns (uint256)",
  "function CREATE_FEE() view returns (uint256)",
  "event TokenCreated(address indexed,address indexed,string,string,uint256)",
  "event TokenBought(address indexed,address indexed,uint256,uint256,uint256)",
  "event TokenSold(address indexed,address indexed,uint256,uint256,uint256)",
  "event TokenGraduated(address indexed,uint256,uint256)",
] as const;

export const LAUNCH_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function creator() view returns (address)",
  "function imageURI() view returns (string)",
  "function description() view returns (string)",
  "function websiteURL() view returns (string)",
  "function twitterURL() view returns (string)",
  "function createdAt() view returns (uint256)",
] as const;
