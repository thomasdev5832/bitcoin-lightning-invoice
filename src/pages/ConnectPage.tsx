// src/pages/ConnectPage.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../contexts/ContextWallet";
import ConnectWallet from "../components/ConnectWallet";

const ConnectPage = () => {
    const { nwc } = useWallet();
    const navigate = useNavigate();

    useEffect(() => {
        if (nwc) {
            navigate("/wallet", { replace: true });
        }
    }, [nwc, navigate]);

    return (
        <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center pt-[20%] sm:pt-[10%]">
            <div className="rounded-lg shadow-sm w-full sm:w-fit flex flex-col items-center justify-center px-2">
                <ConnectWallet connectWallet={useWallet().connectWallet} />
            </div>
        </div>
    );
};

export default ConnectPage;