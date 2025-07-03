import { useState, useEffect, useRef } from "react";
import { FiZap, FiCopy, FiRefreshCw, FiLoader, FiCheck, FiDollarSign, FiClock, FiShield, FiGlobe, FiGithub, FiMenu } from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import LogoLightningWhite from "../assets/img/NWC-BIG-NOBG.svg";
import LogoLightningWhiteNoBg from "../assets/img/NWC-Logo-Lightning-White-No-bg.svg";

const LandingPage = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Invoice generator state
    const [invoice, setInvoice] = useState<string | null>(null);
    const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
    const [invoiceDescription, setInvoiceDescription] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [inputMode, setInputMode] = useState<"usd" | "sats">("usd");
    const [usdAmount, setUsdAmount] = useState<string>("");
    const [satsAmount, setSatsAmount] = useState<string>("");
    const [satsPerUsd, setSatsPerUsd] = useState<number>(2800);
    const [clickedKeys, setClickedKeys] = useState<string[]>([]);
    const prevIsOpenRef = useRef<boolean>(false);

    // Fetch Bitcoin USD price
    useEffect(() => {
        async function fetchRate() {
            try {
                const res = await fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
                );
                const data = await res.json();
                if (data.bitcoin?.usd) {
                    setSatsPerUsd(100_000_000 / data.bitcoin.usd);
                }
            } catch (e) {
                console.error("Failed to fetch BTC price", e);
            }
        }
        fetchRate();
    }, []);

    // Sync amounts between USD and sats
    useEffect(() => {
        if (inputMode === "usd") {
            const parsed = parseFloat(usdAmount);
            if (!isNaN(parsed)) {
                setSatsAmount(Math.round(parsed * satsPerUsd).toString());
            } else {
                setSatsAmount("0");
            }
        } else {
            const parsed = parseInt(satsAmount, 10);
            if (!isNaN(parsed)) {
                setUsdAmount((parsed / satsPerUsd).toFixed(2));
            } else {
                setUsdAmount("0.00");
            }
        }
    }, [usdAmount, satsAmount, satsPerUsd, inputMode]);

    // Handle keypad input
    const handleKeyPress = (key: string) => {
        setClickedKeys((prev) => [...prev, key]);
        setTimeout(() => setClickedKeys((prev) => prev.filter((k) => k !== key)), 100);

        if (inputMode === "usd") {
            if (key === "←") {
                setUsdAmount((prev) => prev.slice(0, -1));
            } else if (key === ".") {
                if (!usdAmount.includes(".")) {
                    setUsdAmount((prev) => (prev === "" ? "0." : prev + "."));
                }
            } else if (/^\d$/.test(key)) {
                const [whole, fractional] = usdAmount.split(".");
                if (!fractional || fractional.length < 2) {
                    setUsdAmount((prev) => prev + key);
                }
            }
        } else {
            if (key === "←") {
                setSatsAmount((prev) => prev.slice(0, -1));
            } else if (/^\d$/.test(key)) {
                setSatsAmount((prev) => prev + key);
            }
        }
    };

    // Generate invoice
    const generateInvoice = async () => {
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            const amount = inputMode === "usd" ? Math.round(parseFloat(usdAmount) * satsPerUsd) : parseInt(satsAmount, 10);
            setInvoiceAmount(amount);
            setInvoice(`lnbc${amount}1p${Math.random().toString(36).substring(2, 10)}`);
        } catch (error) {
            console.error("Error generating invoice", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleInputMode = () => {
        setInputMode((prev) => (prev === "usd" ? "sats" : "usd"));
    };

    return (
        <div className="min-h-screen bg-zinc-900 text-white">
            {/* Navigation Bar */}
            <nav className="bg-orange-500 fixed w-full z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <img src={LogoLightningWhite} className="h-8" alt="NWCPay Logo" />
                        </div>

                        <div className="hidden md:flex items-center space-x-8 font-semibold">
                            <a href="#features" className="hover:text-white hover:underline transition">Features</a>
                            <a href="#security" className="hover:text-white hover:underline transition">Security</a>
                            <a href="#opensource" className="hover:text-white hover:underline transition">Open Source</a>
                            <button
                                onClick={() => navigate("/app")}
                                className="cursor-pointer bg-orange-600 border-2 hover:shadow-lg border-orange-600 text-white font-bold py-2 px-6 rounded-lg transition flex items-center"
                            >
                                <img src={LogoLightningWhiteNoBg} className="h-5" alt="Lightning Icon" /> App
                            </button>
                        </div>

                        <button
                            className="md:hidden text-white"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <FiMenu className="w-6 h-6" />
                        </button>
                    </div>

                    {mobileMenuOpen && (
                        <div className="md:hidden mt-4 pb-4 space-y-4">
                            <a href="#features" className="block hover:text-white" onClick={() => setMobileMenuOpen(false)}>Features</a>
                            <a href="#security" className="block hover:text-white" onClick={() => setMobileMenuOpen(false)}>Security</a>
                            <a href="#opensource" className="block hover:text-white" onClick={() => setMobileMenuOpen(false)}>Open Source</a>
                            <button
                                onClick={() => navigate("/app")}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition flex items-center justify-center gap-2"
                            >
                                <FiZap /> Access App
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative overflow-hidden pt-24">
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500 to-orange-600 z-0"></div>
                <div className="container mx-auto px-6 py-12 md:py-24 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="lg:w-1/2">
                            <h1 className="text-4xl md:text-6xl font-black mb-6">Fast Bitcoin Payments</h1>
                            <p className="text-lg text-zinc-100 font-semibold mb-8">
                                A fast and simple, Nostr-powered Bitcoin payment tool built for global Lightning adoption. ⚡
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => navigate("/app")}
                                    className="bg-white hover:bg-orange-600 text-orange-500 hover:text-white font-bold py-4 px-8 rounded-lg text-lg transition flex items-center gap-2"
                                >
                                    <FiZap /> Try it Now
                                </button>
                                <button className="border border-orange-500 text-orange-500 hover:bg-orange-500/10 font-bold py-4 px-8 rounded-lg text-lg transition flex items-center gap-2">
                                    <FiGithub /> View Code
                                </button>
                            </div>
                        </div>

                        {/* iPhone Mockup */}
                        <div className="lg:w-1/2 flex justify-center">
                            <div className="relative w-[300px] h-[600px] bg-zinc-800 rounded-[40px] border-[12px] border-zinc-900 shadow-2xl overflow-hidden">
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120px] h-[25px] bg-zinc-900 rounded-b-xl z-10"></div>

                                <div className="h-full flex flex-col bg-zinc-900">


                                    <div className="flex-1 overflow-y-auto p-4 pt-8 ">
                                        <div className="flex flex-col h-full">
                                            <div className="flex items-center justify-center gap-2 mb-4">

                                            </div>

                                            {invoice ? (
                                                <div className="flex-1 flex flex-col items-center justify-center">
                                                    <div className="bg-zinc-800 rounded-lg p-6 text-center w-full max-w-xs">
                                                        <div className="text-zinc-400 mb-2">Invoice Generated</div>
                                                        <div className="text-3xl font-bold mb-1">{invoiceAmount.toLocaleString()} sats</div>
                                                        <div className="text-zinc-400 text-sm mb-6">≈ ${(invoiceAmount / satsPerUsd).toFixed(2)} USD</div>

                                                        <div className="mt-4 p-4 bg-white rounded-lg mx-auto w-[200px] h-[200px] flex items-center justify-center">
                                                            <QRCodeSVG
                                                                value={invoice}
                                                                size={180}
                                                                level="M"
                                                                bgColor="#18181b"
                                                                fgColor="#ffffff"
                                                            />
                                                        </div>

                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(invoice)}
                                                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg mt-6 transition flex items-center justify-center gap-2"
                                                        >
                                                            <FiCopy /> Copy Invoice
                                                        </button>

                                                        <div className="text-center text-xs text-zinc-400 mt-2">
                                                            {invoiceDescription || "No description"}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setInvoice(null);
                                                            setUsdAmount("");
                                                            setSatsAmount("");
                                                        }}
                                                        className="mt-4 text-orange-500 text-sm hover:underline"
                                                    >
                                                        Create New Invoice
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex flex-col items-center text-center mb-4 gap-2">
                                                        <h3 className="text-lg font-semibold">Enter Amount</h3>
                                                        <div className="text-4xl font-mono">
                                                            {inputMode === "usd" ? `$${usdAmount || "0"}` : `${satsAmount || "0"} sats`}
                                                        </div>
                                                        <div className="flex flex-row items-center justify-around gap-2">
                                                            <button
                                                                onClick={toggleInputMode}
                                                                className="text-orange-500 text-sm flex items-center gap-1"
                                                            >
                                                                <FiRefreshCw size={14} />
                                                            </button>
                                                            <div className="text-zinc-400 text-sm">
                                                                ≈ {inputMode === "usd" ? `${satsAmount || "0"} sats` : `$${usdAmount || "0"}`}
                                                            </div>
                                                        </div>
                                                    </div>


                                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "←"].map((key) => (
                                                            <button
                                                                key={key}
                                                                onClick={() => handleKeyPress(key.toString())}
                                                                className={`py-3 rounded-lg font-bold text-lg transition ${clickedKeys.includes(key.toString())
                                                                    ? "bg-orange-500 text-white scale-95"
                                                                    : "bg-zinc-800 hover:bg-zinc-700"}`}
                                                                disabled={key === "." && inputMode === "sats"}
                                                            >
                                                                {key}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="mb-4">
                                                        <label className="block text-sm text-zinc-400 mb-1">Description (optional)</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Coffee"
                                                            onChange={(e) => setInvoiceDescription(e.target.value)}
                                                            className="w-full p-2 bg-zinc-800 rounded-lg border border-zinc-700 focus:ring-2 focus:ring-orange-500"
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={generateInvoice}
                                                        disabled={isLoading || (!usdAmount && !satsAmount)}
                                                        className={`w-full py-3 rounded-lg font-bold text-lg transition ${isLoading
                                                            ? "bg-zinc-700"
                                                            : "bg-orange-500 hover:bg-orange-600"}`}
                                                    >
                                                        {isLoading ? (
                                                            <FiLoader className="animate-spin mx-auto" />
                                                        ) : (
                                                            "Generate Invoice"
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pb-2 flex justify-center">
                                        <div className="w-[100px] h-1 bg-zinc-700 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="py-20 bg-zinc-800/30">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <FiDollarSign className="text-orange-500 text-2xl" />
                                <h2 className="text-2xl font-bold">Accept Bitcoin Payments with Ease</h2>
                            </div>
                            <p className="text-zinc-300 mb-6">
                                NWCPay turns any browser into a Lightning payment terminal. No custodians. No installations. No complexity.
                            </p>
                            <p className="text-zinc-300">
                                Just connect your Lightning wallet via NWC (like Alby), generate an invoice, and receive sats instantly.
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <FiGlobe className="text-orange-500 text-2xl" />
                                <h2 className="text-2xl font-bold">Built for Merchants and Service Providers</h2>
                            </div>
                            <p className="text-zinc-300 mb-4">Designed for everyday use by:</p>
                            <ul className="grid grid-cols-2 gap-2 text-zinc-300">
                                <li className="flex items-center gap-2"><FiCheck className="text-orange-500" /> Retail stores</li>
                                <li className="flex items-center gap-2"><FiCheck className="text-orange-500" /> Freelancers</li>
                                <li className="flex items-center gap-2"><FiCheck className="text-orange-500" /> Restaurants</li>
                                <li className="flex items-center gap-2"><FiCheck className="text-orange-500" /> Cafés</li>
                                <li className="flex items-center gap-2"><FiCheck className="text-orange-500" /> Barbershops</li>
                                <li className="flex items-center gap-2"><FiCheck className="text-orange-500" /> Street vendors</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Security Section */}
            <section id="security" className="py-20">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <FiShield className="text-orange-500 text-2xl" />
                                <h2 className="text-2xl font-bold">100% Non-Custodial</h2>
                            </div>
                            <p className="text-zinc-300">
                                Secure by design. Connect a Lightning wallet via Nostr Wallet Connect (e.g. Alby) and receive payments directly.
                                No custodians, no account needed, and no servers holding your funds.
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <FiClock className="text-orange-500 text-2xl" />
                                <h2 className="text-2xl font-bold">Coming Soon</h2>
                            </div>
                            <ul className="text-zinc-300 space-y-2">
                                <li className="flex items-center gap-2"><FiCheck className="text-orange-500" /> Mobile app</li>
                                <li className="flex items-center gap-2"><FiCheck className="text-orange-500" /> Android POS support</li>
                                <li className="flex items-center gap-2"><FiCheck className="text-orange-500" /> Fiat conversions</li>
                                <li className="flex items-center gap-2"><FiCheck className="text-orange-500" /> Offline PWA</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Open Source Section */}
            <section id="opensource" className="py-20 bg-zinc-800/30">
                <div className="container mx-auto px-6 text-center max-w-3xl">
                    <div className="flex justify-center mb-6">
                        <FiGithub className="text-orange-500 text-4xl" />
                    </div>
                    <h2 className="text-3xl font-bold mb-6">Open Source and Free</h2>
                    <p className="text-xl text-zinc-300 mb-8">
                        NWCPay is an open-source project focused on usability, sovereignty, and global accessibility.
                        You can use it, fork it, or contribute to it — no sign-up, no fees, no middlemen.
                    </p>
                    <button className="border border-orange-500 text-orange-500 hover:bg-orange-500/10 font-bold py-3 px-8 rounded-lg transition inline-flex items-center gap-2">
                        <FiGithub /> Star on GitHub
                    </button>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 bg-gradient-to-r from-orange-500/10 to-zinc-900/80">
                <div className="container mx-auto px-6 text-center">
                    <FiZap className="text-orange-500 text-4xl mx-auto mb-4" />
                    <h2 className="text-4xl font-bold mb-6">Try NWCPay Now</h2>
                    <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
                        Connect your Nostr Wallet Connect-compatible wallet and generate your first Lightning invoice.
                        Start accepting Bitcoin in seconds — anywhere in the world.
                    </p>
                    <button
                        onClick={() => navigate("/app")}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-12 rounded-lg text-lg transition flex items-center gap-2 mx-auto"
                    >
                        <FiZap /> Get Started
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-zinc-800/50 py-12 border-t border-zinc-700">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center gap-2 mb-4 md:mb-0">
                            <FiZap className="text-orange-500 text-2xl" />
                            <span className="font-bold text-xl">NWCPay</span>
                        </div>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-orange-500 transition">Docs</a>
                            <a href="#" className="hover:text-orange-500 transition">GitHub</a>
                            <a href="#" className="hover:text-orange-500 transition">Privacy</a>
                        </div>
                    </div>
                    <div className="mt-8 text-center text-zinc-400 text-sm">
                        © {new Date().getFullYear()} NWCPay. Open source Bitcoin project.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;