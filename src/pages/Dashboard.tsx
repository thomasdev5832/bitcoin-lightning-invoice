import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useWallet } from "../contexts/ContextWallet";
import { useNavigate } from "react-router-dom";
import { FiLoader, FiAlertCircle, FiDownload, FiZap, FiTrendingUp, FiActivity, FiPieChart } from "react-icons/fi";
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, TooltipProps } from "recharts";
import { webln } from "@getalby/sdk";
import Header from "../components/Header";
import { jsPDF } from "jspdf";

interface Transaction {
    id: string;
    type: "incoming" | "outgoing";
    amount: number;
    description: string;
    createdAt: string;
    paymentHash: string;
    timestamp: number;
    settledAt?: number;
}

interface DashboardMetrics {
    totalRevenue: number; // in sats
    totalTransactions: number;
    averageTransaction: number;
    successRate: number;
    revenueChangePercent: number;
    transactionsChangePercent: number;
    dailyTransactions: Array<{ date: string; count: number; revenue: number }>;
    hourlyActivity: Array<{ hour: string; count: number }>;
    transactionTypeDistribution: Array<{ name: string; value: number }>;
    balanceHistory: Array<{ date: string; balance: number }>;
}

type TimePeriod = "today" | "week" | "30days" | "60days" | "custom";

interface TimeRange {
    label: string;
    value: TimePeriod;
    getDays: () => number;
}

const Dashboard: React.FC = () => {
    const { nwc, isInitializing } = useWallet();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        successRate: 0,
        revenueChangePercent: 0,
        transactionsChangePercent: 0,
        dailyTransactions: [],
        hourlyActivity: [],
        transactionTypeDistribution: [],
        balanceHistory: [],
    });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("30days");
    const [filterType, setFilterType] = useState<"all" | "incoming" | "outgoing">("all");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
    const [currency, setCurrency] = useState<"sats" | "usd">("sats");
    const [exportFormat, setExportFormat] = useState<"csv" | "json" | "pdf">("csv");
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const transactionsPerPage = 10;
    const [btcToUsd, setBtcToUsd] = useState<number>(0);

    // Memoize timeRanges
    const timeRanges = useMemo<TimeRange[]>(() => [
        { label: "Today", value: "today", getDays: () => 1 },
        { label: "Last 7 days", value: "week", getDays: () => 7 },
        { label: "Last 30 days", value: "30days", getDays: () => 30 },
        { label: "Last 60 days", value: "60days", getDays: () => 60 },
        { label: "Custom", value: "custom", getDays: () => 0 },
    ], []);

    // Conversion functions
    const satsToUsd = useCallback((sats: number): number => (sats / 100_000_000) * btcToUsd, [btcToUsd]);
    const formatUsd = useCallback((usd: number): string => usd.toFixed(2), []);

    // Fetch BTC to USD price
    const fetchBtcToUsd = useCallback(async () => {
        try {
            const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            if (data.bitcoin?.usd) setBtcToUsd(data.bitcoin.usd);
        } catch (err) {
            setError("Error fetching BTC price: " + (err as Error).message);
        }
    }, []);

    // Check balance for Header
    const checkBalance = useCallback(async () => {
        if (!nwc) {
            setError("Please connect a wallet first.");
            return;
        }
        try {
            setIsLoading(true);
            const balanceResponse = await nwc.getBalance();
            let newBalance = balanceResponse.balance;
            if (newBalance < 1000) newBalance = newBalance * 1000;
            setError(null);
        } catch (err) {
            setError("Error checking balance: " + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [nwc]);

    // Fetch transactions
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
                setMetrics({
                    totalRevenue: 0,
                    totalTransactions: 0,
                    averageTransaction: 0,
                    successRate: 0,
                    revenueChangePercent: 0,
                    transactionsChangePercent: 0,
                    dailyTransactions: [],
                    hourlyActivity: [],
                    transactionTypeDistribution: [],
                    balanceHistory: [],
                });
                setTransactions([]);
                return;
            }

            const now = Date.now() / 1000;
            const currentPeriodDays = selectedPeriod === "custom" ? 0 : timeRanges.find(r => r.value === selectedPeriod)?.getDays() || 30;
            const currentPeriodStart = selectedPeriod === "custom" && startDate
                ? Math.floor(new Date(startDate).getTime() / 1000)
                : now - (currentPeriodDays * 24 * 60 * 60);
            const currentPeriodEnd = selectedPeriod === "custom" && endDate
                ? Math.floor(new Date(endDate).getTime() / 1000)
                : now;
            const previousPeriodStart = selectedPeriod === "custom" && startDate
                ? currentPeriodStart - (currentPeriodEnd - currentPeriodStart)
                : now - (currentPeriodDays * 2 * 24 * 60 * 60);

            const transactions: Transaction[] = response.transactions.map((tx: webln.Transaction) => {
                const timestamp = tx.settled_at || tx.created_at || 0;
                const date = timestamp ? new Date(timestamp * 1000).toLocaleString() : "Unsettled";
                const txType = tx.type === "incoming" || tx.type === "outgoing" ? tx.type : "incoming";
                return {
                    id: tx.payment_hash,
                    type: txType,
                    amount: tx.amount,
                    description: tx.description || "No description",
                    createdAt: date,
                    paymentHash: tx.payment_hash,
                    timestamp,
                    settledAt: tx.settled_at,
                };
            });

            // Filter transactions for current period
            const currentPeriodTransactions = transactions.filter((tx) =>
                tx.timestamp >= currentPeriodStart && tx.timestamp <= currentPeriodEnd
            );
            const currentPeriodIncoming = currentPeriodTransactions.filter(tx => tx.type === "incoming");

            // Filter transactions for previous period
            const previousPeriodTransactions = transactions.filter((tx) =>
                tx.timestamp >= previousPeriodStart && tx.timestamp < currentPeriodStart
            );
            const previousPeriodIncoming = previousPeriodTransactions.filter(tx => tx.type === "incoming");

            // Calculate metrics
            const totalRevenue = currentPeriodIncoming.reduce((sum, tx) => sum + tx.amount, 0);
            const totalTransactions = currentPeriodTransactions.length;
            const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
            const successRate = transactions.length > 0
                ? (transactions.filter(tx => tx.settledAt !== undefined).length / transactions.length) * 100
                : 0;
            const previousRevenue = previousPeriodIncoming.reduce((sum, tx) => sum + tx.amount, 0);
            const previousTransactions = previousPeriodTransactions.length;
            const revenueChangePercent = previousRevenue > 0
                ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
                : totalRevenue > 0 ? 100 : 0;
            const transactionsChangePercent = previousTransactions > 0
                ? ((totalTransactions - previousTransactions) / previousTransactions) * 100
                : totalTransactions > 0 ? 100 : 0;

            // Generate daily data
            const dailyData: { [key: string]: { count: number; revenue: number } } = {};
            const days = selectedPeriod === "custom" && startDate && endDate
                ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
                : currentPeriodDays;
            for (let i = 0; i < days; i++) {
                const date = new Date((currentPeriodStart + (i * 24 * 60 * 60)) * 1000);
                const dateKey = selectedPeriod === "today"
                    ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                dailyData[dateKey] = { count: 0, revenue: 0 };
            }

            currentPeriodTransactions.forEach(tx => {
                const date = new Date(tx.timestamp * 1000);
                const dateKey = selectedPeriod === "today"
                    ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (!dailyData[dateKey]) dailyData[dateKey] = { count: 0, revenue: 0 };
                dailyData[dateKey].count += 1;
                if (tx.type === "incoming") dailyData[dateKey].revenue += tx.amount;
            });

            const dailyTransactions = Object.entries(dailyData)
                .sort(([a], [b]) => selectedPeriod === "today" ? a.localeCompare(b) : new Date(a).getTime() - new Date(b).getTime())
                .map(([date, data]) => ({ date, count: data.count, revenue: data.revenue }));

            // Generate hourly activity
            const hourlyActivity: { [key: string]: number } = {};
            for (let i = 0; i < 24; i++) {
                hourlyActivity[i.toString().padStart(2, '0') + ":00"] = 0;
            }
            currentPeriodTransactions.forEach(tx => {
                const hour = new Date(tx.timestamp * 1000).getHours().toString().padStart(2, '0') + ":00";
                hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
            });
            const hourlyActivityData = Object.entries(hourlyActivity).map(([hour, count]) => ({ hour, count }));

            // Transaction type distribution
            const transactionTypeDistribution = [
                { name: "Incoming", value: currentPeriodIncoming.length },
                { name: "Outgoing", value: currentPeriodTransactions.length - currentPeriodIncoming.length },
            ];

            // Generate balance history
            const balanceHistory: { date: string; balance: number; }[] = [];
            let runningBalance = 0;
            transactions.sort((a, b) => a.timestamp - b.timestamp).forEach(tx => {
                runningBalance += tx.type === "incoming" ? tx.amount : -tx.amount;
                balanceHistory.push({
                    date: new Date(tx.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    balance: runningBalance,
                });
            });

            setMetrics({
                totalRevenue,
                totalTransactions,
                averageTransaction,
                successRate,
                revenueChangePercent,
                transactionsChangePercent,
                dailyTransactions,
                hourlyActivity: hourlyActivityData,
                transactionTypeDistribution,
                balanceHistory,
            });
            setTransactions(transactions);
            setError(null);
        } catch (err) {
            setError("Failed to fetch transactions: " + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, [nwc, selectedPeriod, startDate, endDate, timeRanges]);

    // Auto-refresh effect
    useEffect(() => {
        if (autoRefresh && nwc && !isInitializing) {
            const interval = setInterval(() => {
                fetchTransactions();
            }, 60000); // Refresh every 60 seconds
            return () => clearInterval(interval);
        }
    }, [autoRefresh, nwc, isInitializing, fetchTransactions]);

    // Fetch transactions and BTC price on mount
    useEffect(() => {
        if (nwc && !isInitializing) {
            fetchTransactions();
            fetchBtcToUsd();
        }
    }, [nwc, isInitializing, fetchTransactions, fetchBtcToUsd]);

    // Redirect if wallet not connected
    useEffect(() => {
        if (!isInitializing && !nwc) {
            navigate("/");
        }
    }, [nwc, isInitializing, navigate]);

    // Filter transactions for table
    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(tx => filterType === "all" || tx.type === filterType)
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [transactions, filterType]);

    // Paginate transactions
    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * transactionsPerPage;
        const endIndex = startIndex + transactionsPerPage;
        return filteredTransactions.slice(startIndex, endIndex);
    }, [filteredTransactions, currentPage]);

    const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

    // Export data
    const exportData = useCallback(() => {
        const filename = `dashboard_transactions.${exportFormat}`;
        if (exportFormat === "csv") {
            const headers = ["ID,Type,Amount (sats),Description,Date,Payment Hash"];
            const rows = filteredTransactions.map((tx) =>
                [tx.id, tx.type, tx.amount, `"${tx.description.replace(/"/g, '""')}"`, tx.createdAt, tx.paymentHash].join(",")
            );
            const csvContent = [...headers, ...rows].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else if (exportFormat === "json") {
            const jsonContent = JSON.stringify(filteredTransactions, null, 2);
            const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else if (exportFormat === "pdf") {
            const doc = new jsPDF();
            doc.text("Transactions", 20, 20);
            filteredTransactions.forEach((tx, index) => {
                const amount = currency === "usd" && btcToUsd > 0 ? `${formatUsd(satsToUsd(tx.amount))} USD` : `${tx.amount} sats`;
                doc.text(
                    `${tx.id} | ${tx.type} | ${amount} | ${tx.description} | ${tx.createdAt}`,
                    20,
                    30 + index * 10
                );
            });
            doc.save(filename);
        }
    }, [filteredTransactions, exportFormat, currency, btcToUsd, formatUsd, satsToUsd]);

    // Format percentage
    const formatChangePercent = (percent: number): string => {
        if (percent === 0) return "0.0";
        const sign = percent > 0 ? "+" : "";
        return `${sign}${percent.toFixed(1)}`;
    };

    const getChangeColor = (percent: number): string => {
        if (percent > 0) return "text-green-400";
        if (percent < 0) return "text-red-400";
        return "text-gray-400";
    };

    // Date range validation
    const isDateRangeInvalid = selectedPeriod === "custom" && startDate && endDate && new Date(endDate) < new Date(startDate);

    interface CustomTooltipProps extends TooltipProps<number, string> {
        active?: boolean;
        payload?: Array<{ dataKey: string; value: number }>;
    }

    const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 shadow-lg">
                    <p className={`text-xs font-medium ${payload[0].dataKey === "count" ? "text-orange-400" : payload[0].dataKey === "balance" ? "text-orange-400" : "text-green-400"}`}>
                        {`${payload[0].dataKey === "count" ? "Transactions" : payload[0].dataKey === "balance" ? "Balance" : "Revenue"}: ${payload[0].value}${payload[0].dataKey === "revenue" || payload[0].dataKey === "balance" ? (currency === "usd" && btcToUsd > 0 ? " USD" : " sats") : ""}`}
                    </p>
                </div>
            );
        }
        return null;
    };

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
        <div className="min-h-screen bg-zinc-900 text-white">
            <Header isLoading={isLoading} checkBalance={checkBalance} />
            <header className="bg-zinc-900 border-b border-zinc-800">
                <div className="container mx-auto px-6 py-4 flex flex-col items-center">
                    <h1 className="text-2xl font-bold text-orange-500 mb-2">Dashboard</h1>
                    <p className="text-xs max-w-2xl text-zinc-400">
                        Real-time analytics for your wallet. ⚡
                    </p>
                </div>
            </header>
            <main className="container mx-auto px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Controls */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 max-w-full">
                        <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full sm:w-auto">
                            <select
                                value={selectedPeriod}
                                onChange={(e) => {
                                    setSelectedPeriod(e.target.value as TimePeriod);
                                    setCurrentPage(1);
                                }}
                                aria-label="Select time period"
                                className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none min-w-[120px] cursor-pointer bg-zinc-800 text-white border-zinc-700"
                            >
                                {timeRanges.map((range) => (
                                    <option key={range.value} value={range.value}>{range.label}</option>
                                ))}
                            </select>
                            {selectedPeriod === "custom" && (
                                <div className="flex flex-col gap-2 w-full sm:w-auto">
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            aria-label="Select start date"
                                            className={`border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none flex-1 sm:max-w-[150px] cursor-pointer bg-black text-white ${isDateRangeInvalid ? "border-red-500" : "border-zinc-700"}`}
                                            style={{ colorScheme: "dark" }}
                                        />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            aria-label="Select end date"
                                            className={`border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none flex-1 sm:max-w-[150px] cursor-pointer bg-black text-white ${isDateRangeInvalid ? "border-red-500" : "border-zinc-700"}`}
                                            style={{ colorScheme: "dark" }}
                                        />
                                    </div>
                                    {isDateRangeInvalid && (
                                        <p className="text-red-500 text-xs">End date must be after start date.</p>
                                    )}
                                </div>
                            )}
                            <select
                                value={filterType}
                                onChange={(e) => {
                                    setFilterType(e.target.value as "all" | "incoming" | "outgoing");
                                    setCurrentPage(1);
                                }}
                                aria-label="Select transaction type"
                                className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none min-w-[120px] cursor-pointer bg-zinc-800 text-white border-zinc-700"
                            >
                                <option value="all">All Transactions</option>
                                <option value="incoming">Incoming</option>
                                <option value="outgoing">Outgoing</option>
                            </select>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value as "sats" | "usd")}
                                aria-label="Select currency"
                                className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none min-w-[120px] cursor-pointer bg-zinc-800 text-white border-zinc-700"
                            >
                                <option value="sats">Sats</option>
                                <option value="usd">USD</option>
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={autoRefresh}
                                        onChange={(e) => setAutoRefresh(e.target.checked)}
                                        aria-label="Toggle auto-refresh"
                                        className="sr-only"
                                    />
                                    <div className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center ${autoRefresh ? 'bg-orange-500 justify-end' : 'bg-zinc-700 justify-start'}`}>
                                        <div className="w-5 h-5 rounded-full bg-white mx-0.5"></div>
                                    </div>
                                </div>
                                Auto-Refresh
                            </label>
                            <select
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value as "csv" | "json" | "pdf")}
                                aria-label="Select export format"
                                className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none min-w-[120px] cursor-pointer bg-zinc-800 text-white border-zinc-700"
                            >
                                <option value="csv">CSV</option>
                                <option value="json">JSON</option>
                                <option value="pdf">PDF</option>
                            </select>
                            <button
                                onClick={exportData}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg transition cursor-pointer bg-orange-500 text-white hover:bg-orange-600"
                            >
                                <FiDownload />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="border rounded-lg p-4 bg-zinc-900 border-zinc-800">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-300">Total Revenue</h3>
                                <FiTrendingUp className="w-4 h-4 text-gray-400" />
                            </div>
                            {isLoading ? (
                                <div className="space-y-2">
                                    <div className="h-6 rounded animate-pulse bg-zinc-800"></div>
                                    <div className="h-4 rounded animate-pulse w-24 bg-zinc-800"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold mb-1 text-white">
                                        {currency === "usd" && btcToUsd > 0 ? `${formatUsd(satsToUsd(metrics.totalRevenue))} USD` : `${metrics.totalRevenue} sats`}
                                    </div>
                                    <div className={`text-xs ${getChangeColor(metrics.revenueChangePercent)}`}>
                                        {formatChangePercent(metrics.revenueChangePercent)}% from previous period
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="border rounded-lg p-4 bg-zinc-900 border-zinc-800">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-300">Total Transactions</h3>
                                <FiActivity className="w-4 h-4 text-gray-400" />
                            </div>
                            {isLoading ? (
                                <div className="space-y-2">
                                    <div className="h-6 rounded animate-pulse bg-zinc-800"></div>
                                    <div className="h-4 rounded animate-pulse w-24 bg-zinc-800"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold mb-1 text-white">{metrics.totalTransactions}</div>
                                    <div className={`text-xs ${getChangeColor(metrics.transactionsChangePercent)}`}>
                                        {formatChangePercent(metrics.transactionsChangePercent)}% from previous period
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="border rounded-lg p-4 bg-zinc-900 border-zinc-800">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-300">Average Transaction</h3>
                                <FiZap className="w-4 h-4 text-gray-400" />
                            </div>
                            {isLoading ? (
                                <div className="space-y-2">
                                    <div className="h-6 rounded animate-pulse bg-zinc-800"></div>
                                    <div className="h-4 rounded animate-pulse w-24 bg-zinc-800"></div>
                                </div>
                            ) : (
                                <div className="text-2xl font-bold mb-1 text-white">
                                    {currency === "usd" && btcToUsd > 0 ? `${formatUsd(satsToUsd(metrics.averageTransaction))} USD` : `${metrics.averageTransaction.toFixed(0)} sats`}
                                </div>
                            )}
                        </div>
                        <div className="border rounded-lg p-4 bg-zinc-900 border-zinc-800">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-300">Success Rate</h3>
                                <FiPieChart className="w-4 h-4 text-gray-400" />
                            </div>
                            {isLoading ? (
                                <div className="space-y-2">
                                    <div className="h-6 rounded animate-pulse bg-zinc-800"></div>
                                    <div className="h-4 rounded animate-pulse w-24 bg-zinc-800"></div>
                                </div>
                            ) : (
                                <div className="text-2xl font-bold mb-1 text-white">{metrics.successRate.toFixed(1)}%</div>
                            )}
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="border rounded-lg p-4 bg-zinc-900 border-zinc-800">
                            <h3 className="text-sm font-medium mb-2 text-gray-300">Revenue Over Time</h3>
                            {isLoading ? (
                                <div className="h-48 rounded animate-pulse bg-zinc-800"></div>
                            ) : (
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={metrics.dailyTransactions}>
                                            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                        <div className="border rounded-lg p-4 bg-zinc-900 border-zinc-800">
                            <h3 className="text-sm font-medium mb-2 text-gray-300">Transactions Over Time</h3>
                            {isLoading ? (
                                <div className="h-48 rounded animate-pulse bg-zinc-800"></div>
                            ) : (
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={metrics.dailyTransactions}>
                                            <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} dot={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                        <div className="border rounded-lg p-4 bg-zinc-900 border-zinc-800">
                            <h3 className="text-sm font-medium mb-2 text-gray-300">Balance Over Time</h3>
                            {isLoading ? (
                                <div className="h-48 rounded animate-pulse bg-zinc-800"></div>
                            ) : (
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={metrics.balanceHistory}>
                                            <Line type="monotone" dataKey="balance" stroke="#f97316" strokeWidth={2} dot={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                        <div className="border rounded-lg p-4 bg-zinc-900 border-zinc-800">
                            <h3 className="text-sm font-medium mb-2 text-gray-300">Transaction Type Distribution</h3>
                            {isLoading ? (
                                <div className="h-48 rounded animate-pulse bg-zinc-800"></div>
                            ) : (
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={metrics.transactionTypeDistribution}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="#8884d8"
                                            >
                                                <Cell fill="#10b981" />
                                                <Cell fill="#f97316" />
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                        <div className="border rounded-lg p-4 bg-zinc-900 border-zinc-800">
                            <h3 className="text-sm font-medium mb-2 text-gray-300">Hourly Activity Heatmap</h3>
                            {isLoading ? (
                                <div className="h-48 rounded animate-pulse bg-zinc-800"></div>
                            ) : (
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={metrics.hourlyActivity}>
                                            <XAxis dataKey="hour" />
                                            <YAxis />
                                            <Bar dataKey="count" fill="#f97316" />
                                            <Tooltip />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transaction Table */}
                    <div className="border rounded-lg p-4 mb-6 bg-zinc-900 border-zinc-800">
                        <h3 className="text-sm font-medium mb-2 text-gray-300">Transactions</h3>
                        {isLoading ? (
                            <div className="h-48 rounded animate-pulse bg-zinc-800"></div>
                        ) : paginatedTransactions.length === 0 ? (
                            <p className="text-sm text-center text-gray-400">No transactions found.</p>
                        ) : (
                            <div className="space-y-3">
                                {paginatedTransactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        onClick={() => setSelectedTransaction(tx)}
                                        className="flex items-center justify-between p-3 border rounded-sm cursor-pointer transition duration-100 bg-zinc-900 hover:bg-zinc-800 border-zinc-900"
                                    >
                                        <div className="flex items-center gap-2">
                                            <FiZap className="text-orange-500" />
                                            <div>
                                                <p className="text-xs text-gray-400">{tx.createdAt}</p>
                                                <p className="text-sm text-gray-300">{tx.description}</p>
                                            </div>
                                        </div>
                                        <p className={`text-sm font-semibold ${tx.type === "incoming" ? "text-green-400" : "text-orange-500"}`}>
                                            {tx.type === "incoming" ? "+" : "-"} {currency === "usd" && btcToUsd > 0 ? formatUsd(satsToUsd(tx.amount)) : tx.amount} {currency === "usd" ? "USD" : "sats"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {totalPages > 1 && (
                            <div className="mt-6 flex justify-between items-center">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 rounded-lg transition ${currentPage === 1 ? "bg-zinc-700 text-zinc-400 cursor-not-allowed" : "bg-orange-500 text-white hover:bg-orange-600"}`}
                                >
                                    Previous
                                </button>
                                <span className="text-zinc-400">Page {currentPage} of {totalPages}</span>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className={`px-4 py-2 rounded-lg transition ${currentPage === totalPages ? "bg-zinc-700 text-zinc-400 cursor-not-allowed" : "bg-orange-500 text-white hover:bg-orange-600"}`}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Transaction Details Modal */}
                    {selectedTransaction && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="p-6 rounded-lg max-w-md w-full bg-zinc-800">
                                <h3 className="text-lg font-bold mb-4 text-white">Transaction Details</h3>
                                <p className="text-sm text-gray-300"><strong>ID:</strong> {selectedTransaction.id}</p>
                                <p className="text-sm text-gray-300"><strong>Type:</strong> {selectedTransaction.type}</p>
                                <p className="text-sm text-gray-300"><strong>Amount:</strong> {currency === "usd" && btcToUsd > 0 ? `${formatUsd(satsToUsd(selectedTransaction.amount))} USD` : `${selectedTransaction.amount} sats`}</p>
                                <p className="text-sm text-gray-300"><strong>Description:</strong> {selectedTransaction.description}</p>
                                <p className="text-sm text-gray-300"><strong>Date:</strong> {selectedTransaction.createdAt}</p>
                                <p className="text-sm text-gray-300"><strong>Payment Hash:</strong> {selectedTransaction.paymentHash}</p>
                                <button
                                    onClick={() => setSelectedTransaction(null)}
                                    className="mt-4 px-4 py-2 rounded-lg transition bg-orange-500 text-white hover:bg-orange-600"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 sm:mt-6 p-2 sm:p-4 border rounded-sm w-full max-w-4xl mx-auto text-red-600 flex items-center space-x-2 text-xs sm:text-sm bg-red-50 border-red-100">
                            <FiAlertCircle />
                            <span className="break-words">{error}</span>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;