import { BrowserProvider, Contract, JsonRpcProvider, id, type Signer } from "ethers";
import abi from "./abi/SupplyChain.json";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string;
export const RPC_URL = (import.meta.env.VITE_RPC_URL as string) || "http://127.0.0.1:8545";

export const rpc = new JsonRpcProvider(RPC_URL);
export const STATUSES = ["Manufactured", "Shipped", "In Transit", "Delivered", "Recalled"] as const;
export const STAGES = ["Manufacturer", "Distributor", "Retailer", "Customer"] as const;
export const DEMO_ROLES = ["Admin", "Manufacturer", "Distributor", "Retailer", "Customer"];
export const ROLE_IDS = {
  Manufacturer: id("MANUFACTURER_ROLE"),
  Distributor: id("DISTRIBUTOR_ROLE"),
  Retailer: id("RETAILER_ROLE"),
  Admin: "0x" + "0".repeat(64),
};

declare global { interface Window { ethereum?: any } }

export const readContract = () => new Contract(CONTRACT_ADDRESS, abi, rpc);
export const writeContract = (signer: Signer) => new Contract(CONTRACT_ADDRESS, abi, signer);

export async function metaMaskSigner() {
  if (!window.ethereum) throw new Error("MetaMask not found. Use the demo accounts instead.");
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
export const ZERO = "0x0000000000000000000000000000000000000000";

const FRIENDLY: Record<string, string> = {
  InvalidHandoff: "Rejected: invalid handoff. Custody must follow Manufacturer → Distributor → Retailer → Customer.",
  NotCurrentOwner: "Rejected: only the current custodian (or admin/manufacturer for recalls) can do this.",
  ProductIsRecalled: "Rejected: this product has been recalled and is frozen.",
  ProductNotFound: "Product not found on the blockchain — possible counterfeit.",
  InvalidRecipient: "Rejected: invalid recipient address.",
  EmptyName: "Product name is required.",
  InvalidStatus: "Use the recall button to recall a product.",
  AccessControlUnauthorizedAccount: "Rejected: this account does not have the required role.",
};

export function errMsg(e: any): string {
  const name = e?.revert?.name;
  if (name && FRIENDLY[name]) return FRIENDLY[name];
  return e?.reason || e?.shortMessage || e?.message || "Transaction failed";
}

export function parseDetails(s: string): { category?: string; quantity?: string; description?: string } {
  try { return JSON.parse(s || "{}"); } catch { return {}; }
}
