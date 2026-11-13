import { BrowserProvider, Contract, JsonRpcProvider, type Signer } from "ethers";
import abi from "./abi/SupplyChain.json";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string;
const RPC_URL = (import.meta.env.VITE_RPC_URL as string) || "http://127.0.0.1:8545";

export const STATUSES = ["Manufactured", "Shipped", "In Transit", "Delivered", "Recalled"] as const;

declare global {
  interface Window { ethereum?: any }
}

export function readContract() {
  const provider = window.ethereum ? new BrowserProvider(window.ethereum) : new JsonRpcProvider(RPC_URL);
  return new Contract(CONTRACT_ADDRESS, abi, provider);
}

export async function connectWallet(): Promise<{ signer: Signer; address: string }> {
  if (!window.ethereum) throw new Error("MetaMask not found. Install it to continue.");
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  return { signer, address: await signer.getAddress() };
}

export function writeContract(signer: Signer) {
  return new Contract(CONTRACT_ADDRESS, abi, signer);
}

export function errMsg(e: any): string {
  return e?.reason || e?.shortMessage || e?.info?.error?.message || e?.message || "Transaction failed";
}
