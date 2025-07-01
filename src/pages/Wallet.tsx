import { useState, useEffect, useCallback, useRef } from "react";
import { FiLoader, FiAlertCircle, FiCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../contexts/ContextWallet";
import GenerateInvoiceModal from "../components/GenerateInvoiceModal";
import Transactions from "../components/Transactions";
import Header from "../components/Header";
import MiniDashboard from "../components/MiniDashboard";

const Wallet = () => {
    const { nwc, isInitializing } = useWallet();
    const navigate = useNavigate();
    const [balanceMsat, setBalanceMsat] = useState<number | null>(null);
    const [invoice, setInvoice] = useState<string | null>(null);
    const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
    const [invoiceDescription, setInvoiceDescription] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [transactionsKey, setTransactionsKey] = useState<number>(0);
    const [btcToUsd, setBtcToUsd] = useState<number>(0);
    const [isPriceLoading, setIsPriceLoading] = useState<boolean>(true);
    const [paymentNotification, setPaymentNotification] = useState<string | null>(null);
    const monitoringIntervalRef = useRef<number | null>(null);

    // Funções de conversão
    const msatToSats = useCallback((msat: number): number => msat / 1000, []);
    const msatToBtc = useCallback((msat: number): number => msat / 1000 / 100_000_000, []);
    const msatToUsd = useCallback(
        (msat: number): number => msatToBtc(msat) * btcToUsd,
        [btcToUsd, msatToBtc]
    );

    // Funções de formatação
    const formatSats = useCallback((sats: number): string =>
        sats.toLocaleString('en-US', { maximumFractionDigits: 0 }), []);

    const formatBtc = useCallback((btc: number): string =>
        btc.toFixed(8), []);

    const formatUsd = useCallback((usd: number): string =>
        usd.toFixed(2), []);

    // Formatar saldo para exibição
    const formatBalance = useCallback((msat: number) => {
        const sats = msatToSats(msat);
        const btc = msatToBtc(msat);
        const usd = msatToUsd(msat);

        return {
            primary: `${formatSats(sats)} sats`,
            secondary: btcToUsd > 0 ? `${formatBtc(btc)} BTC` : 'BTC price unavailable',
            tertiary: btcToUsd > 0 ? `$${formatUsd(usd)} USD` : 'USD price unavailable',
        };
    }, [msatToSats, msatToBtc, msatToUsd, btcToUsd, formatSats, formatBtc, formatUsd]);

    // Verificar saldo
    const checkBalance = useCallback(async () => {
        if (!nwc) {
            setError("Please connect a wallet first.");
            return;
        }

        try {
            setIsLoading(true);
            const balanceResponse = await nwc.getBalance();
            let newBalance = balanceResponse.balance;

            if (newBalance < 1000) {
                newBalance = newBalance * 1000;
            }

            setBalanceMsat(newBalance);
            setError(null);
            setTransactionsKey(prevKey => prevKey + 1);
        } catch (err) {
            setError("Error checking balance: " + (err as Error).message);
            // Tentar novamente após 5 segundos
            setTimeout(() => checkBalance(), 5000);
        } finally {
            setIsLoading(false);
        }
    }, [nwc]);

    // Buscar cotação do BTC em USD
    const fetchBtcToUsd = useCallback(async () => {
        try {
            setIsPriceLoading(true);
            const response = await fetch(
                "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.bitcoin?.usd) {
                setBtcToUsd(data.bitcoin.usd);
                setError(null);
            } else {
                setError("Invalid response from CoinGecko API.");
            }
        } catch (err) {
            setError("Error fetching BTC price: " + (err as Error).message);
        } finally {
            setIsPriceLoading(false);
        }
    }, []);

    // Criar fatura
    const createInvoice = useCallback(async () => {
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
            const invoiceResponse = await nwc.makeInvoice({
                amount: invoiceAmount,
                description: invoiceDescription
            });

            setInvoice(invoiceResponse.paymentRequest);
            setError(null);
        } catch (err) {
            setError("Error creating invoice: " + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [nwc, invoiceAmount, invoiceDescription]);

    // Monitorar pagamento
    const startPaymentMonitoring = useCallback(() => {
        if (!nwc || !balanceMsat) return;

        // Limpar qualquer intervalo existente
        if (monitoringIntervalRef.current) {
            clearInterval(monitoringIntervalRef.current);
            monitoringIntervalRef.current = null;
        }

        const expectedNewBalance = balanceMsat + invoiceAmount;

        const checkBalanceChange = async () => {
            try {
                const balanceResponse = await nwc.getBalance();
                let currentBalance = balanceResponse.balance;

                if (currentBalance < 1000) {
                    currentBalance = currentBalance * 1000;
                }

                if (currentBalance >= expectedNewBalance) {
                    // Limpar o intervalo quando o pagamento for detectado
                    if (monitoringIntervalRef.current) {
                        clearInterval(monitoringIntervalRef.current);
                        monitoringIntervalRef.current = null;
                    }

                    setPaymentNotification(`Payment received! ${invoiceAmount} sats`);
                    setBalanceMsat(currentBalance);
                    setTransactionsKey(prevKey => prevKey + 1);

                    setTimeout(() => {
                        setIsModalOpen(false);
                        setInvoice(null);
                        setInvoiceAmount(0);
                        setInvoiceDescription("");
                    }, 1500);

                    setTimeout(() => {
                        setPaymentNotification(null);
                    }, 10000);

                    return true;
                }
                return false;
            } catch (err) {
                console.error("Error checking balance:", err);
                return false;
            }
        };

        const maxAttempts = 200;
        let attempts = 0;

        monitoringIntervalRef.current = window.setInterval(async () => {
            attempts++;
            const isPaid = await checkBalanceChange();

            if (isPaid || attempts >= maxAttempts) {
                if (monitoringIntervalRef.current) {
                    clearInterval(monitoringIntervalRef.current);
                    monitoringIntervalRef.current = null;
                }
            }
        }, 3000);

        return () => {
            if (monitoringIntervalRef.current) {
                clearInterval(monitoringIntervalRef.current);
                monitoringIntervalRef.current = null;
            }
        };
    }, [nwc, balanceMsat, invoiceAmount]);

    // Efeitos
    useEffect(() => {
        if (!isInitializing && !nwc) {
            navigate("/");
        }
    }, [nwc, isInitializing, navigate]);

    useEffect(() => {
        fetchBtcToUsd();
        const intervalId = setInterval(fetchBtcToUsd, 60_000);
        return () => clearInterval(intervalId);
    }, [fetchBtcToUsd]);

    useEffect(() => {
        if (nwc && !isInitializing) {
            checkBalance();
        }
    }, [nwc, isInitializing, checkBalance]);

    useEffect(() => {
        if (!isModalOpen || !invoice) return;

        const cleanup = startPaymentMonitoring();
        return cleanup;
    }, [isModalOpen, invoice, startPaymentMonitoring]);

    useEffect(() => {
        return () => {
            if (monitoringIntervalRef.current) {
                clearInterval(monitoringIntervalRef.current);
            }
        };
    }, []);

    if (isInitializing) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <FiLoader className="text-orange-500 animate-spin text-4xl mx-auto mb-4" />
                    <p className="text-white">Loading wallet...</p>
                </div>
            </div>
        );
    }

    if (!nwc) {
        return null;
    }

    return (
        <div className="min-h-screen w-full bg-zinc-950 flex flex-col items-center p-2 mt-[10%] sm:mt-[100px]">
            <Header isLoading={isLoading} checkBalance={checkBalance} />

            {paymentNotification && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-green-400 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-2 border-2 border-green-400 w-auto whitespace-nowrap">
                    <FiCheck className="text-2xl animate-bounce" />
                    <span className="font-bold text-lg">{paymentNotification}</span>
                </div>
            )}

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <FiLoader className="text-orange-500 animate-spin text-4xl" />
                </div>
            )}

            <div className="rounded-lg shadow-sm w-full sm:w-xl flex flex-col items-center justify-center">
                <div className="w-full flex flex-col gap-4">
                    <div className="border rounded-md border-zinc-800 p-4 space-y-4">
                        <div className="bg-zinc-950 relative">
                            <div className="flex items-center justify-center gap-4 flex-col sm:flex-row">
                                <div className="text-gray-700 font-medium text-center">
                                    {balanceMsat === null ? (
                                        <span className="text-gray-400">Unable to load balance</span>
                                    ) : balanceMsat === 0 ? (
                                        <span className="text-gray-400">No balance available</span>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="text-gray-300 font-bold text-3xl sm:text-4xl">
                                                {formatBalance(balanceMsat).primary}
                                            </span>
                                            <div className="text-gray-400 flex flex-col items-end text-xl sm:text-base mt-2">
                                                <span>{formatBalance(balanceMsat).secondary}</span>
                                                {isPriceLoading ? (
                                                    <span>Updating USD price...</span>
                                                ) : (
                                                    <span>{formatBalance(balanceMsat).tertiary}</span>
                                                )}
                                            </div>
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

                <GenerateInvoiceModal
                    isOpen={isModalOpen}
                    onClose={() => {
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