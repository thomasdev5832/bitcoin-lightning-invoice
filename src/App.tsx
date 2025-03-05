import { useState } from "react";
import { webln } from "@getalby/sdk";
import { QRCodeSVG } from "qrcode.react";
import { FiAlertCircle, FiLoader, FiZap, FiRefreshCw, FiSettings, FiCopy, FiShare2 } from "react-icons/fi";

const App = () => {
  const [nwc, setNwc] = useState<webln.NostrWebLNProvider | null>(null);
  const [balanceMsat, setBalanceMsat] = useState<number | null>(null);
  const [previousBalanceMsat, setPreviousBalanceMsat] = useState<number | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [connectionUri, setConnectionUri] = useState<string>("");
  const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
  const [invoiceDescription, setInvoiceDescription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInvoicePaid, setIsInvoicePaid] = useState<boolean>(false);

  const connectWallet = async () => {
    try {
      if (!connectionUri) {
        setError("Please enter a valid connection URI.");
        return;
      }

      setIsLoading(true);
      const nwcProvider = new webln.NostrWebLNProvider({
        nostrWalletConnectUrl: connectionUri,
      });

      await nwcProvider.enable();
      setNwc(nwcProvider);
      setError(null);
      await checkBalance(nwcProvider);
      setIsLoading(false);
    } catch (err) {
      setError("Failed to connect wallet: " + (err as Error).message);
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
      const newBalance = balanceResponse.balance;

      console.log('Previous Balance:', previousBalanceMsat);
      console.log('New Balance:', newBalance);
      console.log('Invoice exists:', !!invoice);

      // Verifica se há um invoice ativo e se o saldo aumentou
      if (invoice && previousBalanceMsat !== null && newBalance > previousBalanceMsat) {
        console.log('Payment detected! Balance increased from', previousBalanceMsat, 'to', newBalance);
        setIsInvoicePaid(true);
      }

      // Atualiza os saldos
      setPreviousBalanceMsat(balanceMsat); // Salva o saldo atual como anterior
      setBalanceMsat(newBalance);         // Atualiza o saldo atual
      setError(null);
      setIsLoading(false);
    } catch (err) {
      setError("Error checking balance: " + (err as Error).message);
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
      const invoiceResponse = await nwc.makeInvoice({
        amount: invoiceAmount,
        description: invoiceDescription,
      });
      setInvoice(invoiceResponse.paymentRequest);
      setIsModalOpen(true);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      setError("Error creating invoice: " + (err as Error).message);
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setInvoice(null);
    setInvoiceDescription("");
    setInvoiceAmount(0);
  };

  const closePaymentModal = () => {
    setIsInvoicePaid(false);
  };

  // Restante do código JSX permanece igual
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6 sm:gap-10 p-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center justify-center space-x-3">
          <FiZap className="text-orange-500" />
          <span className="text-orange-500">Lightning Invoice</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm sm:text-base text-center">
          Seamless Bitcoin Lightning Payments
        </p>
      </div>

      <div className="bg-zinc-950 rounded-lg shadow-sm border border-zinc-800 p-4">
        <div className="text-center">
          {nwc && (
            <div className="w-full h-12 sm:h-16 mx-auto rounded-full flex items-center justify-between px-2 sm:px-4">
              <div className="flex items-center space-x-2">
                <div className="flex flex-row items-center justify-center gap-2">
                  <div className="h-2 w-2 bg-orange-400 animate-pulse rounded-full"></div>
                  <p className="text-gray-400 font-bold text-[10px] sm:text-xs uppercase">
                    Nostr Wallet Connected
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => checkBalance()}
                  disabled={isLoading}
                  className="cursor-pointer p-2 sm:p-3 bg-zinc-950 rounded-full hover:bg-zinc-900 transition flex items-center justify-center"
                >
                  {isLoading ? (
                    <FiLoader className="text-gray-400 animate-spin text-sm sm:text-base" />
                  ) : (
                    <FiRefreshCw className="text-gray-400 text-sm sm:text-base" />
                  )}
                </button>
                <button
                  onClick={() => console.log("Settings clicked")}
                  className="cursor-pointer p-2 sm:p-3 bg-zinc-950 rounded-full hover:bg-zinc-900 transition flex items-center justify-center"
                >
                  <FiSettings className="text-gray-400 text-sm sm:text-base" />
                </button>
              </div>
            </div>
          )}
        </div>

        {!nwc ? (
          <div className="space-y-4 p-2 w-2xs">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-400 text-center">
              Connect Nostr Wallet
            </h2>
            <input
              type="text"
              placeholder="Enter connection URI (nostr+walletconnect://...)"
              value={connectionUri}
              onChange={(e) => setConnectionUri(e.target.value)}
              className="w-full p-2 sm:p-3 border text-gray-400 border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm sm:text-base"
            />
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="cursor-pointer w-full bg-orange-500 text-zinc-950 py-2 sm:py-3 rounded-md hover:bg-orange-600 uppercase transition font-semibold flex items-center justify-center text-sm sm:text-base"
            >
              {isLoading ? <FiLoader className="animate-spin" /> : "Connect"}
            </button>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-10 mx-4 sm:mx-10 mb-6 sm:mb-10">
            <div className="bg-zinc-950">
              <label className="text-gray-400 font-medium text-left text-xs uppercase mb-1 ml-2">
                Balance
              </label>
              <p className="text-gray-700 font-medium text-center">
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <FiLoader className="text-orange-500 animate-spin text-2xl sm:text-2xl" />
                  </span>
                ) : (
                  <div>
                    <span className="text-gray-300 font-bold text-4xl sm:text-5xl">{balanceMsat}</span>
                    <span className="text-gray-400"> sats</span>
                  </div>
                )}
              </p>
            </div>
            <div className="space-y-4">
              <label htmlFor="invoiceAmount" className="block text-gray-400 font-medium text-left text-xs uppercase mb-1 ml-2">
                Invoice Amount
              </label>
              <div className="relative">
                <input
                  id="invoiceAmount"
                  type="number"
                  min="1"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                  className="w-full p-3 sm:p-4 bg-zinc-950 text-center text-2xl sm:text-3xl font-bold text-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition placeholder-gray-400"
                  placeholder="0"
                />
                <span className="absolute right-10 sm:right-44 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-lg">
                  sats
                </span>
              </div>
              <label htmlFor="invoiceDescription" className="block text-gray-400 font-medium text-left text-xs uppercase mb-1 ml-2">
                Description
              </label>
              <input
                id="invoiceDescription"
                type="text"
                value={invoiceDescription}
                onChange={(e) => setInvoiceDescription(e.target.value)}
                className="w-full p-2 sm:p-3 bg-zinc-950 text-gray-300 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition placeholder-gray-400 text-sm sm:text-base"
                placeholder="Enter invoice description"
              />
              <button
                onClick={createInvoice}
                disabled={isLoading}
                className="cursor-pointer uppercase w-full bg-orange-500 text-zinc-950 py-2 sm:py-3 rounded-md hover:bg-orange-600 transition font-semibold flex items-center justify-center text-sm sm:text-base"
              >
                {isLoading ? <FiLoader className="animate-spin" /> : "Create Invoice"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 sm:mt-6 p-2 sm:p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-center space-x-2 text-xs sm:text-sm">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {isModalOpen && invoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white p-4 pt-10 sm:p-8 sm:pt-12 rounded-md shadow-lg max-w-xs sm:max-w-md w-full mx-2 sm:mx-4 border border-gray-200 relative">
              <button
                onClick={closeModal}
                className="absolute top-2 sm:top-4 right-2 sm:right-4 p-1 sm:p-2 text-gray-500 hover:text-gray-700 transition cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="flex items-center justify-center gap-2">
                <FiZap className="text-orange-500 text-xl sm:text-2xl" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
                  Bitcoin Lightning Invoice
                </h2>
              </div>
              <div className="flex justify-center m-2 sm:m-4">
                <QRCodeSVG
                  value={invoice}
                  size={150}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                  marginSize={4}
                  title={`Invoice for ${invoiceAmount} satoshis`}
                />
              </div>
              <div className="space-y-2 sm:space-y-4 text-gray-700 text-sm sm:text-base">
                <p>
                  <strong>Amount:</strong> {invoiceAmount} sats
                </p>
                <p>
                  <strong>Description:</strong> {invoiceDescription}
                </p>
                <p className="break-all text-xs sm:text-sm">
                  <strong>Invoice:</strong> {invoice}
                </p>
              </div>
              <div className="mt-4 sm:mt-6 flex space-x-2 sm:space-x-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(invoice).then(() => {
                      alert("Invoice copied to clipboard!");
                    }).catch(() => {
                      alert("Failed to copy invoice.");
                    });
                  }}
                  className="cursor-pointer flex-1 bg-gray-500 text-white py-2 sm:py-3 rounded-md hover:bg-gray-600 transition font-semibold flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                >
                  <FiCopy className="text-sm sm:text-lg" />
                  <span>Copy Invoice</span>
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: "Lightning Invoice",
                        text: `Invoice for ${invoiceAmount} satoshis: ${invoice}`,
                      }).catch(() => {
                        alert("Sharing failed.");
                      });
                    } else {
                      alert("Sharing is not supported in your browser.");
                    }
                  }}
                  className="cursor-pointer flex-1 bg-gray-500 text-white py-2 sm:py-3 rounded-md hover:bg-gray-600 transition font-semibold flex items-center justify-center space-x-1 sm:space_x-2 text-xs sm:text-sm"
                >
                  <FiShare2 className="text-sm sm:text-lg" />
                  <span>Share Invoice</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isInvoicePaid && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white p-4 pt-10 sm:p-8 sm:pt-12 rounded-md shadow-lg max-w-xs sm:max-w-md w-full mx-2 sm:mx-4 border border-gray-200 relative">
              <button
                onClick={closePaymentModal}
                className="absolute top-2 sm:top-4 right-2 sm:right-4 p-1 sm:p-2 text-gray-500 hover:text-gray-700 transition cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="flex items-center justify-center gap-2">
                <FiZap className="text-green-500 text-xl sm:text-2xl" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
                  Payment Received!
                </h2>
              </div>
              <div className="mt-4 text-gray-700 text-sm sm:text-base text-center">
                <p>Your invoice for {invoiceAmount} sats has been paid.</p>
                <p>New balance: {balanceMsat} sats</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;