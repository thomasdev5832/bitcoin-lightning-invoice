// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./contexts/ContextWallet";
import Wallet from "./pages/Wallet";
import ConnectPage from "./pages/ConnectPage";
import LandingPage from "./pages/LandingPage";

const App = () => {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connect" element={<ConnectPage />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
};

export default App;