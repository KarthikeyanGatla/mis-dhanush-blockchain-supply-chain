import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { CONTRACT_ADDRESS, STAGES, STATUSES, ZERO, errMsg, parseDetails, readContract, short, writeContract } from "../contract";
import { Notice, StatusChip } from "../components";
import { useWallet } from "../wallet";

interface Step { kind: string; from: string; to: string; status: number; ts: number; note: string; block: number; tx: string }

export default function Product() {
  const { id } = useParams();
  const { signer, address, roles, accounts, labelFor, switchTo } = useWallet();
  const [p, setP] = useState<any>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setMissing(false);
    try {
      const c = readContract();
      const prod = await c.getProduct(id);
      const hist = await c.getHistory(id);
      const evs = (await Promise.all([
        c.queryFilter(c.filters.ProductRegistered(id)),
        c.queryFilter(c.filters.CustodyTransferred(id)),
        c.queryFilter(c.filters.StatusUpdated(id)),
        c.queryFilter(c.filters.ProductRecalled(id)),
      ])).flat().sort((a: any, b: any) => a.blockNumber - b.blockNumber || a.index - b.index);
      const kinds: Record<string, string> = { ProductRegistered: "Registered", CustodyTransferred: "Custody transferred", StatusUpdated: "Status update", ProductRecalled: "RECALLED" };
      setP(prod);
      setSteps(hist.map((h: any, i: number) => ({
        kind: kinds[(evs[i] as any)?.fragment?.name] ?? "Event", from: h.from, to: h.to, status: Number(h.status),
        ts: Number(h.timestamp), note: h.note, block: (evs[i] as any)?.blockNumber ?? 0, tx: (evs[i] as any)?.transactionHash ?? "",
      })));
    } catch { setP(null); setMissing(true); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!p || !accounts.length) return;
    const ownerIdx = accounts.findIndex((a) => a.toLowerCase() === p.currentOwner.toLowerCase());
    setTo(accounts[ownerIdx >= 1 && ownerIdx <= 3 ? ownerIdx + 1 : 2] ?? "");
  }, [p, accounts]);

  async function act(label: string, fn: (c: any) => Promise<any>) {
    if (!signer) return;
    setBusy(true); setMsg(null);
    try { const tx = await fn(writeContract(signer)); await tx.wait(); setMsg({ ok: true, text: `${label} recorded on-chain ✔` }); await load(); }
    catch (e) { setMsg({ ok: false, text: errMsg(e) }); }
    setBusy(false);
  }

  if (missing) return (
    <section className="narrow">
      <Notice ok={false}>⚠ Product #{id} does not exist on the blockchain. If you scanned this from a package, it may be <b>counterfeit</b>.</Notice>
      <Link to="/">← Back to dashboard</Link>
    </section>
  );
  if (!p) return <p>Loading from blockchain…</p>;

  const d = parseDetails(p.details);
  const status = Number(p.status);
  const recalled = status === 4;
  const hops = steps.filter((s) => s.kind === "Custody transferred").length;
  const isOwner = !!address && address.toLowerCase() === p.currentOwner.toLowerCase();
  const canRecall = !recalled && !!address && (roles.includes("Admin") || address.toLowerCase() === p.manufacturer.toLowerCase());

  return (
    <section>
      {recalled && <Notice ok={false}>🚨 <b>RECALLED</b> — do not sell or consume. Custody transfers are frozen.</Notice>}
      <div className="row head">
        <div>
          <h1>#{String(p.id)} · {p.name}</h1>
          <div className="muted">{d.category}{d.quantity ? ` · ${d.quantity}` : ""} · 📍 {p.origin}</div>
        </div>
        <StatusChip status={status} />
      </div>
      {d.description && <p>{d.description}</p>}

      <h2>Journey</h2>
      <ol className="stepper">
        {STAGES.map((s, i) => (
          <li key={s} className={recalled ? "recalled" : i < hops ? "done" : i === hops ? "current" : ""}>
            <span className="dot">{i < hops ? "✓" : i + 1}</span>{s}
          </li>
        ))}
      </ol>
      <div className="muted">Currently held by <b>{labelFor(p.currentOwner)}</b></div>

      <div className="cols">
        <div>
          <h2>Traceability timeline</h2>
          <ol className="timeline">
            {[...steps].reverse().map((s, i) => (
              <li key={i} className={s.kind === "RECALLED" ? "bad" : ""}>
                <div className="row"><strong>{s.kind}</strong><span className="muted small">{new Date(s.ts * 1000).toLocaleString()}</span></div>
                <div>{s.from === ZERO ? <>Created by <b>{labelFor(s.to)}</b></> : s.from === s.to ? <b>{labelFor(s.from)}</b> : <><b>{labelFor(s.from)}</b> → <b>{labelFor(s.to)}</b></>}</div>
                <div className="muted">Status: {STATUSES[s.status]}{s.note && s.note !== "Registered" && s.note !== "Custody transferred" ? ` — “${s.note}”` : ""}</div>
                <div className="proof mono">⛓ block #{s.block} · tx {s.tx && short(s.tx)}</div>
              </li>
            ))}
          </ol>
        </div>

        <aside>
          <div className="panel">
            <h3>Verify</h3>
            <div className={recalled ? "bad" : "ok"}>{recalled ? "⚠ Recalled" : "✔ Authentic — registered on-chain"}</div>
            <div className="qr"><QRCodeSVG value={`${window.location.origin}/product/${p.id}`} size={120} /></div>
            <div className="muted small">Scan to verify this product</div>
            <div className="mono small">Contract {short(CONTRACT_ADDRESS)}</div>
            {p.ipfsHash && <div className="small"><a target="_blank" rel="noreferrer" href={`https://gateway.pinata.cloud/ipfs/${p.ipfsHash}`}>📎 Documents (IPFS)</a></div>}
          </div>

          <div className="panel">
            <h3>Actions</h3>
            {recalled ? <div className="muted">No actions — product recalled.</div> : isOwner ? (
              <>
                <label>Hand over custody to
                  <select value={to} onChange={(e) => setTo(e.target.value)}>
                    {accounts.slice(0, 10).filter((a) => a.toLowerCase() !== address!.toLowerCase()).map((a) => <option key={a} value={a}>{labelFor(a)}</option>)}
                  </select>
                </label>
                <button className="btn" disabled={busy} onClick={() => act("Transfer", (c) => c.transferCustody(p.id, to))}>Transfer custody</button>
                <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); act("Status update", (c) => c.updateStatus(p.id, f.get("status"), f.get("note") ?? "")); }}>
                  <label>Update status
                    <select name="status" defaultValue={2}>{STATUSES.slice(0, 4).map((s, i) => <option key={s} value={i}>{s}</option>)}</select>
                  </label>
                  <input name="note" placeholder="Note (e.g. Left warehouse, temp 4°C)" />
                  <button className="btn alt" disabled={busy}>Record status</button>
                </form>
              </>
            ) : (
              <div className="muted">
                Only the current custodian can hand over this product.
                {accounts.some((a) => a.toLowerCase() === p.currentOwner.toLowerCase()) && (
                  <div><button className="ghost" onClick={() => switchTo(p.currentOwner)}>Switch to {labelFor(p.currentOwner)}</button></div>
                )}
              </div>
            )}
            {canRecall && (
              <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); act("Recall", (c) => c.recallProduct(p.id, f.get("reason"))); }}>
                <input name="reason" required placeholder="Recall reason" />
                <button className="btn danger" disabled={busy}>Recall product</button>
              </form>
            )}
            {msg && <Notice ok={msg.ok}>{msg.text}</Notice>}
          </div>
        </aside>
      </div>
    </section>
  );
}
