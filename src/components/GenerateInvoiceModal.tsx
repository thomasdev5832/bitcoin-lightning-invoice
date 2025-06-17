import { useEffect, useState, useRef } from "react";
import {
    FiLoader,
    FiZap,
    FiCopy,
    FiShare2,
    FiSun,
    FiMoon,
    FiX,
    FiRefreshCw,
} from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";

interface GenerateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateInvoice: {
        amount: (value: number) => void;
        description: (value: string) => void;
        create: () => void;
    };
    isLoading: boolean;
    invoice: string | null;
    invoiceAmount: number;
    invoiceDescription: string;
}

const GenerateInvoiceModal = ({
    isOpen,
    onClose,
    onCreateInvoice,
    isLoading,
    invoice,
    invoiceAmount,
    invoiceDescription,
}: GenerateInvoiceModalProps) => {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [inputMode, setInputMode] = useState<"usd" | "sats">("usd");
    const [usdAmount, setUsdAmount] = useState("");
    const [satsAmount, setSatsAmount] = useState("");
    const [satsPerUsd, setSatsPerUsd] = useState(2800); // Default rate
    const [clickedKeys, setClickedKeys] = useState<string[]>([]);
    const prevIsOpenRef = useRef<boolean>(false);

    // Fetch Bitcoin USD price for sats conversion
    useEffect(() => {
        async function fetchRate() {
            try {
                const res = await fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
                );
                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                const data = await res.json();
                if (data.bitcoin?.usd) {
                    const rate = 100_000_000 / data.bitcoin.usd;
                    setSatsPerUsd(rate);
                    console.log(`Updated sats per USD: ${rate}`);
                }
            } catch (e) {
                console.error("Failed to fetch BTC price, using default rate", e);
            }
        }
        fetchRate();
    }, []);

    // Sync usdAmount and satsAmount based on inputMode
    useEffect(() => {
        console.log(`Syncing: inputMode=${inputMode}, usdAmount=${usdAmount}, satsAmount=${satsAmount}`);
        if (inputMode === "usd") {
            const parsed = parseFloat(usdAmount);
            if (!isNaN(parsed) && parsed >= 0) {
                const sats = Math.round(parsed * satsPerUsd);
                setSatsAmount(sats.toString());
                onCreateInvoice.amount(sats);
            } else {
                setSatsAmount("0");
                onCreateInvoice.amount(0);
            }
        } else {
            const parsed = parseInt(satsAmount, 10);
            if (!isNaN(parsed) && parsed >= 0) {
                setUsdAmount((parsed / satsPerUsd).toFixed(2));
                onCreateInvoice.amount(parsed);
            } else {
                setUsdAmount("0.00");
                onCreateInvoice.amount(0);
            }
        }
    }, [usdAmount, satsAmount, satsPerUsd, inputMode, onCreateInvoice]);

    // Reset fields when modal opens
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            setInputMode("usd");
            setUsdAmount("");
            setSatsAmount("");
            onCreateInvoice.description("");
            setClickedKeys([]);
            console.log("Modal opened, reset fields");
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, onCreateInvoice]);

    // Handle keypad input
    const handleKeyPress = (key: string, event?: React.MouseEvent<HTMLButtonElement>) => {
        console.log(`Key pressed: ${key}, inputMode=${inputMode}, usdAmount=${usdAmount}, satsAmount=${satsAmount}`);

        // Add temporary orange border for 100ms
        setClickedKeys((prev) => [...prev, key]);
        setTimeout(() => {
            setClickedKeys((prev) => prev.filter((k) => k !== key));
        }, 100);

        // Remove focus after click
        if (event && event.currentTarget) {
            event.currentTarget.blur();
        }

        if (inputMode === "usd") {
            if (key === "←") {
                setUsdAmount((prev) => prev.slice(0, -1));
            } else if (key === ".") {
                if (usdAmount.includes(".")) {
                    console.log("Decimal point already exists");
                    return;
                }
                setUsdAmount((prev) => (prev === "" ? "0." : prev + "."));
            } else if (/^\d$/.test(key)) {
                const [wholePart, fractionalPart = ""] = usdAmount.split(".");
                if (wholePart.length >= 10 && !usdAmount.includes(".")) {
                    console.log("Max 10 whole digits reached");
                    return;
                }
                if (fractionalPart.length >= 2) {
                    console.log("Max 2 fractional digits reached");
                    return;
                }
                setUsdAmount((prev) => prev + key);
            }
        } else {
            if (key === "←") {
                setSatsAmount((prev) => prev.slice(0, -1));
            } else if (key === ".") {
                console.log("Decimal point disabled in sats mode");
                return;
            } else if (/^\d$/.test(key)) {
                if (satsAmount.length >= 12) {
                    console.log("Max 12 digits reached for sats");
                    return;
                }
                setSatsAmount((prev) => prev + key);
            }
        }
    };

    const toggleTheme = () => setIsDarkMode((prev) => !prev);
    const toggleInputMode = () => {
        setInputMode((prev) => (prev === "usd" ? "sats" : "usd"));
        setUsdAmount("");
        setSatsAmount("");
        console.log(`Toggled to ${inputMode === "usd" ? "sats" : "usd"} mode`);
    };
    const keypadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "←"];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className={`absolute top-4 left-4 p-2 rounded-full transition ${isDarkMode ? "bg-zinc-800 text-gray-300 hover:bg-zinc-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
                {isDarkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>

            {/* Close Button */}
            <button
                onClick={onClose}
                className={`absolute top-4 right-4 p-2 rounded-full transition ${isDarkMode ? "bg-zinc-800 text-gray-300 hover:bg-zinc-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                aria-label="Close modal"
            >
                <FiX className="h-6 w-6" />
            </button>

            {invoice ? (
                <div
                    className={`p-6 rounded-lg shadow-lg border animate-slide-up flex flex-col ${isDarkMode
                        ? "bg-zinc-950 text-gray-300 border-zinc-700"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <FiZap className={`${isDarkMode ? "text-orange-500" : "text-orange-600"} text-2xl`} />
                        <h2 className="text-lg font-bold">Lightning Invoice</h2>
                    </div>

                    <div className="flex flex-col items-center self-center justify-center my-4 p-2 bg-white w-fit rounded-md">
                        <QRCodeSVG
                            value={invoice}
                            size={220}
                            level="M"
                            bgColor={isDarkMode ? "#18181b" : "#f3f4f6"}
                            fgColor={isDarkMode ? "#ffffff" : "#000000"}
                            title={`Invoice for ${invoiceAmount} sats`}
                        />
                    </div>

                    <div className="text-sm space-y-2">
                        <p>
                            <strong>Amount:</strong> {invoiceAmount.toLocaleString()} sats
                        </p>
                        <p>
                            <strong>Description:</strong> {invoiceDescription || "None"}
                        </p>
                        <p className="break-all text-[10px] text-gray-400">
                            <strong>Invoice:</strong> {invoice}
                        </p>
                    </div>

                    <div className="mt-6 flex space-x-2">
                        <button
                            onClick={() =>
                                navigator.clipboard.writeText(invoice).then(() => alert("Invoice copied!"))
                            }
                            className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 transition ${isDarkMode
                                ? "bg-zinc-800 text-white hover:bg-zinc-700 active:bg-zinc-600"
                                : "bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400"
                                } active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-500`}
                        >
                            <FiCopy className="h-5 w-5" /> Copy
                        </button>
                        <button
                            onClick={() =>
                                navigator.share
                                    ? navigator.share({ title: "Lightning Invoice", text: invoice })
                                    : alert("Sharing not supported")
                            }
                            className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 transition ${isDarkMode
                                ? "bg-zinc-800 text-white hover:bg-zinc-700 active:bg-zinc-600"
                                : "bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400"
                                } active:scale-95 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-500`}
                        >
                            <FiShare2 className="h-5 w-5" /> Share
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className={`p-6 rounded-lg shadow-lg w-full max-w-md border animate-slide-up ${isDarkMode
                        ? "bg-zinc-950 text-gray-300 border-zinc-700"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                >
                    <h2
                        className={`text-2xl font-bold text-center my-4 uppercase ${isDarkMode ? "text-orange-500" : "text-orange-600"
                            }`}
                    >
                        Enter Amount
                    </h2>

                    <div className="text-center mb-4 items-center justify-center flex flex-col">
                        <p className="text-4xl font-mono">
                            {inputMode === "usd"
                                ? `$${usdAmount || "0.00"}`
                                : `${satsAmount || "0"} sats`}
                        </p>
                        <div className="flex flex-row items-center justify-around gap-2">
                            <button
                                onClick={toggleInputMode}
                                className={`p-2 rounded-full text-xs font-semibold cursor-pointer transition ${isDarkMode
                                    ? " text-orange-500 hover:text-orange-600 hover:bg-zinc-900"
                                    : " text-orange-500 hover:text-orange-600 hover:bg-zinc-200"
                                    }`}
                                aria-label={`Switch to ${inputMode === "usd" ? "sats" : "USD"} mode`}
                            >
                                <FiRefreshCw className="w-4 h-4" />
                            </button>
                            <p className={`text-2xl font-medium transition ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                                ≈ {inputMode === "usd" ? `${satsAmount} sats` : `$${usdAmount}`}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-6">
                        {keypadKeys.map((key) => (
                            <button
                                key={key}
                                onClick={(e) => handleKeyPress(key, e)}
                                className={`text-xl py-3 font-bold rounded-lg transition transform ${isDarkMode
                                    ? `bg-zinc-800 text-gray-200 hover:bg-zinc-700 hover:scale-105 active:bg-zinc-600 active:scale-95 active:shadow-inner ${clickedKeys.includes(key) ? "ring-2 ring-orange-500" : ""
                                    }`
                                    : `bg-white text-gray-900 hover:bg-gray-100 hover:scale-105 active:bg-gray-200 active:scale-95 active:shadow-inner ${clickedKeys.includes(key) ? "ring-2 ring-orange-500" : ""
                                    }`
                                    } focus:outline-none focus:ring-2 focus:ring-orange-500 ${key === "." && inputMode === "sats" ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                aria-label={`Key ${key}`}
                                disabled={key === "." && inputMode === "sats"}
                            >
                                {key}
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="invoice-description"
                            className="block text-sm font-semibold mb-1"
                        >
                            Description (optional)
                        </label>
                        <input
                            id="invoice-description"
                            type="text"
                            placeholder="e.g., Coca-Cola"
                            onChange={(e) => onCreateInvoice.description(e.target.value)}
                            className={`w-full p-2 rounded-lg border transition ${isDarkMode
                                ? "bg-zinc-900 text-gray-200 border-zinc-600 focus:ring-orange-500"
                                : "bg-white text-gray-900 border-gray-300 focus:ring-orange-600"
                                } focus:outline-none focus:ring-2`}
                        />
                    </div>

                    <button
                        onClick={onCreateInvoice.create}
                        disabled={(inputMode === "usd" ? parseFloat(usdAmount) : parseInt(satsAmount)) <= 0 || isLoading}
                        className={`w-full py-3 rounded-lg font-bold text-lg transition ${isDarkMode
                            ? "bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-400 active:bg-orange-700 active:scale-95"
                            : "bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-400 active:bg-orange-800 active:scale-95"
                            } disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500`}
                        aria-disabled={(inputMode === "usd" ? parseFloat(usdAmount) : parseInt(satsAmount)) <= 0 || isLoading}
                    >
                        {isLoading ? (
                            <FiLoader className="animate-spin h-6 w-6 mx-auto" />
                        ) : (
                            "Create Invoice"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default GenerateInvoiceModal;