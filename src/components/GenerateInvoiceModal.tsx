import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { FiLoader, FiZap, FiCopy, FiShare2, FiSun, FiMoon } from "react-icons/fi";

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

const GenerateInvoiceModal = ({ isOpen, onClose, onCreateInvoice, isLoading, invoice, invoiceAmount, invoiceDescription }: GenerateInvoiceModalProps) => {
    const [isDarkMode, setIsDarkMode] = useState(true); // Estado para controlar o tema

    if (!isOpen) return null;

    // Função para alternar entre dark e light mode
    const toggleTheme = () => {
        setIsDarkMode((prev) => !prev);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
            {/* Botão de alternância de tema (lado esquerdo) */}
            <button
                onClick={toggleTheme}
                className="absolute top-4 left-4 p-2 bg-zinc-800 text-gray-300 rounded-full hover:bg-zinc-700 transition cursor-pointer z-50"
            >
                {isDarkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>

            {/* Botão de fechar (lado direito) */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-zinc-800 text-gray-300 rounded-full hover:bg-zinc-700 transition cursor-pointer z-50"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {invoice ? (
                <div className={`${isDarkMode ? "bg-zinc-950 text-gray-300" : "bg-white text-gray-900"} p-4 py-8 sm:p-8 rounded-sm shadow-lg max-w-xs w-full mx-2 sm:mx-4 border ${isDarkMode ? "border-zinc-800" : "border-gray-200"} relative`}>
                    <div className="flex items-center justify-center gap-2">
                        <FiZap className="text-orange-500 text-xl sm:text-2xl" />
                        <h2 className="text-lg font-bold text-center">Bitcoin Lightning Invoice</h2>
                    </div>
                    <div className="flex justify-center m-3 sm:m-4 relative">
                        {/* QR Code */}
                        <QRCodeSVG
                            value={invoice}
                            size={250}
                            level="M"
                            bgColor={isDarkMode ? "#18181b" : "#ffffff"}
                            fgColor={isDarkMode ? "#ffffff" : "#000000"}
                            marginSize={4}
                            title={`Invoice for ${invoiceAmount} satoshis`}
                        />
                    </div>
                    <div className="space-y-2 text-sm">
                        <p><strong>Amount:</strong> {invoiceAmount} sats</p>
                        <p><strong>Description:</strong> {invoiceDescription}</p>
                        <p className="break-all text-[10px]"><strong>Invoice:</strong> {invoice}</p>
                    </div>
                    <div className="mt-4 sm:mt-6 flex space-x-2 sm:space-x-4">
                        <button
                            onClick={() => navigator.clipboard.writeText(invoice).then(() => alert("Invoice copied!")).catch(() => alert("Failed to copy"))}
                            className={`cursor-pointer flex-1 ${isDarkMode ? "bg-zinc-800 hover:bg-zinc-700" : "bg-gray-500 hover:bg-gray-600"} text-white py-2 sm:py-3 rounded-md transition font-semibold flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm`}
                        >
                            <FiCopy className="text-sm sm:text-lg" /> <span>Copy Invoice</span>
                        </button>
                        <button
                            onClick={() => navigator.share ? navigator.share({ title: "Lightning Invoice", text: `Invoice for ${invoiceAmount} satoshis: ${invoice}` }).catch(() => alert("Sharing failed")) : alert("Sharing not supported")}
                            className={`cursor-pointer flex-1 ${isDarkMode ? "bg-zinc-800 hover:bg-zinc-700" : "bg-gray-500 hover:bg-gray-600"} text-white py-2 sm:py-3 rounded-md transition font-semibold flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm`}
                        >
                            <FiShare2 className="text-sm sm:text-lg" /> <span>Share Invoice</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className={`${isDarkMode ? "bg-zinc-950 text-gray-300" : "bg-white text-gray-900"} p-4 sm:p-6 rounded-md shadow-lg max-w-xs sm:max-w-md w-full mx-2 sm:mx-4 border ${isDarkMode ? "border-zinc-800" : "border-gray-200"} relative`}>
                    <div className="flex flex-row items-center justify-center gap-2 my-2 mb-4">
                        <FiZap className="text-orange-500" />
                        <h2 className="text-xl sm:text-2xl font-bold text-orange-500 text-center">Generate Invoice</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="invoiceAmount" className="block text-gray-400 font-medium text-left text-sm mb-1">Amount (sats)</label>
                            <input
                                id="invoiceAmount"
                                type="number"
                                min="1"
                                required
                                onChange={(e) => onCreateInvoice.amount(Number(e.target.value))}
                                className={`w-full p-2 border ${isDarkMode ? "border-zinc-700 bg-zinc-950 text-gray-300" : "border-gray-300 bg-white text-gray-900"} rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500`}
                                placeholder="Enter amount"
                            />
                        </div>
                        <div>
                            <label htmlFor="invoiceDescription" className="block text-gray-400 font-medium text-left text-sm mb-1">Description</label>
                            <input
                                id="invoiceDescription"
                                type="text"
                                onChange={(e) => onCreateInvoice.description(e.target.value)}
                                className={`w-full p-2 border ${isDarkMode ? "border-zinc-700 bg-zinc-950 text-gray-300" : "border-gray-300 bg-white text-gray-900"} rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500`}
                                placeholder="Enter description"
                            />
                        </div>
                        <button
                            onClick={onCreateInvoice.create}
                            disabled={isLoading || invoiceAmount <= 0}
                            className="w-full bg-orange-500 text-zinc-950 py-2 rounded-md hover:bg-orange-600 transition font-semibold disabled:bg-zinc-800 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <FiLoader className="animate-spin mx-auto" /> : "Create Invoice"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GenerateInvoiceModal;