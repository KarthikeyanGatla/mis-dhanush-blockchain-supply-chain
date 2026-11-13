import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { WalletProvider, useWallet } from "./wallet";
import Verify from "./pages/Verify";
import Manage from "./pages/Manage";

function Header() {
  const { address, connect, error } = useWallet();
  return (
    <header>
      <h1>Supply Chain Tracker</h1>
      <nav><Link to="/">Verify</Link> <Link to="/manage">Manage</Link></nav>
      <button onClick={connect}>{address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connect MetaMask"}</button>
      {error && <span className="bad"> {error}</span>}
    </header>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Verify />} />
            <Route path="/verify/:id" element={<Verify />} />
            <Route path="/manage" element={<Manage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </WalletProvider>
  );
}
