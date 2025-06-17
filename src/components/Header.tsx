import { useState } from "react";
import { FiZap, FiLoader, FiRefreshCw, FiSettings, FiLogOut } from "react-icons/fi";
import { webln } from "@getalby/sdk";

function Header({ nwc, isLoading, checkBalance, setNwc, setConnectionUri, setBalanceMsat, setError }: {
    nwc: webln.NostrWebLNProvider | null;
    isLoading: boolean;
    checkBalance: () => void;
    setNwc: (value: webln.NostrWebLNProvider | null) => void;
    setConnectionUri: (value: string) => void;
    setBalanceMsat: (value: number | null) => void;
    setError: (value: string | null) => void;
}) {
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const disconnectWallet = () => {
        try {
            if (nwc && typeof nwc.close === "function") {
                nwc.close();
            }
        } catch (err) {
            console.error("Error closing wallet connection:", err);
        }
        setNwc(null);
        setBalanceMsat(null);
        setConnectionUri("");
        setError(null);
        sessionStorage.removeItem("nostrWalletConnectUri");
        console.log("Wallet disconnected and sessionStorage cleared");
        setIsSettingsModalOpen(false);
    };

    return (
        <header className="fixed top-0 left-0 w-full bg-zinc-950 shadow-md z-10">
            <div className="flex items-center justify-between px-4 py-2 sm:px-6 sm:py-4">
                <h1 className="text-xl font-black text-gray-900 flex flex-row items-center justify-start gap-1">
                    <FiZap className="text-orange-500" />
                    {/* <span className="text-orange-500">Lightning Invoice</span> */}
                </h1>
                {nwc && (
                    <div className="flex items-center justify-end gap-4">
                        <div className="flex items-center space-x-2">
                            <div className="flex flex-row items-center justify-center gap-2">
                                <div className="relative">
                                    <div className="h-2 w-2 bg-orange-400 rounded-full animate-pulse-with-trail"></div>
                                </div>
                                <p className="text-gray-400 font-bold text-[10px] sm:text-xs uppercase">Nostr Wallet Connected</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end">
                            <button
                                onClick={() => checkBalance()}
                                disabled={isLoading}
                                className="cursor-pointer p-2 sm:p-3 bg-zinc-950 rounded-full hover:bg-zinc-900 transition flex items-center justify-center"
                            >
                                {isLoading ? <FiLoader className="text-gray-400 animate-spin text-sm sm:text-base" /> : <FiRefreshCw className="text-gray-400 text-sm sm:text-base" />}
                            </button>
                            <button
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="cursor-pointer p-2 sm:p-3 bg-zinc-950 rounded-full hover:bg-zinc-900 transition flex items-center justify-center"
                            >
                                <FiSettings className="text-gray-400 text-sm sm:text-base" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                    <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-sm mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-200">Settings</h2>
                            <button
                                onClick={() => setIsSettingsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-200 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <button
                            onClick={disconnectWallet}
                            className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 uppercase transition font-semibold flex items-center justify-center gap-2"
                        >
                            <FiLogOut className="text-base" />
                            Disconnect Wallet
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;