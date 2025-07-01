// src/contexts/ContextWallet.tsx
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { webln } from "@getalby/sdk";

type WalletContextType = {
    nwc: webln.NostrWebLNProvider | null;
    connectionUri: string;
    connectWallet: (uri: string) => Promise<void>;
    disconnectWallet: () => void;
    isInitializing: boolean;
};

const WalletContext = createContext<WalletContextType>({
    nwc: null,
    connectionUri: "",
    connectWallet: async () => { },
    disconnectWallet: () => { },
    isInitializing: true,
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const [nwc, setNwc] = useState<webln.NostrWebLNProvider | null>(null);
    const [connectionUri, setConnectionUri] = useState<string>("");
    const [isInitializing, setIsInitializing] = useState(true);

    // Restaurar a conexão ao carregar o componente
    useEffect(() => {
        const savedUri = sessionStorage.getItem("nostrWalletConnectUri");
        if (savedUri) {
            const connect = async () => {
                try {
                    const nwcProvider = new webln.NostrWebLNProvider({
                        nostrWalletConnectUrl: savedUri
                    });
                    await nwcProvider.enable();
                    setNwc(nwcProvider);
                    setConnectionUri(savedUri);
                } catch (err) {
                    console.error("Failed to reconnect wallet:", err);
                    sessionStorage.removeItem("nostrWalletConnectUri");
                } finally {
                    setIsInitializing(false);
                }
            };
            connect();
        } else {
            setIsInitializing(false);
        }
    }, []);

    const connectWallet = async (uri: string) => {
        try {
            setIsInitializing(true);
            const nwcProvider = new webln.NostrWebLNProvider({ nostrWalletConnectUrl: uri });
            await nwcProvider.enable();
            setNwc(nwcProvider);
            setConnectionUri(uri);
            sessionStorage.setItem("nostrWalletConnectUri", uri);
        } catch (err) {
            console.error("Wallet connection error:", err);
            throw err;
        } finally {
            setIsInitializing(false);
        }
    };

    const disconnectWallet = () => {
        try {
            if (nwc && typeof nwc.close === "function") {
                nwc.close();
            }
        } catch (err) {
            console.error("Error closing wallet connection:", err);
        }
        setNwc(null);
        setConnectionUri("");
        sessionStorage.removeItem("nostrWalletConnectUri");
    };

    return (
        <WalletContext.Provider
            value={{
                nwc,
                connectionUri,
                connectWallet,
                disconnectWallet,
                isInitializing
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => useContext(WalletContext);