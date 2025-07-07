import React, { useState, useCallback, useEffect, useMemo } from "react";
import Transactions from "../components/Transactions";
import Header from "../components/Header";
import { useWallet } from "../contexts/ContextWallet";
import { useNavigate } from "react-router-dom";
import { FiLoader, FiAlertCircle, FiRefreshCw, FiDownload } from "react-icons/fi";

interface Transaction {
    id: string;
    type: "incoming" | "outgoing";
    amount: number;
    description: string;
    createdAt: string;
    paymentHash: string;
    timestamp: number;
}

const TransactionsPage: React.FC = () => {
    const { nwc, isInitializing } = useWallet();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filterType, setFilterType] = useState<"all" | "incoming" | "outgoing">("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const transactionsPerPage = 10;

    // Função para verificar saldo (para o Header)
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

            setError(null);
        } catch (err) {
            setError("Error checking balance: " + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [nwc]);

    // Função para buscar transações, agora memoizada com useCallback
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
                setTransactions([]);
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

                setTransactions(formattedTransactions);
                setError(null);
            }
        } catch (err) {
            setError("Failed to fetch transactions: " + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [nwc]);

    // Busca transações ao montar o componente
    useEffect(() => {
        if (nwc && !isInitializing) {
            fetchTransactions();
        }
    }, [nwc, isInitializing, fetchTransactions]);

    // Redireciona para a página inicial se a carteira não estiver conectada
    useEffect(() => {
        if (!isInitializing && !nwc) {
            navigate("/");
        }
    }, [nwc, isInitializing, navigate]);

    // Filtra e ordena transações
    const filteredTransactions = useMemo(() => {
        let result = [...transactions];

        // Filtro por tipo
        if (filterType !== "all") {
            result = result.filter((tx) => tx.type === filterType);
        }

        // Filtro por descrição
        if (searchQuery) {
            result = result.filter((tx) =>
                tx.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Ordenação por data
        result.sort((a, b) =>
            sortOrder === "desc" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
        );

        return result;
    }, [transactions, filterType, searchQuery, sortOrder]);

    // Calcula transações para a página atual
    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * transactionsPerPage;
        const endIndex = startIndex + transactionsPerPage;
        return filteredTransactions.slice(startIndex, endIndex);
    }, [filteredTransactions, currentPage]);

    // Calcula número total de páginas
    const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

    // Função para exportar transações como CSV
    const exportToCsv = useCallback(() => {
        const headers = ["ID,Type,Amount (sats),Description,Date,Payment Hash"];
        const rows = filteredTransactions.map((tx) =>
            [
                tx.id,
                tx.type,
                tx.amount,
                `"${tx.description.replace(/"/g, '""')}"`,
                tx.createdAt,
                tx.paymentHash,
            ].join(",")
        );

        const csvContent = [...headers, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "transactions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [filteredTransactions]);

    // Exibe tela de carregamento durante a inicialização
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
        <div className="min-h-screen bg-zinc-900">
            <Header isLoading={isLoading} checkBalance={checkBalance} />
            <header className="bg-zinc-900 border-b border-zinc-800">
                <div className="container mx-auto px-6 py-4 flex flex-col items-center">
                    <h1 className="text-2xl font-bold text-orange-500 mb-2">
                        Transaction History
                    </h1>
                    <p className="text-zinc-400 text-xs max-w-2xl">
                        View all your recent transactions via the Lightning Network. ⚡
                    </p>
                </div>
            </header>
            <main className="container mx-auto px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    {/* CONTROLS */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            {/* Filtro por tipo */}
                            <select
                                value={filterType}
                                onChange={(e) => {
                                    setFilterType(e.target.value as "all" | "incoming" | "outgoing");
                                    setCurrentPage(1);
                                }}
                                className="cursor-pointer bg-zinc-800 text-white border border-zinc-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                            >
                                <option value="all">All Transactions</option>
                                <option value="incoming">Incoming</option>
                                <option value="outgoing">Outgoing</option>
                            </select>
                            {/* Busca por descrição */}
                            <input
                                type="text"
                                placeholder="Search by description..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-zinc-800 text-white border border-zinc-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none w-full sm:w-64"
                            />
                        </div>
                        <div className="flex gap-4">
                            {/* Ordenação */}
                            <button
                                onClick={() => {
                                    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                                    setCurrentPage(1);
                                }}
                                className="cursor-pointer flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition"
                            >
                                <FiRefreshCw className={sortOrder === "desc" ? "" : "rotate-180"} />
                                {sortOrder === "desc" ? "Newest First" : "Oldest First"}
                            </button>
                            {/* Exportar CSV */}
                            <button
                                onClick={exportToCsv}
                                className="cursor-pointer flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                            >
                                <FiDownload />
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Contagem de transações */}
                    <p className="text-zinc-400 text-sm mb-4">
                        Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
                    </p>

                    {/* Componente Transactions com transações paginadas */}
                    <Transactions
                        nwc={nwc}
                        limit={undefined}
                        transactionsOverride={paginatedTransactions}
                    />

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex justify-between items-center">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`px-4 py-2 rounded-lg transition cursor-pointer ${currentPage === 1
                                    ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                                    : "bg-orange-500 text-white hover:bg-orange-600"
                                    }`}
                            >
                                Previous
                            </button>
                            <span className="text-zinc-400">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`px-4 py-2 rounded-lg transition cursor-pointer ${currentPage === totalPages
                                    ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                                    : "bg-orange-500 text-white hover:bg-orange-600"
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 sm:mt-6 p-2 sm:p-4 bg-red-50 border border-red-100 rounded-sm w-full max-w-4xl mx-auto text-red-600 flex items-center space-x-2 text-xs sm:text-sm">
                            <FiAlertCircle />
                            <span className="break-words">{error}</span>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TransactionsPage;