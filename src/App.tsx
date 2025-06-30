import { BrowserRouter, Routes, Route } from "react-router-dom";
import Wallet from "./pages/Wallet";

const App = () => {
  return (
    <BrowserRouter>
      <div className="bg-zinc-950 flex flex-col items-center justify-center gap-6 sm:gap-10 p-4">
        <Routes>
          <Route path="/" element={<Wallet />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;