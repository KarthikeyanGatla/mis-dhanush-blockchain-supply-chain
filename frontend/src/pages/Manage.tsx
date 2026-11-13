import { useState } from "react";
import { useWallet } from "../wallet";
import { writeContract, STATUSES, errMsg } from "../contract";

export default function Manage() {
  const { signer, address } = useWallet();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(label: string, fn: () => Promise<any>) {
    setBusy(true); setMsg(null);
    try {
      const tx = await fn();
      await tx.wait();
      setMsg({ ok: true, text: `${label} confirmed: ${tx.hash}` });
    } catch (e) { setMsg({ ok: false, text: errMsg(e) }); }
    setBusy(false);
  }
  const f = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); return new FormData(e.currentTarget); };

  if (!signer) return <p>Connect your wallet to manage products.</p>;
  const c = () => writeContract(signer);
  return (
    <section>
      <h2>Manage products</h2>
      <p className="mono">Connected: {address}</p>

      <h3>Register batch (manufacturer)</h3>
      <form onSubmit={(e) => { const d = f(e); run("Register", () => c().registerProduct(d.get("name"), d.get("origin"), d.get("ipfs"))); }}>
        <input name="name" placeholder="Name" required />
        <input name="origin" placeholder="Origin" />
        <input name="ipfs" placeholder="IPFS hash (optional)" />
        <button disabled={busy}>Register</button>
      </form>

      <h3>Transfer custody</h3>
      <form onSubmit={(e) => { const d = f(e); run("Transfer", () => c().transferCustody(d.get("id"), d.get("to"))); }}>
        <input name="id" placeholder="Product ID" required />
        <input name="to" placeholder="Recipient address 0x…" required />
        <button disabled={busy}>Transfer</button>
      </form>

      <h3>Update status</h3>
      <form onSubmit={(e) => { const d = f(e); run("Status update", () => c().updateStatus(d.get("id"), d.get("status"), d.get("note") ?? "")); }}>
        <input name="id" placeholder="Product ID" required />
        <select name="status">{STATUSES.slice(0, 4).map((s, i) => <option key={s} value={i}>{s}</option>)}</select>
        <input name="note" placeholder="Note" />
        <button disabled={busy}>Update</button>
      </form>

      <h3>Recall (admin / manufacturer)</h3>
      <form onSubmit={(e) => { const d = f(e); run("Recall", () => c().recallProduct(d.get("id"), d.get("reason") ?? "")); }}>
        <input name="id" placeholder="Product ID" required />
        <input name="reason" placeholder="Reason" required />
        <button disabled={busy}>Recall</button>
      </form>

      {msg && <p className={msg.ok ? "ok" : "bad"}>{msg.text}</p>}
    </section>
  );
}
