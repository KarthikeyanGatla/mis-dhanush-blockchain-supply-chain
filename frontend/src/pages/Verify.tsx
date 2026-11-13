import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { readContract, STATUSES, errMsg } from "../contract";

interface Entry { from: string; to: string; status: number; timestamp: bigint; note: string }
interface Prod { name: string; origin: string; ipfsHash: string; manufacturer: string; currentOwner: string; status: number; createdAt: bigint }

export default function Verify() {
  const { id: paramId } = useParams();
  const nav = useNavigate();
  const [input, setInput] = useState(paramId ?? "");
  const [product, setProduct] = useState<Prod | null>(null);
  const [history, setHistory] = useState<Entry[]>([]);
  const [authentic, setAuthentic] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paramId) return;
    (async () => {
      setError(null); setProduct(null); setHistory([]);
      try {
        const c = readContract();
        const ok: boolean = await c.isAuthentic(paramId);
        setAuthentic(ok);
        const p = await c.getProduct(paramId);
        setProduct({ name: p.name, origin: p.origin, ipfsHash: p.ipfsHash, manufacturer: p.manufacturer, currentOwner: p.currentOwner, status: Number(p.status), createdAt: p.createdAt });
        const h = await c.getHistory(paramId);
        setHistory(h.map((e: any) => ({ from: e.from, to: e.to, status: Number(e.status), timestamp: e.timestamp, note: e.note })));
      } catch (e) {
        setAuthentic(false);
        setError("Product not found on-chain — possible counterfeit. " + errMsg(e));
      }
    })();
  }, [paramId]);

  const url = `${window.location.origin}/verify/${paramId}`;
  return (
    <section>
      <h2>Verify a product</h2>
      <form onSubmit={(e) => { e.preventDefault(); input && nav(`/verify/${input}`); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Product ID" />
        <button>Verify</button>
      </form>
      {error && <p className="bad">{error}</p>}
      {product && (
        <>
          <p className={authentic ? "ok" : "bad"}>{authentic ? "✔ Authentic" : "⚠ RECALLED"}</p>
          <dl>
            <dt>Name</dt><dd>{product.name}</dd>
            <dt>Origin</dt><dd>{product.origin}</dd>
            <dt>Status</dt><dd>{STATUSES[product.status]}</dd>
            <dt>Manufacturer</dt><dd className="mono">{product.manufacturer}</dd>
            <dt>Current owner</dt><dd className="mono">{product.currentOwner}</dd>
            {product.ipfsHash && <><dt>Docs</dt><dd><a href={`https://gateway.pinata.cloud/ipfs/${product.ipfsHash}`} target="_blank" rel="noreferrer">{product.ipfsHash}</a></dd></>}
          </dl>
          <QRCodeSVG value={url} size={128} />
          <h3>Provenance timeline</h3>
          <ol className="timeline">
            {history.map((h, i) => (
              <li key={i}>
                <strong>{STATUSES[h.status]}</strong> — {new Date(Number(h.timestamp) * 1000).toLocaleString()}
                <div className="mono">{h.from === "0x0000000000000000000000000000000000000000" ? "origin" : h.from} → {h.to}</div>
                {h.note && <em>{h.note}</em>}
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
