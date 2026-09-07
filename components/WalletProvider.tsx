"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ACTIVE_NETWORK, chainIdHex } from "@/lib/networks";
import { type Address } from "@/lib/contract";

type WalletContextValue = {
  address?: Address;
  chainId?: number;
  connected: boolean;
  wrongNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<Address | undefined>();
  const [chainId, setChainId] = useState<number | undefined>();

  const refreshChain = useCallback(async () => {
    const id = await window.ethereum?.request({ method: "eth_chainId" });
    if (id) setChainId(Number.parseInt(String(id), 16));
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) throw new Error("Install MetaMask to connect.");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAddress(accounts?.[0] as Address | undefined);
    await refreshChain();
  }, [refreshChain]);

  const disconnect = useCallback(() => {
    setAddress(undefined);
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) throw new Error("Install MetaMask to connect.");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex() }]
      });
    } catch (error: any) {
      if (error?.code !== 4902) throw error;
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainIdHex(),
            chainName: ACTIVE_NETWORK.label,
            nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
            rpcUrls: ACTIVE_NETWORK.rpcUrl ? [ACTIVE_NETWORK.rpcUrl] : [],
            blockExplorerUrls: ACTIVE_NETWORK.explorerUrl ? [ACTIVE_NETWORK.explorerUrl] : []
          }
        ]
      });
    }
    await refreshChain();
  }, [refreshChain]);

  useEffect(() => {
    if (!window.ethereum) return;
    refreshChain();
    const onAccounts = (accounts: string[]) => setAddress(accounts?.[0] as Address | undefined);
    const onChain = (id: string) => setChainId(Number.parseInt(id, 16));
    window.ethereum.on?.("accountsChanged", onAccounts);
    window.ethereum.on?.("chainChanged", onChain);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAccounts);
      window.ethereum?.removeListener?.("chainChanged", onChain);
    };
  }, [refreshChain]);

  const value = useMemo(
    () => ({
      address,
      chainId,
      connected: Boolean(address),
      wrongNetwork: Boolean(address && chainId && chainId !== ACTIVE_NETWORK.chainId),
      connect,
      disconnect,
      switchNetwork
    }),
    [address, chainId, connect, disconnect, switchNetwork]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
