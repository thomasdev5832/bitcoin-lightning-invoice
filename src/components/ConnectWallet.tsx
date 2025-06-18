import { useState } from "react";
import { FiZap, FiLoader, FiClipboard, FiInfo } from "react-icons/fi";

export default function ConnectWallet({ connectWallet }: { connectWallet: (uri: string) => void }) {
    const [connectionUri, setConnectionUri] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const isValidUri = connectionUri.startsWith("nostr+walletconnect://");

    const handleConnect = async () => {
        if (!isValidUri) return;
        setIsLoading(true);
        try {
            await connectWallet(connectionUri);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaste = async () => {
        const text = await navigator.clipboard.readText();
        setConnectionUri(text);
    };

    const handleDemoConnect = () => {
        const demoUri = "nostr+walletconnect://demo-app-key@relay.nostr.example.com?secret=xyz";
        setConnectionUri(demoUri);
        connectWallet(demoUri);
    };

    return (
        <div className="rounded-lg shadow-sm w-full sm:w-xl flex flex-col items-center justify-center">
            <div className="space-y-10 w-full sm:w-md">
                {/* Header */}
                <div className="flex flex-col items-center justify-center">
                    <div className="flex flex-row items-center gap-2">
                        <FiZap className="text-orange-500 sm:text-3xl" />
                        <h1 className="text-xl sm:text-4xl font-bold text-orange-500">
                            Lightning Invoice
                        </h1>
                    </div>
                    <p className="text-gray-400 text-md text-center">
                        Accept fast and secure Bitcoin payments via Lightning
                    </p>
                </div>

                {/* Connection Section */}
                <div className="space-y-4 p-4 w-full border border-zinc-800 rounded-md">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-300 text-center flex flex-row items-center justify-center gap-2">
                        <FiInfo className="text-orange-400" /> Connect Lightning Wallet
                    </h2>
                    <p className="text-sm text-gray-500 text-center">
                        Paste your wallet link below (NWC URI). You can generate it using Alby.
                    </p>
                    <input
                        type="text"
                        placeholder="Paste your wallet link here (starts with nostr+walletconnect://)"
                        value={connectionUri}
                        onChange={(e) => setConnectionUri(e.target.value)}
                        className="w-full p-2 sm:p-3 border text-gray-400 border-gray-700 rounded-md bg-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <div className="flex justify-between text-sm text-gray-400">
                        <button onClick={handlePaste} className="hover:text-orange-400 flex items-center gap-1">
                            <FiClipboard /> Paste from clipboard
                        </button>
                        <a
                            href="https://nwc.getalby.com/apps"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-orange-400 underline"
                        >
                            How to generate in Alby?
                        </a>
                    </div>

                    {/* Connect Button */}
                    <button
                        onClick={handleConnect}
                        disabled={!isValidUri || isLoading}
                        className={`cursor-pointer w-full py-2 sm:py-3 rounded-md uppercase transition font-semibold flex items-center justify-center text-sm sm:text-base ${!isValidUri || isLoading
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-orange-500 text-zinc-950 hover:bg-orange-600"
                            }`}
                    >
                        {isLoading ? <FiLoader className="animate-spin" /> : <><FiZap className="mr-2" /> Connect Wallet</>}
                    </button>

                    {/* Optional Demo Mode */}
                    <button
                        onClick={handleDemoConnect}
                        className="text-sm text-gray-500 hover:text-orange-500 underline w-full text-center mt-2"
                    >
                        🎯 Try without a wallet (demo mode)
                    </button>
                </div>
            </div>
        </div>
    );
}
