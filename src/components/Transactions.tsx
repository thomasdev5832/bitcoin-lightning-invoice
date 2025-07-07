import { useEffect, useState, useCallback } from "react";
import { FiLoader, FiAlertCircle, FiZap } from "react-icons/fi";
import { webln } from "@getalby/sdk";
import { MdOutlineSwapVert } from "react-icons/md";

interface Transaction {
    id: string;
    type: "incoming" | "outgoing";
    amount: number;
    description: string;
    createdAt: string;
    paymentHash: string;
    timestamp: number;
}

interface TransactionsProps {
    nwc: webln.NostrWebLNProvider | null;
    limit?: number;
    transactionsOverride?: Transaction[];
}

const Transactions = ({ nwc, limit = 10, transactionsOverride }: TransactionsProps) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Busca transações reais da API NWC, agora memoizada com useCallback
    const fetchTransactions = useCallback(async () => {
        if (!nwc) {
            setError("Wallet not connected.");
            return;
        }
        try {
            setIsLoading(true);
            const response = await nwc.listTransactions({});

            if (!response.transactions || response.transactions.length === 0) {
                setError("No transactions found.");
            } else {
                const formattedTransactions: Transaction[] = response.transactions.map((tx) => {
                    const timestamp = tx.settled_at || tx.created_at;
                    const date = timestamp ? new Date(timestamp * 1000).toLocaleString() : "Unsettled";

                    return {
                        id: tx.payment_hash,
                        type: tx.type as "incoming" | "outgoing",
                        amount: tx.amount,
                        description: tx.description || "No description",
                        createdAt: date,
                        paymentHash: tx.payment_hash,
                        timestamp: timestamp || 0,
                    };
                });

                const sortedTransactions = formattedTransactions.sort(
                    (a, b) => b.timestamp - a.timestamp
                );

                const displayedTransactions = limit
                    ? sortedTransactions.slice(0, limit)
                    : sortedTransactions;
                setTransactions(displayedTransactions);
                setError(null);
            }
        } catch (err) {
            setError("Failed to fetch transactions: " + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [nwc, limit]); // Dependências: nwc e limit

    // Busca transações quando o componente é montado ou a carteira muda, se não houver override
    useEffect(() => {
        if (nwc && !transactionsOverride) {
            fetchTransactions();
        } else if (transactionsOverride) {
            setTransactions(transactionsOverride);
            setError(null);
        }
    }, [nwc, transactionsOverride, fetchTransactions]);

    return (
        <div className="w-full">
            <div className="flex flex-row items-center mb-2">
                <MdOutlineSwapVert className="text-orange-500 text-lg" />
                <h3 className="text-sm font-semibold text-gray-400">Transactions</h3>
            </div>
            {isLoading ? (
                <div className="flex justify-center">
                    <FiLoader className="animate-spin text-orange-500 text-2xl" />
                </div>
            ) : error ? (
                <div className="mt-4 sm:mt-6 p-2 sm:p-4 bg-red-50 border border-red-100 rounded-sm w-full max-w-full overflow-hidden text-red-600 flex items-center space-x-2 text-xs sm:text-sm">
                    <FiAlertCircle />
                    <span className="break-words">{error}</span>
                </div>
            ) : transactions.length === 0 ? (
                <p className="text-gray-400 text-sm text-center">No transactions found.</p>
            ) : (
                <div className="space-y-3">
                    {transactions.map((tx) => (
                        <div
                            key={tx.id}
                            className="flex items-center justify-between p-3 bg-zinc-900 hover:bg-zinc-800 transition duration-100 border border-zinc-900 rounded-sm cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <FiZap className="text-orange-500" />
                                <div>
                                    <p className="text-gray-400 text-xs">{tx.createdAt}</p>
                                </div>
                            </div>
                            <p
                                className={`text-sm font-semibold ${tx.type === "incoming" ? "text-green-400" : "text-orange-500"
                                    }`}
                            >
                                {tx.type === "incoming" ? "+" : "-"} {tx.amount} sats
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Transactions;