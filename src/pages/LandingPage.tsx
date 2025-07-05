import { useState, useEffect } from "react";
import { FiZap, FiCopy, FiRefreshCw, FiLoader, FiCheck, FiClock, FiGlobe, FiMenu, FiSmartphone, FiX } from "react-icons/fi";
import { MdCurrencyBitcoin } from "react-icons/md";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import LogoLightningOrangeNoBg from "../assets/img/NWC-BIG-Orange-NOBG.svg";
import LogoLightningWhite from "../assets/img/NWC-Logo-Lightning-White-No-bg.svg";
import LogoLightningOrange from "../assets/img/NWC-Logo-Lightning-Orange-No-bg.svg"
import NWCWallet from "../assets/img/NWCPay-wallet.png";
import NWCLogoSquare from "../assets/img/nwc-logo-md-no-bg.svg";

import { IoQrCodeOutline } from "react-icons/io5";
import { PiPlugsConnectedBold } from "react-icons/pi";
import { GiLightningShield, GiReceiveMoney } from "react-icons/gi";

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
    //const prevIsOpenRef = useRef<boolean>(false);

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
                const [, fractional] = usdAmount.split(".");
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
        <div className="min-h-screen bg-zinc-900 text-white font-manrope">
            {/* Navigation Bar */}
            <nav className="bg-white w-full z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <img src={LogoLightningOrangeNoBg} className="h-10" alt="NWCPay Logo" />
                        </div>

                        <div className="hidden md:flex text-orange-500 items-center space-x-8 font-semibold">
                            <a href="#features" className="hover:text-orange-600 hover:underline decoration-2 underline-offset-4 transition duration-300">Features</a>
                            <a href="#faq" className="hover:text-orange-600  hover:underline decoration-2 underline-offset-4 transition duration-300">FAQ</a>
                            <a href="#contact" className="hover:text-orange-600  hover:underline decoration-2 underline-offset-4 transition duration-300">Contact</a>
                            <button
                                onClick={() => navigate("/connect")}
                                className="cursor-pointer bg-orange-500 border-2 shadow-xl hover:shadow-lg hover:scale-105 border-orange-600 text-white font-bold py-2 px-6 rounded-lg transition flex items-center"
                            >
                                <img src={LogoLightningWhite} className="h-5" alt="Lightning Icon" />Launch App
                            </button>
                        </div>
                        <button
                            className="md:hidden text-orange-500"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        >
                            {mobileMenuOpen ? (
                                <FiX className="w-6 h-6" />
                            ) : (
                                <FiMenu className="w-6 h-6" />
                            )}
                        </button>
                    </div>

                    {mobileMenuOpen && (
                        <div className="md:hidden mt-4 pb-4 space-y-4 flex flex-col items-center justify-center text-orange-500 font-bold">
                            <a href="#features" className="block hover:text-white" onClick={() => setMobileMenuOpen(false)}>Features</a>
                            <a href="#faq" className="block hover:text-white" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                            <a href="#contact" className="block hover:text-white" onClick={() => setMobileMenuOpen(false)}>Contact</a>
                            <button
                                onClick={() => navigate("/connect")}
                                className="w-full cursor-pointer bg-orange-500 border-2 hover:shadow-lg hover:scale-105 border-orange-600 text-white font-bold py-2 px-6 rounded-lg transition flex items-center justify-center text-center"
                            >
                                <img src={LogoLightningWhite} className="h-5" alt="Lightning Icon" />Launch App
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative overflow-hidden">
                <div className="absolute inset-0 bg-white z-0"></div>
                <div className="container mx-auto px-6 py-12 md:py-14 relative z-10">
                    <div className="flex flex-col items-center gap-12">
                        {/* Title and Text Content */}
                        <div className="text-center">
                            <h1 className="text-5xl text-orange-500 md:text-7xl font-black mb-6 w-full">Fast Bitcoin Payments</h1>
                            <p className="text-lg md:text-xl text-zinc-700 font-semibold mb-6 max-w-4xl mx-auto">
                                A fast and simple Bitcoin payment tool built for global Lightning adoption. ⚡
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => navigate("/connect")}
                                    className="cursor-pointer shadow-lg bg-orange-500 border-2 hover:shadow-lg hover:scale-105 border-orange-600 text-white font-black py-2 px-10 rounded-lg transition flex items-center justify-center"
                                >
                                    <img src={LogoLightningWhite} className="h-5 mr-1" alt="Lightning Icon" /> Try It Now
                                </button>
                            </div>
                        </div>

                        {/* iPhone Mockup */}
                        <div className="flex justify-center">
                            <div className="relative w-[300px] h-[600px] bg-zinc-800 rounded-[40px] border-[12px] border-zinc-900 shadow-2xl overflow-hidden">
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120px] h-[25px] bg-zinc-900 rounded-b-xl z-10"></div>
                                <div className="h-full flex flex-col bg-zinc-900">
                                    <div className="flex-1 overflow-y-auto p-4 pt-8">
                                        <div className="flex flex-col h-full">
                                            <div className="flex items-center justify-center gap-2 mb-4"></div>
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
                                                        <div className="text-start text-xs text-zinc-400 mt-2">
                                                            Description: {invoiceDescription || "No description"}
                                                        </div>
                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(invoice)}
                                                            className="cursor-pointer w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg mt-6 transition flex items-center justify-center gap-2"
                                                        >
                                                            <FiCopy /> Copy Invoice
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setInvoice(null);
                                                            setUsdAmount("");
                                                            setSatsAmount("");
                                                        }}
                                                        className="mt-4 cursor-pointer text-orange-500 text-sm hover:underline decoration-2 underline-offset-4"
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
                                                                className={`py-3 rounded-lg font-bold text-lg transition cursor-pointer ${clickedKeys.includes(key.toString()) ? "bg-orange-500 text-white scale-95" : "bg-zinc-800 hover:bg-zinc-700"
                                                                    }`}
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
                                                            className="w-full p-2 bg-zinc-800 rounded-lg border border-zinc-700 focus:ring-2 outline-none focus:ring-orange-500"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={generateInvoice}
                                                        disabled={isLoading || (!usdAmount && !satsAmount)}
                                                        className={`w-full py-3 rounded-lg font-bold text-lg transition cursor-pointer ${isLoading ? "bg-zinc-700" : "bg-orange-500 hover:bg-orange-600"
                                                            }`}
                                                    >
                                                        {isLoading ? <FiLoader className="animate-spin mx-auto" /> : "Generate Invoice"}
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

            {/* Features and Security Section */}
            <section id="features" className="py-24 bg-zinc-900">
                <div className="container mx-auto px-6 max-w-6xl">


                    {/* Highlight Features */}
                    <div className="flex flex-col md:flex-row gap-8 mb-16 font-semibold">
                        <div className="flex-1 p-6 rounded-lg text-center">
                            <FiZap className="text-orange-500 text-4xl mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Lightning-Fast Payments</h3>
                            <p className="text-zinc-300">
                                Experience instant transactions with the Lightning Network, optimized for speed and efficiency.
                            </p>
                        </div>

                        <div className="flex-1 p-6 rounded-lg text-center">
                            <FiSmartphone className="text-orange-500 text-4xl mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Use on Any Device</h3>
                            <p className="text-zinc-300">
                                Access NWCPay from any smartphone or tablet with an internet connection, making payments seamless on the go.
                            </p>
                        </div>

                        <div className="flex-1 p-6 rounded-lg text-center">
                            <FiGlobe className="text-orange-500 text-4xl mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Pay Anywhere, Anytime</h3>
                            <p className="text-zinc-300">
                                With NWCPay, accept Bitcoin payments from customers worldwide using any browser, no restrictions or borders.
                            </p>
                        </div>
                    </div>

                    {/* Feature 1: Accept Bitcoin Payments */}
                    <div className="flex-1 p-8 sm:p-20 rounded-lg flex gap-10 flex-col md:flex-row items-start bg-white text-zinc-900">
                        {/* Text Content */}
                        <div className="flex-1 w-full md:w-1/2 flex flex-col gap-4">
                            <div className="flex flex-col items-start gap-2">
                                <div className="shadow-xl bg-orange-500 rounded-md flex items-center">
                                    <MdCurrencyBitcoin className="text-white w-12 h-12" />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tigh  sm:whitespace-nowrap">Accept Bitcoin Payments in Seconds</h2>
                            </div>
                            <p className="text-lg leading-relaxed">
                                <span className="font-black">NWCPay</span> turns any modern browser into a powerful Lightning payment terminal. No custodians, no complex setups, and no software installations required.
                            </p>
                            <div className="text-zinc-700 text-md font-medium mb-4">
                                <h3 className="text-xl font-bold text-zinc-700 mb-4">How It Works</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3">
                                        <PiPlugsConnectedBold className="text-orange-500 w-6 h-6 mt-1" />
                                        <span>Connect your Lightning wallet using Nostr Wallet Connect</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <IoQrCodeOutline className="text-orange-500 w-6 h-6 mt-1" />
                                        <span>Create an invoice directly in your browser</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <GiReceiveMoney className="text-orange-500 w-6 h-6 mt-1" />
                                        <span>Receive sats instantly with full control over your funds.</span>
                                    </li>
                                </ul>
                            </div>
                            <button
                                onClick={() => navigate("/connect")}
                                className="cursor-pointer shadow-lg bg-orange-500 border-2 hover:shadow-lg hover:scale-105 border-orange-600 text-white font-black py-2 px-10 rounded-lg transition flex items-center justify-center w-full sm:w-fit"
                            >
                                <img src={LogoLightningWhite} className="h-5 mr-1" alt="Lightning Icon" /> Sign up in minutes
                            </button>
                        </div>
                        {/* iPhone Mockup with Image */}
                        <div className="flex-1 w-full md:w-1/2 flex justify-center">
                            <div className="relative w-[250px] h-[500px] bg-zinc-900 rounded-[40px] border-[10px] border-zinc-800 shadow-2xl overflow-hidden">
                                <div className="h-full w-full">
                                    <img
                                        src={NWCWallet}
                                        alt="NWCPay Bitcoin Payment Interface"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: Tailored for Merchants */}
                    <section
                        className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8"
                        aria-labelledby="merchant-feature-title"
                    >
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-col items-center lg:items-start bg-zinc-900 backdrop-blur-sm p-6 sm:p-10 lg:p-12 rounded-2xl shadow-xl border border-gray-700/50 animate-fade-in">
                                {/* Header Section */}
                                <div className="flex flex-col sm:flex-row items-center gap-2 mb-6">
                                    <MdCurrencyBitcoin
                                        className="text-orange-500 w-10 h-10 sm:w-12 sm:h-12 transform transition-transform duration-500 hover:scale-110"
                                        aria-hidden="true"
                                    />
                                    <h2
                                        id="merchant-feature-title"
                                        className="text-xl sm:text-3xl lg:text-3xl font-extrabold text-white tracking-tight text-center sm:text-start"
                                    >
                                        Empowering Everyone to Accept Bitcoin Seamlessly
                                    </h2>
                                </div>

                                {/* Description */}
                                <p className="text-gray-300 text-base sm:text-lg lg:text-xl leading-relaxed mb-8  text-center lg:text-left animate-slide-up">
                                    Designed for seamless daily use, NWCPay empowers a wide range of professionals and small businesses to accept Bitcoin effortlessly:
                                </p>

                                {/* List of Use Case Scenarios */}
                                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-300 text-base sm:text-lg">
                                    {[
                                        {
                                            title: 'Quick Counter Payments',
                                            description: 'Process Bitcoin at your shop counter with instant QR code scans.',
                                        },
                                        {
                                            title: 'Mobile Transactions',
                                            description: 'Accept payments on the go with a mobile-friendly setup.',
                                        },
                                        {
                                            title: 'Customer Invoicing',
                                            description: 'Send instant invoices for services with real-time confirmation.',
                                        },
                                        {
                                            title: 'Event Sales',
                                            description: 'Handle payments at fairs or pop-up events with ease.',
                                        },
                                        {
                                            title: 'Secure Checkouts',
                                            description: 'Ensure safe transactions with built-in encryption.',
                                        },
                                        {
                                            title: 'Daily Sales Tracking',
                                            description: 'Monitor Bitcoin payments with real-time insights.',
                                        },
                                    ].map((scenario, index) => (
                                        <li
                                            key={scenario.title}
                                            className="flex flex-col gap-2 py-3 px-4 rounded-lg hover:bg-zinc-800/40 transition-colors duration-200 animate-slide-up"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                            role="listitem"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FiCheck className="text-orange-400 w-5 h-5 flex-shrink-0" aria-hidden="true" />
                                                <span className="font-semibold">{scenario.title}</span>
                                            </div>
                                            <p className="text-gray-400 text-sm leading-relaxed sm:ml-0">{scenario.description}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>


                    </section>

                    <section
                        className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8"
                        aria-labelledby="security-title"
                    >
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-col items-center bg-zinc-900 backdrop-blur-sm p-6 sm:p-10 lg:p-12 rounded-2xl shadow-xl border border-gray-700/50 animate-fade-in">
                                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                                    <GiLightningShield
                                        className="text-orange-500 w-10 h-10 sm:w-12 sm:h-12 transform transition-transform duration-300 hover:scale-110"
                                        aria-hidden="true"
                                    />
                                    <h2
                                        id="security-title"
                                        className="text-xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight"
                                    >
                                        100% Non-Custodial Security
                                    </h2>
                                </div>
                                <p className="text-gray-300 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl text-center animate-slide-up">
                                    NWCPay prioritizes your security. Connect your Lightning wallet via Nostr Wallet Connect(NWC) for direct, secure payments.
                                    <br /> No custodians, no accounts, no servers your funds, your control.
                                </p>
                            </div>
                        </div>
                        {/* Decorative Background Element */}
                        <div className="absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-orange-500/10 rounded-full blur-3xl"></div>
                        </div>
                    </section>

                    <section
                        className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8"
                        aria-labelledby="coming-soon-title"
                    >
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-col items-center bg-zinc-900/50 backdrop-blur-sm p-6 sm:p-10 lg:p-12 rounded-2xl shadow-xl border border-gray-700/50 animate-fade-in">
                                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                                    <FiClock
                                        className="text-orange-500 w-10 h-10 sm:w-12 sm:h-12 transform transition-transform duration-300 hover:scale-110"
                                        aria-hidden="true"
                                    />
                                    <h2
                                        id="coming-soon-title"
                                        className="text-xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight"
                                    >
                                        Exciting Features Coming Soon
                                    </h2>
                                </div>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-300 text-base sm:text-lg">
                                    {[
                                        { title: 'Mobile App', description: 'Manage payments on iOS and Android devices.' },
                                        { title: 'Android POS Support', description: 'Integrate with POS systems for seamless checkouts.' },
                                        { title: 'Fiat Conversions', description: 'Convert Bitcoin to local currency instantly.' },
                                    ].map((feature, index) => (
                                        <li
                                            key={feature.title}
                                            className="flex flex-col gap-2 py-3 px-4 rounded-lg hover:bg-zinc-800/50 transition-colors duration-200 animate-slide-up"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                            role="listitem"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FiCheck className="text-orange-500 w-5 h-5 flex-shrink-0" aria-hidden="true" />
                                                <span className="font-semibold">{feature.title}</span>
                                            </div>
                                            <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        {/* Decorative Background Element */}
                        <div className="absolute inset-0 -z-10 overflow-hidden">
                            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-orange-500/10 rounded-full blur-3xl"></div>
                        </div>
                    </section>
                </div>
            </section>



            {/* Open Source Section */}
            {/* <section id="opensource" className="py-20 bg-zinc-800/30">
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
            </section> */}

            <section id="faq" className="py-24 bg-zinc-900">
                <div className="container mx-auto px-6 max-w-2xl">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
                        <p className="text-lg text-zinc-300 mt-4 max-w-3xl mx-auto">
                            Everything you need to know about NWCPay and how it works with Bitcoin and the Lightning Network.
                        </p>
                    </div>
                    <div className="space-y-6">
                        {[
                            {
                                question: "What is NWCPay?",
                                answer:
                                    "NWCPay is an open-source, non-custodial Bitcoin payment tool that allows anyone to accept payments via the Lightning Network directly in their browser. It’s fast, secure, and requires no complex setups.",
                            },
                            {
                                question: "How does NWCPay ensure security?",
                                answer:
                                    "NWCPay is 100% non-custodial, meaning you retain full control of your funds. It uses Nostr Wallet Connect (NWC) to securely connect to your Lightning wallet, with no intermediaries or servers holding your Bitcoin.",
                            },
                            {
                                question: "Do I need to install any software to use NWCPay?",
                                answer:
                                    "No, NWCPay works directly in any modern web browser. Simply connect your Lightning wallet using Nostr Wallet Connect, and you’re ready to generate invoices and accept payments.",
                            },
                            {
                                question: "What is the Lightning Network?",
                                answer:
                                    "The Lightning Network is a second-layer scaling solution for Bitcoin that enables fast, low-cost transactions. It allows instant payments while maintaining Bitcoin’s security and decentralization.",
                            },
                            {
                                question: "Can I use NWCPay on my mobile device?",
                                answer:
                                    "Yes, NWCPay is fully compatible with mobile browsers, making it easy to accept Bitcoin payments on the go. A dedicated mobile app is also in development for an even smoother experience.",
                            },
                            {
                                question: "Is NWCPay free to use?",
                                answer:
                                    "Yes, NWCPay is completely free and open-source. There are no fees or subscriptions required, and you can even contribute to the project on GitHub.",
                            },
                        ].map((faq, index) => (
                            <div
                                key={index}
                                className="bg-zinc-800/50 rounded-lg p-6 hover:bg-zinc-800/70 transition-colors duration-200"
                            >
                                <details className="group">
                                    <summary className="flex items-center justify-between cursor-pointer">
                                        <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                                        <span className="text-orange-500 group-open:rotate-180 transition-transform">
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </span>
                                    </summary>
                                    <p className="mt-4 text-zinc-300 text-base leading-relaxed">{faq.answer}</p>
                                </details>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6 text-center flex flex-col items-center">
                    <div className="flex items-center flex-col">
                        <img src={LogoLightningOrange} className="h-20" alt="NWCPay Logo" />
                        <h2 className="text-4xl font-black mb-6 text-orange-500">Try NWCPay Now</h2>
                    </div>
                    <p className="text-xl text-zinc-700 font-medium mb-8 max-w-2xl mx-auto">
                        Connect your Nostr Wallet Connect-compatible wallet and generate your first Lightning invoice.
                        <br /> Start accepting Bitcoin in seconds, anywhere in the world.
                    </p>
                    <button
                        onClick={() => navigate("/connect")}
                        className="cursor-pointer shadow-lg bg-orange-500 border-2 hover:shadow-lg hover:scale-105 border-orange-600 text-white font-black py-2 px-10 rounded-lg transition flex items-center justify-center w-fit"
                    >
                        <img src={LogoLightningWhite} className="h-5 mr-1" alt="Lightning Icon" />Get Started
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="bg-zinc-800/50 py-16 border-t border-zinc-700">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Logo and Description */}
                        <div className="flex flex-col items-center md:items-start">
                            <div className="flex items-center gap-2 mb-4">
                                <img src={NWCLogoSquare} alt="NWCPay Logo" className="h-10 w-auto" />
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed text-center md:text-left">
                                A fast, secure, and open-source Bitcoin payment tool built for global Lightning Network adoption.
                            </p>
                        </div>

                        {/* About Links */}
                        <div className="flex flex-col items-center md:items-start">
                            <h3 className="text-white text-lg font-semibold mb-4">About</h3>
                            <ul className="space-y-2 text-zinc-300 text-sm">
                                <li>
                                    <a href="#features" className="hover:text-orange-500 transition duration-200">Features</a>
                                </li>
                                <li>
                                    <a href="#security" className="hover:text-orange-500 transition duration-200">Security</a>
                                </li>
                                <li>
                                    <a href="#faq" className="hover:text-orange-500 transition duration-200">FAQ</a>
                                </li>
                            </ul>
                        </div>

                        {/* Resources Links */}
                        <div className="flex flex-col items-center md:items-start">
                            <h3 className="text-white text-lg font-semibold mb-4">Resources</h3>
                            <ul className="space-y-2 text-zinc-300 text-sm">
                                <li>
                                    <a href="#" className="hover:text-orange-500 transition duration-200">Documentation</a>
                                </li>
                                <li>
                                    <a href="https://github.com/nwcpay" className="hover:text-orange-500 transition duration-200">GitHub</a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-orange-500 transition duration-200">Privacy Policy</a>
                                </li>
                            </ul>
                        </div>

                        {/* Connect Links */}
                        <div className="flex flex-col items-center md:items-start">
                            <h3 className="text-white text-lg font-semibold mb-4">Connect</h3>
                            <ul className="space-y-2 text-zinc-300 text-sm">
                                <li>
                                    <a
                                        href="https://x.com/nwcpay"
                                        className="flex items-center gap-2 hover:text-orange-500 transition duration-200"
                                        aria-label="Follow NWCPay on X"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                        Follow on X
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="flex items-center gap-2 hover:text-orange-500 transition duration-200"
                                        aria-label="Join NWCPay on Discord"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.078.037c-.21.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.249.077.077 0 0 0-.078-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.029.019C.533 9.045-.319 13.579.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.042-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.134 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.134 13.392 13.392 0 0 1-1.873.892.077.077 0 0 0-.041.106c.36.698.772 1.362 1.225 1.994a.076.076 0 0 0 .084.028 19.831 19.831 0 0 0 6.002-3.03.077.077 0 0 0 .032-.057c.5-5.177-.838-9.673-3.548-13.66a.061.061 0 0 0-.028-.019zM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.42 2.157-2.42 1.202 0 2.176 1.087 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.974 0c-1.182 0-2.157-1.086-2.157-2.419 0-1.333.955-2.42 2.157-2.42 1.202 0 2.177 1.087 2.157 2.42 0 1.333-.955 2.419-2.157 2.419z" />
                                        </svg>
                                        Join on Discord
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="mailto:nwcpay@proton.me"
                                        className="flex items-center gap-2 hover:text-orange-500 transition duration-200"
                                        aria-label="Contact NWCPay Support"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                        </svg>
                                        Contact Support
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="mt-12 border-t border-zinc-700 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <div className="text-zinc-400 text-sm text-center md:text-left">
                            © {new Date().getFullYear()} NWCPay. All rights reserved. Open-source Bitcoin project.
                        </div>
                        <div className="flex gap-6 mt-4 md:mt-0">
                            <a
                                href="https://github.com/nwcpay"
                                className="text-zinc-300 hover:text-orange-500 transition duration-200"
                                aria-label="NWCPay on GitHub"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                </svg>
                            </a>
                            <a
                                href="https://x.com/nwcpay"
                                className="text-zinc-300 hover:text-orange-500 transition duration-200"
                                aria-label="NWCPay on X"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;