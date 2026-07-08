import { ethers } from "ethers";
import { BOT_CHAIN } from "./contracts";

declare global { interface Window { ethereum?: any } }

export function getReadProvider() {
  return new ethers.JsonRpcProvider(BOT_CHAIN.rpc, { chainId: BOT_CHAIN.id, name: BOT_CHAIN.name });
}

export async function getSigner() {
  if (!window.ethereum) throw new Error("Install MetaMask first.");
  const provider = new ethers.BrowserProvider(window.ethereum);
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${BOT_CHAIN.id.toString(16)}` }],
    });
  } catch (e: any) {
    if (e.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId:           `0x${BOT_CHAIN.id.toString(16)}`,
          chainName:         BOT_CHAIN.name,
          nativeCurrency:    BOT_CHAIN.currency,
          rpcUrls:           [BOT_CHAIN.rpc],
          blockExplorerUrls: [BOT_CHAIN.explorer],
        }],
      });
    } else throw e;
  }
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

export const explorerTx   = (h: string) => `${BOT_CHAIN.explorer}/tx/${h}`;
export const explorerAddr  = (a: string) => `${BOT_CHAIN.explorer}/address/${a}`;
