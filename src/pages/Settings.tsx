import React, { useState, useCallback } from "react";
import { useWallet } from "../contexts/ContextWallet";
import { useNavigate } from "react-router-dom";
import { FiLoader, FiAlertCircle } from "react-icons/fi";
import Header from "../components/Header";

const Settings: React.FC = () => {
    const { nwc, isInitializing, disconnectWallet } = useWallet();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showDisconnectModal, setShowDisconnectModal] = useState<boolean>(false);

    // Handle wallet disconnection
    const handleDisconnect = useCallback(async () => {
        try {
            setIsLoading(true);
            await disconnectWallet();
            navigate("/");
        } catch (err) {
            setError("Failed to disconnect wallet: " + (err as Error).message);
        } finally {
            setIsLoading(false);
            setShowDisconnectModal(false);
        }
    }, [disconnectWallet, navigate]);

    // Show modal when Disconnect Wallet is clicked
    const handleOpenDisconnectModal = useCallback(() => {
        setShowDisconnectModal(true);
    }, []);

    // Close modal without disconnecting
    const handleCloseModal = useCallback(() => {
        setShowDisconnectModal(false);
    }, []);

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
                <div className="text-center">
                    <FiLoader className="text-orange-500 animate-spin text-4xl mx-auto mb-4" />
                    <p>Loading wallet...</p>
                </div>
            </div>
        );
    }

    if (!nwc) {
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-900 text-white">
            <Header isLoading={isLoading} />
            <header className="bg-zinc-900 border-b border-zinc-800">
                <div className="container mx-auto px-6 py-4 flex flex-col items-center">
                    <h1 className="text-2xl font-bold text-orange-500 mb-2">Settings</h1>
                </div>
            </header>
            <main className="container mx-auto px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Wallet Actions */}
                    <section className="border rounded-lg p-6 bg-zinc-900 border-zinc-800 w-fit">
                        <h2 className="text-lg font-semibold mb-4 text-gray-300">Wallet Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-400">Connection Status</p>
                                <p className="text-sm text-white">
                                    {nwc ? (
                                        <div className="flex flex-row items-center justify-start gap-1">
                                            <p className="text-orange-500 font-bold text-[10px] sm:text-xs uppercase">
                                                Wallet Connected
                                            </p>
                                        </div>
                                    ) : (
                                        "No wallet connected"
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={handleOpenDisconnectModal}
                                disabled={isLoading}
                                className={`px-4 py-2 rounded-lg transition cursor-pointer ${isLoading
                                    ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                                    : "bg-red-500 text-white hover:bg-red-600"
                                    }`}
                            >
                                Disconnect Wallet
                            </button>
                        </div>
                    </section>

                    {/* Disconnect Confirmation Modal */}
                    {showDisconnectModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <FiAlertCircle className="text-red-500 text-xl" />
                                    <h3 className="text-lg font-semibold text-white">Confirm Disconnect</h3>
                                </div>
                                <p className="text-sm text-gray-300 mb-6">
                                    Are you sure you want to disconnect your wallet?<br /> This will end your current session.
                                </p>
                                <div className="flex justify-end gap-4 ">
                                    <button
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 rounded-lg bg-zinc-600 text-white hover:bg-zinc-700 transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDisconnect}
                                        disabled={isLoading}
                                        className={`px-4 py-2 rounded-lg transition cursor-pointer ${isLoading
                                            ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                                            : "bg-red-500 text-white hover:bg-red-600"
                                            }`}
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 border rounded-sm w-full max-w-4xl mx-auto text-red-600 flex items-center space-x-2 text-sm bg-red-50 border-red-100">
                            <FiAlertCircle />
                            <span className="break-words">{error}</span>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Settings;