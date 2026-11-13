import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CONTRACT_ADDRESS, parseDetails, readContract, rpc } from "../contract";
import { StatusChip } from "../components";
import { useWallet } from "../wallet";

export default function Dashboard() {
  const { labelFor, accounts } = useWallet();
  const [items, setItems] = useState<any[]>([]);
  const [block, setBlock] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const c = readContract();
        const n = Number(await c.productCount());
        const list = [];
        for (let i = n; i >= 1; i--) list.push(await c.getProduct(i));
        setItems(list);
        setBlock(await rpc.getBlockNumber());
      } catch { /* chain offline: banner shows the error */ }
      setLoading(false);
    })();
  }, [accounts]);

  const recalled = items.filter((p) => Number(p.status) === 4).length;
  return (
    <section>
      <div className="hero">
        <h1>Transparent supply chain, verified on-chain</h1>
        <p>Every handoff from manufacturer to customer is recorded on the blockchain and cannot be altered.</p>
        <Link className="btn" to="/register">+ Register a product</Link>
      </div>
      <div className="stats">
        <div><b>{items.length}</b><span>Products tracked</span></div>
        <div><b>{recalled}</b><span>Recalled</span></div>
        <div><b>{block}</b><span>Latest block</span></div>
        <div><b className="mono">{CONTRACT_ADDRESS.slice(0, 8)}…</b><span>Smart contract</span></div>
      </div>
      <h2>Products</h2>
      {loading ? <p>Loading…</p> : items.length === 0 ? <p className="muted">No products yet. Register the first one.</p> : (
        <div className="grid">
          {items.map((p) => {
            const d = parseDetails(p.details);
            return (
              <Link key={String(p.id)} to={`/product/${p.id}`} className="card">
                <div className="row"><strong>#{String(p.id)} {p.name}</strong><StatusChip status={Number(p.status)} /></div>
                <div className="muted">{d.category || "Product"}{d.quantity ? ` · ${d.quantity}` : ""}</div>
                <div className="muted">📍 {p.origin}</div>
                <div className="muted small">Held by {labelFor(p.currentOwner)}</div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
