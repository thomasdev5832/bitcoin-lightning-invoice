// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./contexts/ContextWallet";
import Wallet from "./pages/Wallet";
import ConnectPage from "./pages/ConnectPage";
import LandingPage from "./pages/LandingPage";
import TransactionsPage from "./pages/TransactionsPage";

const App = () => {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connect" element={<ConnectPage />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
};

export default App;