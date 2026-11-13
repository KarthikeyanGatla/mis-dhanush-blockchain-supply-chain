import { createContext, useContext, useState, type ReactNode } from "react";
import type { Signer } from "ethers";
import { connectWallet } from "./contract";

interface Ctx { address: string | null; signer: Signer | null; connect: () => Promise<void>; error: string | null }
const WalletCtx = createContext<Ctx>({ address: null, signer: null, connect: async () => {}, error: null });
export const useWallet = () => useContext(WalletCtx);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const connect = async () => {
    try {
      const w = await connectWallet();
      setAddress(w.address); setSigner(w.signer); setError(null);
    } catch (e: any) { setError(e.message); }
  };
  return <WalletCtx.Provider value={{ address, signer, connect, error }}>{children}</WalletCtx.Provider>;
}
