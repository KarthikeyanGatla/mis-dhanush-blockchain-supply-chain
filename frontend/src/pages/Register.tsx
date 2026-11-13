import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { errMsg, writeContract } from "../contract";
import { uploadToIpfs } from "../ipfs";
import { Notice } from "../components";
import { useWallet } from "../wallet";

const CATEGORIES = ["Food & Beverage", "Pharmaceuticals", "Electronics", "Apparel", "Automotive", "Other"];

export default function Register() {
  const { signer, roles, labelFor, address } = useWallet();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ipfs, setIpfs] = useState("");
  const isManu = roles.includes("Manufacturer");

  async function onFile(f?: File) {
    if (!f) return;
    try { setIpfs(await uploadToIpfs(f)); } catch (e) { setErr(errMsg(e)); }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!signer) return;
    const d = new FormData(e.currentTarget);
    const details = JSON.stringify({
      category: d.get("category"),
      quantity: `${d.get("qty")} ${d.get("unit")}`,
      description: d.get("description"),
    });
    setBusy(true); setErr(null);
    try {
      const c = writeContract(signer);
      const tx = await c.registerProduct(d.get("name"), d.get("origin"), details, ipfs);
      const rc = await tx.wait();
      const ev = rc.logs.map((l: any) => { try { return c.interface.parseLog(l); } catch { return null; } }).find((x: any) => x?.name === "ProductRegistered");
      nav(`/product/${ev ? ev.args.id : ""}`);
    } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  }

  return (
    <section className="narrow">
      <h1>Register a new product batch</h1>
      <p className="muted">Creates an immutable record on the blockchain. You become the first custodian.</p>
      {!isManu && address && (
        <Notice ok={false}>
          You are acting as {labelFor(address)}, which is not a Manufacturer. Switch “Acting as” (top right) to <b>Manufacturer</b>.
        </Notice>
      )}
      <form className="form" onSubmit={submit}>
        <label>Product name<input name="name" required placeholder="e.g. Organic Coffee Beans" /></label>
        <div className="two">
          <label>Category
            <select name="category">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label>Origin / manufacturing location<input name="origin" required placeholder="e.g. Nyeri, Kenya" /></label>
        </div>
        <div className="two">
          <label>Quantity<input name="qty" type="number" min="1" required defaultValue="100" /></label>
          <label>Unit<select name="unit"><option>units</option><option>kg</option><option>litres</option><option>boxes</option></select></label>
        </div>
        <label>Description<textarea name="description" rows={3} placeholder="Batch no., certifications, notes…" /></label>
        <label>Documents (certificate, image) → IPFS
          <input type="file" onChange={(e) => onFile(e.target.files?.[0])} />
          <input value={ipfs} onChange={(e) => setIpfs(e.target.value)} placeholder="…or paste an IPFS hash (optional)" />
        </label>
        <button className="btn" disabled={busy || !signer}>{busy ? "Waiting for block…" : "Register on blockchain"}</button>
      </form>
      {err && <Notice ok={false}>{err}</Notice>}
    </section>
  );
}
