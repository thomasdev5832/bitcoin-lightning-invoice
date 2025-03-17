import { useState } from "react";
import { FiLoader, FiAlertCircle, FiEye, FiEyeOff, FiZap } from "react-icons/fi";
import { webln } from "@getalby/sdk";
import GenerateInvoiceModal from "../components/GenerateInvoiceModal";
import Transactions from "../components/Transactions";
import Header from "../components/Header";

const Wallet = () => {
    const [nwc, setNwc] = useState<webln.NostrWebLNProvider | null>(null);
    const [balanceMsat, setBalanceMsat] = useState<number | null>(null);
    const [invoice, setInvoice] = useState<string | null>(null);
    const [connectionUri, setConnectionUri] = useState<string>("");
    const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
    const [invoiceDescription, setInvoiceDescription] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(true);
    const [transactionsKey, setTransactionsKey] = useState<number>(0);

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
            setBalanceMsat(newBalance);
            setError(null);
            setTransactionsKey(prevKey => prevKey + 1);
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
        <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center p-2 mt-[30%] sm:mt-[10%]">
            {nwc && <Header nwc={nwc} isLoading={isLoading} checkBalance={checkBalance} />}

            <div className="rounded-lg shadow-sm w-full sm:w-xl flex flex-col items-center justify-center">
                {!nwc ? (
                    <div className="space-y-10 w-full sm:w-md">
                        <div className="flex flex-col items-center justify-center">
                            <div className="flex flex-row items-center gap-1">
                                <FiZap className="text-orange-500 sm:text-3xl" />
                                <h1 className="text-xl sm:text-4xl font-bold text-orange-500 flex flex-col items-left justify-start space-x-3">
                                    Lightning Invoice
                                </h1>
                            </div>

                            <p className="text-gray-400 text-md sm:text-md text-center">
                                Fast and Secure Bitcoin Payments
                            </p>
                        </div>


                        <div className="space-y-4 p-4 w-full border border-zinc-800">

                            <h2 className="text-lg sm:text-xl font-semibold text-gray-400 text-center flex flex-row items-center justify-center">
                                Connect Nostr Wallet</h2>
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
                    </div>
                ) : (
                    <div className="w-full">
                        <div className="border rounded-md border-zinc-800 p-4 space-y-4 mb-20">
                            <div className="bg-zinc-950 relative">
                                <div className="flex flex-row items-center justify-start">
                                    <label className="text-gray-400 font-medium text-left text-xs uppercase">Balance</label>
                                    <button
                                        onClick={toggleBalanceVisibility}
                                        className="cursor-pointer m-1 text-gray-400 hover:text-orange-500 transition"
                                        title={isBalanceHidden ? "Show balance" : "Hide balance"}
                                    >
                                        {isBalanceHidden ? <FiEyeOff size={20} /> : <FiEye size={20} />}
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
                                Create Invoice
                            </button>
                        </div>

                        <Transactions key={transactionsKey} nwc={nwc} />
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