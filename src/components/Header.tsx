import { FiZap, FiLoader, FiRefreshCw, FiSettings } from "react-icons/fi";

function Header({ nwc, isLoading, checkBalance }) {
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
                                onClick={() => console.log("Settings clicked")}
                                className="cursor-pointer p-2 sm:p-3 bg-zinc-950 rounded-full hover:bg-zinc-900 transition flex items-center justify-center"
                            >
                                <FiSettings className="text-gray-400 text-sm sm:text-base" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;