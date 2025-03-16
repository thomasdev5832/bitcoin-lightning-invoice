import { useState } from "react";
import { FiLoader, FiZap, FiRefreshCw, FiSettings, FiAlertCircle, FiEye, FiEyeOff } from "react-icons/fi";
import { webln } from "@getalby/sdk";
import GenerateInvoiceModal from "../components/GenerateInvoiceModal";

const Wallet = () => {
    const [nwc, setNwc] = useState<webln.NostrWebLNProvider | null>(null);
    const [balanceMsat, setBalanceMsat] = useState<number | null>(null);
    const [previousBalanceMsat, setPreviousBalanceMsat] = useState<number | null>(null);
    const [invoice, setInvoice] = useState<string | null>(null);
    const [connectionUri, setConnectionUri] = useState<string>("");
    const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
    const [invoiceDescription, setInvoiceDescription] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isInvoicePaid, setIsInvoicePaid] = useState<boolean>(false);
    const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);

    const connectWallet = async () => {
        try {
            if (!connectionUri) {
                setError("Please enter a valid connection URI.");
                return;
            }
            setIsLoading(true);
            const nwcProvider = new webln.NostrWebLNProvider({ nostrWalletConnectUrl: connectionUri });
            await nwcProvider.enable();
            setNwc(nwcProvider);
            setError(null);
            await checkBalance(nwcProvider);
            setIsLoading(false);
        } catch (err) {
            setError("Failed to connect wallet: " + (err as Error).message);
            setIsLoading(false);
        }
    };

    const checkBalance = async (provider = nwc) => {
        if (!provider) {
            setError("Please connect a wallet first.");
            return;
        }
        try {
            setIsLoading(true);
            const balanceResponse = await provider.getBalance();
            const newBalance = balanceResponse.balance;
            if (invoice && previousBalanceMsat !== null && newBalance > previousBalanceMsat) {
                setIsInvoicePaid(true);
            }
            setPreviousBalanceMsat(balanceMsat);
            setBalanceMsat(newBalance);
            setError(null);
            setIsLoading(false);
        } catch (err) {
            setError("Error checking balance: " + (err as Error).message);
            setIsLoading(false);
        }
    };

    const createInvoice = async () => {
        if (!nwc) {
            setError("Please connect a wallet first.");
            return;
        }
        if (invoiceAmount <= 0) {
            setError("Invoice amount must be greater than 0.");
            return;
        }
        try {
            setIsLoading(true);
            const invoiceResponse = await nwc.makeInvoice({ amount: invoiceAmount, description: invoiceDescription });
            setInvoice(invoiceResponse.paymentRequest);
            setError(null);
            setIsLoading(false);
        } catch (err) {
            setError("Error creating invoice: " + (err as Error).message);
            setIsLoading(false);
        }
    };

    const toggleBalanceVisibility = () => {
        setIsBalanceHidden(!isBalanceHidden);
    };

    return (
        <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center gap-6 sm:gap-10 p-2">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center justify-center space-x-3">
                    <FiZap className="text-orange-500" />
                    <span className="text-orange-500">Lightning Invoice</span>
                </h1>
                <p className="text-gray-400 mt-2 text-sm sm:text-base text-center">Fast and Secure Bitcoin Payments</p>
            </div>

            <div className="rounded-lg shadow-sm border border-zinc-800 p-4 w-full sm:w-xl flex flex-col items-center justify-center">
                {!nwc ? (
                    <div className="space-y-4 p-2 w-full">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-400 text-center">Connect Nostr Wallet</h2>
                        <input
                            type="text"
                            placeholder="Enter connection URI (nostr+walletconnect://...)"
                            value={connectionUri}
                            onChange={(e) => setConnectionUri(e.target.value)}
                            className="w-full p-2 sm:p-3 border text-gray-400 border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                            onClick={connectWallet}
                            disabled={isLoading}
                            className="cursor-pointer w-full bg-orange-500 text-zinc-950 py-2 sm:py-3 rounded-md hover:bg-orange-600 uppercase transition font-semibold flex items-center justify-center text-sm sm:text-base"
                        >
                            {isLoading ? <FiLoader className="animate-spin" /> : "Connect"}
                        </button>
                    </div>
                ) : (
                    <div className="w-full">
                        <div className="text-center flex">
                            <div className="w-full mx-auto flex items-center justify-between px-2 sm:px-2">
                                <div className="flex items-left space-x-2">
                                    <div className="flex flex-row items-center justify-center gap-2">
                                        <div className="relative">
                                            <div className="h-2 w-2 bg-orange-400 rounded-full animate-pulse-with-trail"></div>
                                        </div>
                                        <p className="text-gray-400 font-bold text-[10px] sm:text-xs uppercase">Nostr Wallet Connected</p>
                                    </div>
                                </div>
                                <div className="flex items-right justify-end">
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
                        </div>
                        <div className="bg-zinc-950 relative space-y-2 my-10">
                            <div className="flex flex-row items-center justify-start my-4">
                                <label className="text-gray-400 font-medium text-left text-xs uppercase ml-2">Balance</label>
                                <button
                                    onClick={toggleBalanceVisibility}
                                    className="cursor-pointer p-2 text-gray-400 hover:text-orange-500 transition"
                                    title={isBalanceHidden ? "Show balance" : "Hide balance"}
                                >
                                    {isBalanceHidden ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <p className="text-gray-700 font-medium text-center">
                                    {isLoading ? (
                                        <span className="flex items-center justify-center my-6">
                                            <FiLoader className="text-orange-500 animate-spin text-2xl sm:text-2xl" />
                                        </span>
                                    ) : (
                                        <div>
                                            <span className="text-gray-300 font-bold text-4xl sm:text-5xl">
                                                {isBalanceHidden ? "•••••" : balanceMsat}
                                            </span>
                                            <span className="text-gray-400"> sats</span>
                                        </div>
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="cursor-pointer w-full bg-orange-500 text-zinc-950 py-2 sm:py-3 rounded-md hover:bg-orange-600 uppercase transition font-semibold text-sm sm:text-base"
                        >
                            Generate Invoice
                        </button>
                    </div>
                )}



                <GenerateInvoiceModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setInvoice(null); setInvoiceAmount(0); setInvoiceDescription(""); }}
                    onCreateInvoice={{
                        amount: setInvoiceAmount,
                        description: setInvoiceDescription,
                        create: createInvoice
                    }}
                    isLoading={isLoading}
                    invoice={invoice}
                    invoiceAmount={invoiceAmount}
                    invoiceDescription={invoiceDescription}
                />

                {isInvoicePaid && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
                        <div className="bg-white p-4 pt-10 sm:p-8 sm:pt-12 rounded-md shadow-lg max-w-xs sm:max-w-md w-full mx-2 sm:mx-4 border border-gray-200 relative">
                            <button
                                onClick={() => setIsInvoicePaid(false)}
                                className="absolute top-2 sm:top-4 right-2 sm:right-4 p-1 sm:p-2 text-gray-500 hover:text-gray-700 transition cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="flex items-center justify-center gap-2">
                                <FiZap className="text-green-500 text-xl sm:text-2xl" />
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">Payment Received!</h2>
                            </div>
                            <div className="mt-4 text-gray-700 text-sm sm:text-base text-center">
                                <p>Your invoice for {invoiceAmount} sats has been paid.</p>
                                <p>New balance: {balanceMsat} sats</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 sm:mt-6 p-2 sm:p-4 bg-red-50 border border-red-100 rounded-sm w-full max-w-full overflow-hidden text-red-600 flex items-center space-x-2 text-xs sm:text-sm">
                    <FiAlertCircle />
                    <span className="break-words">{error}</span>
                </div>
            )}
        </div>
    );
};

export default Wallet;