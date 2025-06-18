import { useState, useEffect } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FiLoader, FiAlertCircle, FiEye, FiEyeOff, FiCheck } from "react-icons/fi";
import { webln } from "@getalby/sdk";
import GenerateInvoiceModal from "../components/GenerateInvoiceModal";
import Transactions from "../components/Transactions";
import Header from "../components/Header";
import ConnectWallet from "../components/ConnectWallet";
import MiniDashboard from "../components/MiniDashboard";

const Wallet = () => {
    const [nwc, setNwc] = useState<webln.NostrWebLNProvider | null>(null);
    const [balanceMsat, setBalanceMsat] = useState<number | null>(null);
    const [invoice, setInvoice] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [connectionUri, setConnectionUri] = useState<string>("");
    const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
    const [invoiceDescription, setInvoiceDescription] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
    const [transactionsKey, setTransactionsKey] = useState<number>(0);
    const [btcToUsd, setBtcToUsd] = useState<number>(0);
    const [isPriceLoading, setIsPriceLoading] = useState<boolean>(true);

    // Estados para notificação de pagamento
    const [paymentNotification, setPaymentNotification] = useState<string | null>(null);
    const [monitoringInterval, setMonitoringInterval] = useState<number | null>(null);

    // Conversion functions (return numbers for calculations)
    const msatToSats = (msat: number): number => msat / 1000; // msat to sats
    const msatToBtc = (msat: number): number => msat / 1000 / 100_000_000; // msat to btc
    const msatToUsd = (msat: number, btcPrice: number): number => msatToBtc(msat) * btcPrice;

    // Formatting functions (return strings for display)
    const formatSats = (sats: number): string => sats.toLocaleString('en-US', { maximumFractionDigits: 0 }); // No decimals for sats
    const formatBtc = (btc: number): string => btc.toFixed(8); // 8 decimals for BTC
    const formatUsd = (usd: number): string => usd < 1 ? usd.toFixed(2) : usd.toFixed(2); // 4 decimals for small USD, 2 for large

    // Format balance for display
    const formatBalance = (msat: number, btcPrice: number) => {
        const sats = msatToSats(msat);
        const btc = msatToBtc(msat);
        const usd = msatToUsd(msat, btcPrice);

        return {
            primary: `${formatSats(sats)} sats`,
            secondary: btcPrice > 0 ? `${formatBtc(btc)} BTC` : 'BTC price unavailable',
            tertiary: btcPrice > 0 ? `$${formatUsd(usd)} USD` : 'USD price unavailable',
        };
    };

    // Fetch BTC to USD price from CoinGecko
    const fetchBtcToUsd = async () => {
        try {
            setIsPriceLoading(true);
            console.log("Fetching BTC to USD price from CoinGecko...");
            const response = await fetch(
                "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
            );
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            console.log("CoinGecko API response:", data);
            if (data.bitcoin && data.bitcoin.usd) {
                setBtcToUsd(data.bitcoin.usd);
                setError(null);
                console.log(`BTC to USD price set to: ${data.bitcoin.usd}`);
            } else {
                setError("Invalid response from CoinGecko API.");
                console.error("Invalid API response:", data);
            }
        } catch (err) {
            const errorMessage = "Error fetching BTC price: " + (err as Error).message;
            setError(errorMessage);
            console.error(errorMessage);
        } finally {
            setIsPriceLoading(false);
        }
    };

    // Fetch price on mount and every 60 seconds
    useEffect(() => {
        fetchBtcToUsd();
        const intervalId = setInterval(fetchBtcToUsd, 60_000);
        return () => clearInterval(intervalId);
    }, []);

    // Load connectionUri from sessionStorage on mount and attempt reconnect
    useEffect(() => {
        const savedUri = sessionStorage.getItem("nostrWalletConnectUri");
        if (savedUri) {
            console.log("Found saved connection URI in sessionStorage:", savedUri);
            setConnectionUri(savedUri);
            connectWallet(savedUri);
        }
    }, []);

    const connectWallet = async (uri: string) => {
        try {
            if (!uri) {
                setError("Please enter a valid connection URI.");
                return;
            }
            setIsLoading(true);
            const nwcProvider = new webln.NostrWebLNProvider({ nostrWalletConnectUrl: uri });
            await nwcProvider.enable();
            setNwc(nwcProvider);
            setError(null);
            sessionStorage.setItem("nostrWalletConnectUri", uri);
            await checkBalance(nwcProvider);
            setIsLoading(false);
        } catch (err) {
            setError("Failed to connect wallet: " + (err as Error).message);
            console.error("Wallet connection error:", err);
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
            console.log("Balance response:", balanceResponse);
            let newBalance = balanceResponse.balance;
            // If balance is suspiciously small (e.g., < 1000 msat), assume it's in sats and convert to msat
            if (newBalance < 1000) {
                console.warn(`Balance ${newBalance} msat seems too small; assuming balance is in sats and converting to msat`);
                newBalance = newBalance * 1000; // Convert sats to msat
            }
            console.log(`Balance fetched: ${newBalance} msat (${msatToSats(newBalance)} sats)`);
            setBalanceMsat(newBalance);
            setError(null);
            setTransactionsKey(prevKey => prevKey + 1);
            setIsLoading(false);
        } catch (err) {
            setError("Error checking balance: " + (err as Error).message);
            console.error("Balance check error:", err);
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
            startPaymentMonitoring();
        } catch (err) {
            setError("Error creating invoice: " + (err as Error).message);
            setIsLoading(false);
        }
    };

    const startPaymentMonitoring = () => {
        if (!nwc || balanceMsat === null) return;

        const initialBalance = balanceMsat;
        const expectedNewBalance = balanceMsat + invoiceAmount;

        console.log(`Monitoring payment. Initial: ${initialBalance} msat, Expected: ${expectedNewBalance} msat`);

        const checkBalanceChange = async () => {
            try {
                const balanceResponse = await nwc.getBalance();
                let currentBalance = balanceResponse.balance;
                // Apply same unit conversion as in checkBalance
                if (currentBalance < 1000) {
                    currentBalance = currentBalance * 1000; // Convert sats to msat
                }
                console.log(`Current balance: ${currentBalance} msat`);

                if (currentBalance >= expectedNewBalance) {
                    console.log("🎉 PAYMENT DETECTED! Showing notification...");
                    setPaymentNotification(`Payment received! ${invoiceAmount} sats`);
                    setBalanceMsat(currentBalance);
                    setTransactionsKey(prevKey => prevKey + 1);

                    setTimeout(() => {
                        setIsModalOpen(false);
                        setInvoice(null);
                        setInvoiceAmount(0);
                        setInvoiceDescription("");
                        console.log("Modal closed automatically");
                    }, 1500);

                    setTimeout(() => {
                        setPaymentNotification(null);
                        console.log("Hiding notification...");
                    }, 10000);

                    return true;
                }
                return false;
            } catch (err) {
                console.log("Error checking balance:", err);
                return false;
            }
        };

        const maxAttempts = 200;
        let attempts = 0;

        const intervalId = setInterval(async () => {
            attempts++;
            const isPaid = await checkBalanceChange();

            if (isPaid || attempts >= maxAttempts) {
                clearInterval(intervalId);
                setMonitoringInterval(null);
                if (attempts >= maxAttempts) {
                    console.log("Payment monitoring timeout");
                }
            }
        }, 3000);

        setMonitoringInterval(intervalId);
    };

    // const toggleBalanceVisibility = () => {
    //     setIsBalanceHidden(!isBalanceHidden);
    //     console.log("Balance visibility toggled:", !isBalanceHidden);
    // };

    useEffect(() => {
        if (!isModalOpen && monitoringInterval) {
            console.log("Stopping payment monitoring - modal closed");
            clearInterval(monitoringInterval);
            setMonitoringInterval(null);
        }
    }, [isModalOpen, monitoringInterval]);

    return (
        <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center p-2 mt-[10%] sm:mt-[100px]">
            {nwc && (
                <Header
                    nwc={nwc}
                    isLoading={isLoading}
                    checkBalance={checkBalance}
                    setNwc={setNwc}
                    setConnectionUri={setConnectionUri}
                    setBalanceMsat={setBalanceMsat}
                    setError={setError}
                />
            )}

            {paymentNotification && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-green-400 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-2 border-2 border-green-400 w-auto whitespace-nowrap">
                    <FiCheck className="text-2xl animate-bounce" />
                    <span className="font-bold text-lg">{paymentNotification}</span>
                </div>
            )}

            <div className="rounded-lg shadow-sm w-full sm:w-xl flex flex-col items-center justify-center">
                {!nwc ? (
                    <ConnectWallet connectWallet={connectWallet} />
                ) : (
                    <div className="w-full flex flex-col gap-4">
                        <div className="border rounded-md border-zinc-800 p-4 space-y-4">
                            <div className="bg-zinc-950 relative">
                                {/* <div className="flex flex-row items-center justify-start">
                                    <button
                                        onClick={toggleBalanceVisibility}
                                        className="cursor-pointer m-1 text-gray-400 hover:text-orange-500 transition"
                                        title={isBalanceHidden ? "Show balance" : "Hide balance"}
                                    >
                                        {isBalanceHidden ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                    </button>
                                </div> */}
                                <div className="flex items-center justify-center gap-4 flex-col sm:flex-row">
                                    <div className="text-gray-700 font-medium text-center">
                                        {isLoading ? (
                                            <span className="flex items-center justify-center my-6">
                                                <FiLoader className="text-orange-500 animate-spin text-2xl sm:text-2xl" />
                                            </span>
                                        ) : balanceMsat === null ? (
                                            <span className="text-gray-400">Unable to load balance</span>
                                        ) : balanceMsat === 0 ? (
                                            <span className="text-gray-400">No balance available</span>
                                        ) : (
                                            <div className="flex flex-col items-end">
                                                <span className="text-gray-300 font-bold text-3xl sm:text-4xl">
                                                    {isBalanceHidden ? "•••••" : formatBalance(balanceMsat, btcToUsd).primary}
                                                </span>
                                                {!isBalanceHidden && (
                                                    <div className="text-gray-400 flex flex-col items-end text-xl sm:text-base mt-2">
                                                        <span>{formatBalance(balanceMsat, btcToUsd).secondary}</span>
                                                        {isPriceLoading ? (
                                                            <span>Updating USD price...</span>
                                                        ) : (
                                                            <span>{formatBalance(balanceMsat, btcToUsd).tertiary}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="cursor-pointer w-full bg-orange-500 text-zinc-950 py-4 rounded-md hover:bg-orange-600 uppercase transition font-bold text-xl"
                            >
                                Receive payment
                            </button>
                        </div>
                        <MiniDashboard nwc={nwc} btcToUsd={btcToUsd} />
                        <Transactions key={transactionsKey} nwc={nwc} />
                    </div>
                )}

                <GenerateInvoiceModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        if (monitoringInterval) {
                            clearInterval(monitoringInterval);
                            setMonitoringInterval(null);
                        }
                        setIsModalOpen(false);
                        setInvoice(null);
                        setInvoiceAmount(0);
                        setInvoiceDescription("");
                    }}
                    onCreateInvoice={{
                        amount: setInvoiceAmount,
                        description: setInvoiceDescription,
                        create: createInvoice,
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