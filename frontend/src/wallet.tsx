import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Signer } from "ethers";
import { DEMO_ROLES, ROLE_IDS, metaMaskSigner, readContract, rpc, short } from "./contract";

interface Ctx {
  signer: Signer | null; address: string | null; accounts: string[]; mode: "demo" | "metamask";
  roles: string[]; error: string | null;
  setDemo: (i: number) => Promise<void>; switchTo: (addr: string) => Promise<boolean>;
  useMetaMask: () => Promise<void>; labelFor: (a: string) => string; demoIndex: number;
}
const WalletCtx = createContext<Ctx>(null as unknown as Ctx);
export const useWallet = () => useContext(WalletCtx);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [mode, setMode] = useState<"demo" | "metamask">("demo");
  const [demoIndex, setDemoIndex] = useState(1);
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const setDemo = useCallback(async (i: number) => {
    const s = await rpc.getSigner(i);
    setSigner(s); setAddress(await s.getAddress()); setMode("demo"); setDemoIndex(i);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const list: string[] = await rpc.send("eth_accounts", []);
        setAccounts(list);
        await setDemo(1);
      } catch {
        setError("Cannot reach the local blockchain. Start it with: npx hardhat node");
      }
    })();
  }, [setDemo]);

  useEffect(() => {
    if (!address) return;
    (async () => {
      try {
        const c = readContract();
        const found: string[] = [];
        for (const [name, rid] of Object.entries(ROLE_IDS)) if (await c.hasRole(rid, address)) found.push(name);
        setRoles(found);
      } catch { setRoles([]); }
    })();
  }, [address]);

  const useMetaMask = async () => {
    try {
      const s = await metaMaskSigner();
      setSigner(s); setAddress(await s.getAddress()); setMode("metamask"); setError(null);
    } catch (e: any) { setError(e.message); }
  };

  const switchTo = async (addr: string) => {
    const i = accounts.findIndex((a) => a.toLowerCase() === addr.toLowerCase());
    if (i < 0) return false;
    await setDemo(i);
    return true;
  };

  const labelFor = (a: string) => {
    const i = accounts.findIndex((x) => x.toLowerCase() === a.toLowerCase());
    return i >= 0 && i < DEMO_ROLES.length ? `${DEMO_ROLES[i]} (${short(a)})` : short(a);
  };

  return (
    <WalletCtx.Provider value={{ signer, address, accounts, mode, roles, error, setDemo, switchTo, useMetaMask, labelFor, demoIndex }}>
      {children}
    </WalletCtx.Provider>
  );
}
