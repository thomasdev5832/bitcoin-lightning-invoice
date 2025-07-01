import { useState } from "react";
import { FiLoader, FiClipboard } from "react-icons/fi";
import Logo from "./Logo";
import { LuPlugZap } from "react-icons/lu";

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
        <div className="w-full rounded-lg shadow-sm flex flex-col items-center justify-center">
            <div className="space-y-4 mb-4 w-full sm:w-md flex flex-col items-center justify-center">
                {/* Header */}
                <div className="flex flex-col items-center justify-center gap-2 pt-10 pb-10 px-10 bg-orange-500 rounded-lg w-fit">
                    <div className="flex flex-row items-center mr-4">
                        <Logo />
                    </div>
                </div>

                {/* Connection Section */}
                <div className="space-y-4 p-6 w-full flex flex-col items-center">
                    <div className="flex flex-row items-center justify-center gap-2">
                        <LuPlugZap className="text-orange-500 w-6 h-6" />
                        <h2 className="text-white text-lg font-semibold">Connect Lightning Wallet</h2>
                    </div>
                    <p className="text-xs text-zinc-400 font-semibold text-center">
                        Paste your wallet link(NWC URI) below.<br /> You can generate it using <strong>Alby</strong>.
                    </p>
                    <input
                        type="password"
                        placeholder="NWC URI (starts with nostr+walletconnect://)"
                        value={connectionUri}
                        onChange={(e) => setConnectionUri(e.target.value)}
                        className="w-full p-2 sm:p-3 border text-gray-400 border-2 border-zinc-700 rounded-md bg-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />

                    <div className="w-full flex justify-between text-xs font-semibold text-gray-400 px-2">
                        <a
                            href="https://nwc.getalby.com/apps"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-orange-500 underline"
                        >
                            How to generate in Alby?
                        </a>
                        <button onClick={handlePaste} className="hover:text-orange-500 flex items-center gap-1 cursor-pointer">
                            <FiClipboard /> Paste from clipboard
                        </button>
                    </div>

                    {/* Connect Button */}
                    <button
                        onClick={handleConnect}
                        disabled={!isValidUri || isLoading}
                        className={`cursor-pointer w-full py-4 rounded-md uppercase transition font-semibold flex items-center justify-center text-sm sm:text-base ${!isValidUri || isLoading
                            ? "bg-zinc-700 text-gray-400 cursor-not-allowed"
                            : "bg-orange-500 text-zinc-950 hover:bg-orange-600"
                            }`}
                    >
                        {isLoading
                            ?
                            <FiLoader className="animate-spin" />
                            :
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 80.76923076923077 116.82287105705548">
                                    <g transform="translate(-18.144373456698258, -0.27794033690228215) scale(1.1727437992501784)"
                                        fill="#fff">
                                        <path xmlns="http://www.w3.org/2000/svg"
                                            d="M84.228,4.966c-0.296-1.263-1.122-2.275-2.33-2.851l-2.64-1.257c-0.155-0.291-0.52-0.621-1.378-0.621  c-0.351,0-0.756,0.056-1.204,0.165L50.715,6.727c-2.497,0.609-5.491,2.96-6.675,5.242L24.903,48.86  c-0.569,1.096-0.642,2.097-0.205,2.815c0.476,0.783,1.518,1.136,2.856,0.954l3.169-0.426c1.15-0.153,2.051,0.13,2.455,0.771  c0.374,0.592,0.326,1.449-0.134,2.413l-17.013,35.97c-0.522,1.094-0.583,1.143-0.553,2.143H15.5v-0.543  c0,0.006-0.029,0.012-0.028,0.018l0.589,3.419c0.275,2.393,1.49,3.12,2.193,3.342c0.205,0.062,0.465,0.116,0.775,0.116  c0.763,0,1.804-0.321,2.933-1.606L65.73,48.434c1.145-1.302,1.639-2.887,1.355-4.351c-0.251-1.304-1.077-2.37-2.325-3.002  l-2.696-1.366c-0.189-0.384-0.669-0.824-1.884-0.824c-0.083,0-0.181,0.013-0.271,0.017L83.063,9.443  C84.146,8.065,84.57,6.434,84.228,4.966z M64.401,44.602c0.12,0.626-0.144,1.366-0.726,2.028L19.905,96.438  c-0.405,0.46-0.707,0.625-0.836,0.667c-0.083-0.108-0.238-0.415-0.308-1.024c0,0-0.606-3.586-0.552-4.913L61.14,42.312l2.384,1.208  C64.008,43.765,64.311,44.139,64.401,44.602z M80.912,7.754L56.106,39.323l-2.517,0.288c-1.12,0.128-1.918-0.099-2.168-0.612  c-0.236-0.488,0.005-1.248,0.661-2.084L78.368,3.464l2.354,1.121c0.453,0.216,0.737,0.555,0.844,1.005  C81.718,6.244,81.48,7.032,80.912,7.754z">
                                        </path>
                                    </g>
                                </svg>
                                <p className="text-white font-bold tracking-widest">Connect Wallet</p>
                            </>
                        }
                    </button>



                    {/* Optional Demo Mode */}
                    <button
                        onClick={handleDemoConnect}
                        className="text-sm font-semibold text-zinc-400 hover:text-orange-500 w-fit text-center mt-4 cursor-pointer py-1 rounded-md underline"
                    >
                        Try without a wallet (demo mode)
                    </button>
                </div>
            </div>
        </div>
    );
}
