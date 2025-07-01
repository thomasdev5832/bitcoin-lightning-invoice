import { useEffect, useState } from "react";
import { FiLoader, FiAlertCircle, FiZap } from "react-icons/fi";
import { webln } from "@getalby/sdk";
import { MdOutlineSwapVert } from "react-icons/md";

interface Transaction {
    id: string;
    type: "incoming" | "outgoing";
    amount: number; // em sats
    description: string;
    createdAt: string; // Data formatada
    paymentHash: string;
    timestamp: number;
}

interface TransactionsProps {
    nwc: webln.NostrWebLNProvider | null;
}

const Transactions = ({ nwc }: TransactionsProps) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Busca transações reais da API NWC
    const fetchTransactions = async () => {
        if (!nwc) {
            setError("Wallet not connected.");
            return;
        }
        try {
            setIsLoading(true);
            // Faz a requisição para listar transações
            const response = await nwc.listTransactions({});

            // Verifica se a resposta contém transações
            if (!response.transactions || response.transactions.length === 0) {
                setError("No transactions found.");
            } else {
                // Formata as transações
                const formattedTransactions: Transaction[] = response.transactions.map((tx) => {
                    // Determina a data correta: settled_at (se pago) ou created_at (se não pago)
                    const timestamp = tx.settled_at || tx.created_at;
                    const date = timestamp ? new Date(timestamp * 1000).toLocaleString() : "Unsettled";

                    // Usa o valor diretamente como sats (sem conversão)
                    const amountInSats = tx.amount; // Já está em sats, conforme logs

                    // console.log("Raw tx.amount:", tx.amount);
                    // console.log("Formatted amountInSats:", amountInSats);
                    // console.log("Timestamp:", timestamp);

                    return {
                        id: tx.payment_hash, // Usamos o payment_hash como ID
                        type: tx.type as "incoming" | "outgoing", // Type assertion for the union type
                        amount: amountInSats, // Valor em sats
                        description: tx.description || "No description",
                        createdAt: date, // Data formatada para exibição
                        paymentHash: tx.payment_hash,
                        timestamp: timestamp || 0, // Adiciona timestamp numérico para ordenação
                    };
                });

                // Ordena por timestamp em ordem decrescente (mais recente primeiro)
                const sortedTransactions = formattedTransactions.sort((a, b) => b.timestamp - a.timestamp);

                // Pega as 5 mais recentes (primeiras após ordenação)
                const recentTransactions = sortedTransactions.slice(0, 10);
                setTransactions(recentTransactions);
                setError(null);
            }
        } catch (err) {
            setError("Failed to fetch transactions: " + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    // Busca transações quando o componente é montado ou a carteira muda
    useEffect(() => {
        if (nwc) {
            fetchTransactions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nwc]);

    return (
        <div className="w-full">
            <div className="flex flex-row items-center mb-2">
                <MdOutlineSwapVert className="text-orange-500 text-lg" />
                <h3 className="text-sm font-semibold text-gray-400">Recent Transactions</h3>
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
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-zinc-900 hover:bg-zinc-800 transition duration-100 border border-zinc-900 rounded-sm cursor-pointer">
                            <div className="flex items-center gap-2">
                                {/* <div className={`p-2 rounded-full ${tx.type === "incoming" ? "bg-green-500" : "bg-red-500"}`}>
                                {tx.type === "incoming" ? <FiArrowDown className="text-white" /> : <FiArrowUp className="text-white" />}
                            </div> */}
                                <FiZap className="text-orange-500" />
                                <div>
                                    {/* <p className="text-gray-300 text-sm">{tx.description}</p> */}
                                    <p className="text-gray-400 text-xs">{tx.createdAt}</p>
                                </div>
                            </div>
                            <p className={`text-sm font-semibold ${tx.type === "incoming" ? "text-green-400" : "text-orange-500"}`}>
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