import { useState } from "react";
import { FiLoader, FiRefreshCw, FiLogOut } from "react-icons/fi";
import { useWallet } from "../contexts/ContextWallet";
import { useNavigate } from "react-router-dom";

function Header({ isLoading, checkBalance }: {
    isLoading: boolean;
    checkBalance: () => void;
}) {
    const { nwc, disconnectWallet } = useWallet();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleDisconnect = () => {
        disconnectWallet();
        setIsMenuOpen(false);
        navigate("/");
    };

    const handleNavigate = (path: string) => {
        setIsMenuOpen(false);
        navigate(path);
    };

    return (
        <header className="w-full bg-zinc-950 shadow-md z-10 relative">
            <div className="flex items-center justify-between p-2">
                <div className="flex flex-row items-center bg-orange-500 p-1 px-2 rounded-sm">
                    <svg className="w-5 h-5" viewBox="0 0 80.76923076923077 116.82287105705548">
                        <g transform="translate(-18.144373456698258, -0.27794033690228215) scale(1.1727437992501784)"
                            fill="#fff">
                            <path
                                d="M84.228,4.966c-0.296-1.263-1.122-2.275-2.33-2.851l-2.64-1.257c-0.155-0.291-0.52-0.621-1.378-0.621  c-0.351,0-0.756,0.056-1.204,0.165L50.715,6.727c-2.497,0.609-5.491,2.96-6.675,5.242L24.903,48.86  c-0.569,1.096-0.642,2.097-0.205,2.815c0.476,0.783,1.518,1.136,2.856,0.954l3.169-0.426c1.15-0.153,2.051,0.13,2.455,0.771  c0.374,0.592,0.326,1.449-0.134,2.413l-17.013,35.97c-0.522,1.094-0.583,1.143-0.553,2.143H15.5v-0.543  c0,0.006-0.029,0.012-0.028,0.018l0.589,3.419c0.275,2.393,1.49,3.12,2.193,3.342c0.205,0.062,0.465,0.116,0.775,0.116  c0.763,0,1.804-0.321,2.933-1.606L65.73,48.434c1.145-1.302,1.639-2.887,1.355-4.351c-0.251-1.304-1.077-2.37-2.325-3.002  l-2.696-1.366c-0.189-0.384-0.669-0.824-1.884-0.824c-0.083,0-0.181,0.013-0.271,0.017L83.063,9.443  C84.146,8.065,84.57,6.434,84.228,4.966z M64.401,44.602c0.12,0.626-0.144,1.366-0.726,2.028L19.905,96.438  c-0.405,0.46-0.707,0.625-0.836,0.667c-0.083-0.108-0.238-0.415-0.308-1.024c0,0-0.606-3.586-0.552-4.913L61.14,42.312l2.384,1.208  C64.008,43.765,64.311,44.139,64.401,44.602z M80.912,7.754L56.106,39.323l-2.517,0.288c-1.12,0.128-1.918-0.099-2.168-0.612  c-0.236-0.488,0.005-1.248,0.661-2.084L78.368,3.464l2.354,1.121c0.453,0.216,0.737,0.555,0.844,1.005  C81.718,6.244,81.48,7.032,80.912,7.754z"
                            />
                        </g>
                    </svg>
                    <h3 className="text-white font-anton pr-1">NWCPay</h3>
                </div>
                {nwc && (
                    <div className="flex items-center justify-end gap-2 sm:gap-4">
                        <div className="flex items-center space-x-2">
                            <div className="flex flex-row items-center justify-center gap-2">
                                <div className="relative">
                                    <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse-with-trail"></div>
                                </div>
                                <p className="text-gray-400 font-bold text-[10px] sm:text-xs uppercase">Nostr Wallet Connected</p>
                            </div>
                        </div>
                        <button
                            onClick={() => checkBalance()}
                            disabled={isLoading}
                            className="cursor-pointer p-2 sm:p-3 bg-zinc-950 rounded-md hover:bg-zinc-900 transition flex items-center justify-center"
                        >
                            {isLoading ? <FiLoader className="text-gray-400 animate-spin text-sm sm:text-base" /> : <FiRefreshCw className="text-gray-400 text-sm sm:text-base" />}
                        </button>

                        {/* Menu Toggle Button - seguindo o padrão do primeiro exemplo */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="relative z-60 w-8 h-8 flex items-center justify-center group focus:outline-none cursor-pointer"
                            aria-label="Toggle navigation menu"
                        >
                            <div className="relative w-5 h-4 flex flex-col justify-between items-center">
                                <span className={`w-full h-[2px] bg-gray-400 rounded-full transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-[9px]' : 'translate-y-0'}`} />
                                <span className={`w-full h-[2px] bg-gray-400 rounded-full transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
                                <span className={`w-full h-[2px] bg-gray-400 rounded-full transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-[5px]' : 'translate-y-0'}`} />
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* Overlay */}
            <div className={`fixed inset-0 bg-black transition-opacity duration-300 z-20 ${isMenuOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsMenuOpen(false)} />

            {/* Burger Menu */}
            <div className={`fixed top-0 bg-zinc-900 shadow-xl z-30 transform transition-all duration-300 ease-out ${isMenuOpen
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
                } w-full h-screen sm:w-3xs sm:h-auto sm:top-16 sm:right-0 sm:rounded-lg sm:p-2`}>
                <div className="px-4 pt-10 sm:p-2">
                    <div className="flex flex-col space-y-2">
                        <button
                            onClick={() => handleNavigate("/wallet")}
                            className="text-gray-200 py-3 px-4 hover:text-white hover:bg-zinc-800 transition-all duration-200 font-semibold text-left rounded-md"
                        >
                            Wallet
                        </button>
                        <button
                            onClick={() => handleNavigate("/transactions")}
                            className="text-gray-200 py-3 px-4 hover:text-white hover:bg-zinc-800 transition-all duration-200 font-semibold text-left rounded-md"
                        >
                            Transactions
                        </button>
                        <button
                            onClick={() => handleNavigate("/settings")}
                            className="text-gray-200 py-3 px-4 hover:text-white hover:bg-zinc-800 transition-all duration-200 font-semibold text-left rounded-md"
                        >
                            Settings
                        </button>
                        <div className="border-t border-zinc-700 my-2"></div>
                        <button
                            onClick={handleDisconnect}
                            className="bg-red-500 text-white py-3 px-4 rounded-md hover:bg-red-600 transition-all duration-200 font-semibold flex items-center justify-center gap-2 uppercase"
                        >
                            <FiLogOut className="text-base" />
                            Disconnect Wallet
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;