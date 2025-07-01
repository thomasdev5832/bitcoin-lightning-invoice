import { useState } from "react";
import { FiLoader, FiRefreshCw, FiSettings, FiLogOut } from "react-icons/fi";
import { useWallet } from "../contexts/ContextWallet";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

function Header({ isLoading, checkBalance }: {
    isLoading: boolean;
    checkBalance: () => void;
}) {
    const { nwc, disconnectWallet } = useWallet();
    const navigate = useNavigate();
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const handleDisconnect = () => {
        disconnectWallet();
        setIsSettingsModalOpen(false);
        navigate("/");
    };

    return (
        <header className=" w-full bg-zinc-950 shadow-md z-10">
            <div className="flex items-start justify-between px-0 py-2 sm:px-6 sm:py-4">
                <div className="flex flex-row items-center bg-orange-500 p-1 px-2 rounded-sm">
                    <svg className="w-5 h-5" viewBox="0 0 80.76923076923077 116.82287105705548">
                        <g transform="translate(-18.144373456698258, -0.27794033690228215) scale(1.1727437992501784)"
                            fill="#fff">
                            <path xmlns="http://www.w3.org/2000/svg"
                                d="M84.228,4.966c-0.296-1.263-1.122-2.275-2.33-2.851l-2.64-1.257c-0.155-0.291-0.52-0.621-1.378-0.621  c-0.351,0-0.756,0.056-1.204,0.165L50.715,6.727c-2.497,0.609-5.491,2.96-6.675,5.242L24.903,48.86  c-0.569,1.096-0.642,2.097-0.205,2.815c0.476,0.783,1.518,1.136,2.856,0.954l3.169-0.426c1.15-0.153,2.051,0.13,2.455,0.771  c0.374,0.592,0.326,1.449-0.134,2.413l-17.013,35.97c-0.522,1.094-0.583,1.143-0.553,2.143H15.5v-0.543  c0,0.006-0.029,0.012-0.028,0.018l0.589,3.419c0.275,2.393,1.49,3.12,2.193,3.342c0.205,0.062,0.465,0.116,0.775,0.116  c0.763,0,1.804-0.321,2.933-1.606L65.73,48.434c1.145-1.302,1.639-2.887,1.355-4.351c-0.251-1.304-1.077-2.37-2.325-3.002  l-2.696-1.366c-0.189-0.384-0.669-0.824-1.884-0.824c-0.083,0-0.181,0.013-0.271,0.017L83.063,9.443  C84.146,8.065,84.57,6.434,84.228,4.966z M64.401,44.602c0.12,0.626-0.144,1.366-0.726,2.028L19.905,96.438  c-0.405,0.46-0.707,0.625-0.836,0.667c-0.083-0.108-0.238-0.415-0.308-1.024c0,0-0.606-3.586-0.552-4.913L61.14,42.312l2.384,1.208  C64.008,43.765,64.311,44.139,64.401,44.602z M80.912,7.754L56.106,39.323l-2.517,0.288c-1.12,0.128-1.918-0.099-2.168-0.612  c-0.236-0.488,0.005-1.248,0.661-2.084L78.368,3.464l2.354,1.121c0.453,0.216,0.737,0.555,0.844,1.005  C81.718,6.244,81.48,7.032,80.912,7.754z">
                            </path>
                        </g>
                    </svg>
                    <h3 className="text-white font-anton pr-1">NWCPay</h3>
                </div>
                {nwc && (
                    <div className="flex items-center justify-end gap-4">
                        <div className="flex items-center space-x-2">
                            <div className="flex flex-row items-center justify-center gap-2">
                                <div className="relative">
                                    <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse-with-trail"></div>
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
                    <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-sm mx-4 flex flex-col items-center space-y-4">
                        <div className="flex justify-between items-center mb-4 w-full">
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
                        <div className="flex flex-col items-center justify-center w-fit">
                            <div className="flex flex-row items-center mr-4">
                                <Logo />
                            </div>
                        </div>
                        <button
                            onClick={handleDisconnect}
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