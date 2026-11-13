import { useState } from "react";
import { BrowserRouter, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { WalletProvider, useWallet } from "./wallet";
import { DEMO_ROLES, short } from "./contract";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Product from "./pages/Product";

function TrackBox() {
  const [v, setV] = useState("");
  const nav = useNavigate();
  return (
    <form className="track" onSubmit={(e) => { e.preventDefault(); if (v) { nav(`/product/${v}`); setV(""); } }}>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Track product ID…" inputMode="numeric" />
      <button>Track</button>
    </form>
  );
}

function Header() {
  const { accounts, demoIndex, setDemo, useMetaMask, mode, address, roles } = useWallet();
  return (
    <header>
      <div className="brand">⛓ ChainTrace</div>
      <nav>
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/register">Register product</NavLink>
      </nav>
      <TrackBox />
      <div className="acct">
        <label>Acting as</label>
        {mode === "demo" ? (
          <select value={demoIndex} onChange={(e) => setDemo(Number(e.target.value))}>
            {accounts.slice(0, 10).map((a, i) => (
              <option key={a} value={i}>{i < DEMO_ROLES.length ? DEMO_ROLES[i] : `Account #${i}`} · {short(a)}</option>
            ))}
          </select>
        ) : <span className="mono">{address && short(address)}</span>}
        <button className="ghost" onClick={useMetaMask}>{mode === "metamask" ? "MetaMask ✓" : "Use MetaMask"}</button>
        {roles.length > 0 && <small>Roles: {roles.join(", ")}</small>}
      </div>
    </header>
  );
}

function Banner() {
  const { error } = useWallet();
  return error ? <div className="notice bad banner">{error}</div> : null;
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Header />
        <Banner />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:id" element={<Product />} />
          </Routes>
        </main>
      </BrowserRouter>
    </WalletProvider>
  );
}
