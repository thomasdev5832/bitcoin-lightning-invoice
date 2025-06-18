import { useEffect, useState } from "react";
import { webln } from "@getalby/sdk";
import { FiTrendingUp, FiActivity, FiChevronDown, FiZap } from "react-icons/fi";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";

interface MiniDashboardProps {
    nwc: webln.NostrWebLNProvider | null;
    btcToUsd: number;
}

interface DashboardMetrics {
    totalRevenue: number; // em sats
    totalTransactions: number;
    revenueChangePercent: number;
    transactionsChangePercent: number;
    dailyTransactions: Array<{ date: string; count: number; revenue: number }>;
}

type TimePeriod = "today" | "week" | "30days" | "60days";

interface TimeRange {
    label: string;
    value: TimePeriod;
    getDays: () => number;
}

const MiniDashboard = ({ nwc, btcToUsd }: MiniDashboardProps) => {
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalRevenue: 0,
        totalTransactions: 0,
        revenueChangePercent: 0,
        transactionsChangePercent: 0,
        dailyTransactions: [],
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("30days");

    const timeRanges: TimeRange[] = [
        { label: "Today", value: "today", getDays: () => 1 },
        { label: "Last 7 days", value: "week", getDays: () => 7 },
        { label: "Last 30 days", value: "30days", getDays: () => 30 },
        { label: "Last 60 days", value: "60days", getDays: () => 60 },
    ];

    // Conversion functions
    const satsToUsd = (sats: number): number => (sats / 100_000_000) * btcToUsd;
    const formatUsd = (usd: number): string => usd.toFixed(2);

    const getDaysForPeriod = (period: TimePeriod): number => {
        const range = timeRanges.find(r => r.value === period);
        return range ? range.getDays() : 30;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generateDailyData = (transactions: any[], currentPeriodStart: number): Array<{ date: string; count: number; revenue: number }> => {
        const dailyData: { [key: string]: { count: number; revenue: number } } = {};
        const currentPeriodDays = getDaysForPeriod(selectedPeriod);

        // Initialize all days with zero values
        for (let i = 0; i < currentPeriodDays; i++) {
            const date = new Date((currentPeriodStart + (i * 24 * 60 * 60)) * 1000);
            const dateKey = selectedPeriod === "today"
                ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            dailyData[dateKey] = { count: 0, revenue: 0 };
        }

        // Process transactions
        transactions.forEach(tx => {
            const txTimestamp = tx.settled_at || tx.created_at || 0;
            if (txTimestamp >= currentPeriodStart) {
                const date = new Date(txTimestamp * 1000);
                const dateKey = selectedPeriod === "today"
                    ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                if (!dailyData[dateKey]) {
                    dailyData[dateKey] = { count: 0, revenue: 0 };
                }

                dailyData[dateKey].count += 1;
                if (tx.type === "incoming") {
                    dailyData[dateKey].revenue += tx.amount;
                }
            }
        });

        return Object.entries(dailyData)
            .sort(([a], [b]) => {
                // Sort by date
                if (selectedPeriod === "today") {
                    return a.localeCompare(b);
                }
                return new Date(a).getTime() - new Date(b).getTime();
            })
            .map(([date, data]) => ({
                date,
                count: data.count,
                revenue: data.revenue
            }));
    };

    const calculateMetrics = async () => {
        if (!nwc) return;

        try {
            setIsLoading(true);
            const response = await nwc.listTransactions({});

            if (!response.transactions || response.transactions.length === 0) {
                setMetrics({
                    totalRevenue: 0,
                    totalTransactions: 0,
                    revenueChangePercent: 0,
                    transactionsChangePercent: 0,
                    dailyTransactions: [],
                });
                return;
            }

            const now = Date.now() / 1000; // Current timestamp in seconds
            const currentPeriodDays = getDaysForPeriod(selectedPeriod);
            const currentPeriodStart = now - (currentPeriodDays * 24 * 60 * 60);
            const previousPeriodStart = now - (currentPeriodDays * 2 * 24 * 60 * 60);

            // Filter transactions for current period
            const currentPeriodTransactions = response.transactions.filter((tx) => {
                const txTimestamp = tx.settled_at || tx.created_at || 0;
                return txTimestamp >= currentPeriodStart;
            });

            const currentPeriodIncoming = currentPeriodTransactions.filter(tx => tx.type === "incoming");

            // Filter transactions for previous period (for comparison)
            const previousPeriodTransactions = response.transactions.filter((tx) => {
                const txTimestamp = tx.settled_at || tx.created_at || 0;
                return txTimestamp >= previousPeriodStart && txTimestamp < currentPeriodStart;
            });

            const previousPeriodIncoming = previousPeriodTransactions.filter(tx => tx.type === "incoming");

            // Calculate totals for current period
            const totalRevenue = currentPeriodIncoming.reduce((sum, tx) => sum + tx.amount, 0);
            const totalTransactions = currentPeriodTransactions.length;

            // Calculate totals for previous period
            const previousRevenue = previousPeriodIncoming.reduce((sum, tx) => sum + tx.amount, 0);
            const previousTransactions = previousPeriodTransactions.length;

            // Calculate percentage changes
            const revenueChangePercent = previousRevenue > 0
                ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
                : totalRevenue > 0 ? 100 : 0;

            const transactionsChangePercent = previousTransactions > 0
                ? ((totalTransactions - previousTransactions) / previousTransactions) * 100
                : totalTransactions > 0 ? 100 : 0;

            // Generate daily data for charts
            const dailyTransactions = generateDailyData(currentPeriodTransactions, currentPeriodStart);

            setMetrics({
                totalRevenue,
                totalTransactions,
                revenueChangePercent,
                transactionsChangePercent,
                dailyTransactions,
            });

        } catch (error) {
            console.error("Error calculating dashboard metrics:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (nwc) {
            calculateMetrics();
        }
    }, [nwc, selectedPeriod]);

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

    const getCurrentPeriodLabel = (): string => {
        const range = timeRanges.find(r => r.value === selectedPeriod);
        return range ? range.label.toLowerCase() : "period";
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 shadow-lg">
                    <p className="text-gray-300 text-xs">{`${label}`}</p>
                    <p className="text-orange-400 text-xs font-medium">
                        {`${payload[0].dataKey === 'count' ? 'Transactions' : 'Revenue'}: ${payload[0].value}${payload[0].dataKey === 'revenue' ? ' sats' : ''}`}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 justify-between">
                <div className="flex flex-row items-center gap-1">
                    <FiZap className="text-orange-500" />
                    <h2 className="text-zinc-400 font-semibold">Mini Dashboard</h2>
                </div>
                <div className="relative">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
                        className="appearance-none bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 pr-8 text-gray-300 text-sm font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 hover:border-zinc-600 transition-colors min-w-[140px]"
                        style={{
                            backgroundImage: 'none'
                        }}
                    >
                        {timeRanges.map((range) => (
                            <option
                                key={range.value}
                                value={range.value}
                                className="bg-zinc-900 text-gray-300 py-2 px-3 hover:bg-zinc-700"
                            >
                                {range.label}
                            </option>
                        ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
            </div>

            <div className="flex flex-row gap-4 w-full justify-between">
                {/* Total Revenue Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 w-full">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-300 text-sm font-medium">Total Revenue</h3>
                        <FiTrendingUp className="text-gray-400 w-4 h-4" />
                    </div>

                    {isLoading ? (
                        <div className="space-y-2">
                            <div className="h-6 bg-zinc-800 rounded animate-pulse"></div>
                            <div className="h-4 bg-zinc-800 rounded animate-pulse w-24"></div>
                            <div className="h-12 bg-zinc-800 rounded animate-pulse mt-3"></div>
                        </div>
                    ) : (
                        <div>
                            <div className="text-2xl font-bold text-white mb-1">
                                {btcToUsd > 0 ? `${formatUsd(satsToUsd(metrics.totalRevenue))} USD` : `${metrics.totalRevenue} sats`}
                            </div>
                            <div className={`text-xs ${getChangeColor(metrics.revenueChangePercent)} mb-3`}>
                                {formatChangePercent(metrics.revenueChangePercent)}% from previous {getCurrentPeriodLabel()}
                            </div>

                            {/* Mini Chart for Revenue */}
                            <div className="h-12 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metrics.dailyTransactions}>
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 3, fill: "#f97316" }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Total Transactions Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 w-full">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-gray-300 text-sm font-medium">Total Transactions</h3>
                        <FiActivity className="text-gray-400 w-4 h-4" />
                    </div>

                    {isLoading ? (
                        <div className="space-y-2">
                            <div className="h-6 bg-zinc-800 rounded animate-pulse"></div>
                            <div className="h-4 bg-zinc-800 rounded animate-pulse w-24"></div>
                            <div className="h-12 bg-zinc-800 rounded animate-pulse mt-3"></div>
                        </div>
                    ) : (
                        <div>
                            <div className="text-2xl font-bold text-white mb-1">
                                {metrics.totalTransactions}
                            </div>
                            <div className={`text-xs ${getChangeColor(metrics.transactionsChangePercent)} mb-3`}>
                                {formatChangePercent(metrics.transactionsChangePercent)}% from previous {getCurrentPeriodLabel()}
                            </div>

                            {/* Mini Chart for Transactions */}
                            <div className="h-12 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metrics.dailyTransactions}>
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#f97316"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 3, fill: "#10b981" }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MiniDashboard;