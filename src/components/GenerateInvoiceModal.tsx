import {
    FiLoader,
    FiZap,
    FiCopy,
    FiShare2,
    FiSun,
    FiMoon,
} from "react-icons/fi";
import { useEffect, useState } from "react";
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
    const [usdAmount, setUsdAmount] = useState("");
    const [satsAmount, setSatsAmount] = useState(0);
    const [satsPerUsd, setSatsPerUsd] = useState(2800); // valor inicial

    // Buscar taxa atualizada do Bitcoin em USD para sats
    useEffect(() => {
        async function fetchRate() {
            try {
                const res = await fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
                );
                const data = await res.json();
                if (data.bitcoin?.usd) {
                    // 1 BTC = 100_000_000 sats, logo:
                    const rate = 100_000_000 / data.bitcoin.usd;
                    setSatsPerUsd(rate);
                }
            } catch (e) {
                console.error("Failed to fetch BTC price, using default rate", e);
            }
        }
        fetchRate();
    }, []);

    // Atualiza satsAmount sempre que usdAmount ou satsPerUsd mudar
    useEffect(() => {
        const parsed = parseFloat(usdAmount);
        if (!isNaN(parsed) && parsed >= 0) {
            const sats = Math.round(parsed * satsPerUsd);
            setSatsAmount(sats);
            onCreateInvoice.amount(sats);
        } else {
            setSatsAmount(0);
            onCreateInvoice.amount(0);
        }
    }, [usdAmount, satsPerUsd, onCreateInvoice]);

    useEffect(() => {
        if (isOpen) {
            // Quando o modal abrir, limpa os campos para um novo invoice
            setUsdAmount("");
            setSatsAmount(0);
            onCreateInvoice.description("");  // Se quiser limpar a descrição também
        }
    }, [isOpen]);

    // Validação do input: só permite dígitos e um ponto decimal
    const handleKeyPress = (key: string) => {
        if (key === "←") {
            setUsdAmount((prev) => prev.slice(0, -1));
        } else if (key === ".") {
            if (usdAmount.includes(".")) return; // evita múltiplos pontos
            if (usdAmount === "") {
                // evita começar com ponto, adiciona "0."
                setUsdAmount("0.");
                return;
            }
            setUsdAmount((prev) => prev + ".");
        } else if (/^\d$/.test(key)) {
            setUsdAmount((prev) => prev + key);
        }
        // ignora qualquer outra tecla
    };

    const toggleTheme = () => setIsDarkMode((prev) => !prev);
    const keypadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "←"];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className="absolute top-4 left-4 p-2 bg-zinc-800 text-gray-300 rounded-full hover:bg-zinc-700 transition z-50"
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
                {isDarkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-zinc-800 text-gray-300 rounded-full hover:bg-zinc-700 transition z-50"
                aria-label="Close modal"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {invoice ? (
                <div
                    className={`${isDarkMode ? "bg-zinc-950 text-gray-300" : "bg-white text-gray-900"
                        } p-6 rounded-md shadow-lg max-w-xs w-full border ${isDarkMode ? "border-zinc-800" : "border-gray-200"
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <FiZap className="text-orange-500 text-2xl" />
                        <h2 className="text-lg font-bold">Lightning Invoice</h2>
                    </div>

                    <div className="flex justify-center my-4">
                        <QRCodeSVG
                            value={invoice}
                            size={250}
                            level="M"
                            bgColor={isDarkMode ? "#18181b" : "#ffffff"}
                            fgColor={isDarkMode ? "#ffffff" : "#000000"}
                            title={`Invoice for ${invoiceAmount} sats`}
                        />
                    </div>

                    <div className="text-sm space-y-1">
                        <p>
                            <strong>Amount:</strong> {invoiceAmount.toLocaleString()} sats
                        </p>
                        <p>
                            <strong>Description:</strong> {invoiceDescription}
                        </p>
                        <p className="break-all text-[10px]">
                            <strong>Invoice:</strong> {invoice}
                        </p>
                    </div>

                    <div className="mt-4 flex space-x-2">
                        <button
                            onClick={() =>
                                navigator.clipboard.writeText(invoice).then(() => alert("Invoice copied!"))
                            }
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-md flex items-center justify-center gap-2"
                        >
                            <FiCopy /> Copy
                        </button>
                        <button
                            onClick={() =>
                                navigator.share
                                    ? navigator.share({ title: "Lightning Invoice", text: invoice })
                                    : alert("Sharing not supported")
                            }
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-md flex items-center justify-center gap-2"
                        >
                            <FiShare2 /> Share
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className={`${isDarkMode ? "bg-zinc-950 text-gray-300" : "bg-white text-gray-900"
                        } p-6 rounded-md shadow-lg max-w-xs w-full border ${isDarkMode ? "border-zinc-800" : "border-gray-200"
                        }`}
                >
                    <h2 className="text-2xl font-bold text-center text-orange-500 mb-4">Enter Amount</h2>

                    <div className="text-center mb-2">
                        <p className="text-4xl font-mono">${usdAmount || "0.00"}</p>
                        <p className="text-sm text-gray-400">≈ {satsAmount.toLocaleString()} sats</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 my-6">
                        {keypadKeys.map((key) => (
                            <button
                                key={key}
                                onClick={() => handleKeyPress(key)}
                                className="text-2xl py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold"
                                aria-label={`Key ${key}`}
                            >
                                {key}
                            </button>
                        ))}
                    </div>

                    <div className="mb-4">
                        <label className="text-sm font-medium block mb-1" htmlFor="invoice-description">
                            Description (optional)
                        </label>
                        <input
                            id="invoice-description"
                            type="text"
                            placeholder="e.g., Coca-Cola"
                            onChange={(e) => onCreateInvoice.description(e.target.value)}
                            className="w-full p-2 rounded-md border border-zinc-700 bg-zinc-900 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <button
                        onClick={onCreateInvoice.create}
                        disabled={satsAmount <= 0 || isLoading}
                        className="w-full bg-orange-500 text-black py-3 rounded-md font-bold text-lg hover:bg-orange-600 disabled:opacity-50"
                        aria-disabled={satsAmount <= 0 || isLoading}
                    >
                        {isLoading ? <FiLoader className="animate-spin mx-auto" /> : "Create Invoice"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default GenerateInvoiceModal;
