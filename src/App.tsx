// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./contexts/ContextWallet";
import Wallet from "./pages/Wallet";
import ConnectPage from "./pages/ConnectPage";

const App = () => {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ConnectPage />} />
          <Route path="/wallet" element={<Wallet />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
};

export default App;