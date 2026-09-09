"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ACTIVE_NETWORK, chainIdHex } from "@/lib/networks";
import { type Address } from "@/lib/contract";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<any>;
  providers?: EthereumProvider[];
  isRabby?: boolean;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

type WalletContextValue = {
  address?: Address;
  chainId?: number;
  balance?: bigint;
  connected: boolean;
  wrongNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
};

function walletProvider(): EthereumProvider | undefined {
  const injected = window.ethereum;
  const providers = injected?.providers;
  return providers?.find((provider) => provider.isRabby) ?? injected;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<Address | undefined>();
  const [chainId, setChainId] = useState<number | undefined>();
  const [balance, setBalance] = useState<bigint | undefined>();

  const refreshChain = useCallback(async () => {
    const id = await walletProvider()?.request({ method: "eth_chainId" });
    if (id) setChainId(Number.parseInt(String(id), 16));
  }, []);

  const refreshBalance = useCallback(async (walletAddress?: Address) => {
    const provider = walletProvider();
    if (!walletAddress || !provider) {
      setBalance(undefined);
      return;
    }
    const raw = await provider.request({
      method: "eth_getBalance",
      params: [walletAddress, "latest"]
    });
    if (raw === undefined || raw === null || raw === "") {
      setBalance(0n);
      return;
    }
    setBalance(BigInt(String(raw)));
  }, []);

  const connect = useCallback(async () => {
    const provider = walletProvider();
    if (!provider) throw new Error("Install Rabby or another EVM wallet to connect.");
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    const nextAddress = accounts?.[0] as Address | undefined;
    setAddress(nextAddress);
    await refreshChain();
    await refreshBalance(nextAddress);
  }, [refreshBalance, refreshChain]);

  const disconnect = useCallback(() => {
    setAddress(undefined);
    setBalance(undefined);
  }, []);

  const switchNetwork = useCallback(async () => {
    const provider = walletProvider();
    if (!provider) throw new Error("Install Rabby or another EVM wallet to connect.");
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex() }]
      });
    } catch (error: any) {
      if (error?.code !== 4902) throw error;
      await provider.request({
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
    await refreshBalance(address);
  }, [address, refreshBalance, refreshChain]);

  useEffect(() => {
    const provider = walletProvider();
    if (!provider) return;
    refreshChain();
    const onAccounts = (accounts: string[]) => {
      const nextAddress = accounts?.[0] as Address | undefined;
      setAddress(nextAddress);
      void refreshBalance(nextAddress);
    };
    const onChain = (id: string) => {
      setChainId(Number.parseInt(id, 16));
      void refreshBalance(address);
    };
    provider.on?.("accountsChanged", onAccounts);
    provider.on?.("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, [address, refreshBalance, refreshChain]);

  const value = useMemo(
    () => ({
      address,
      chainId,
      balance,
      connected: Boolean(address),
      wrongNetwork: Boolean(address && chainId && chainId !== ACTIVE_NETWORK.chainId),
      connect,
      disconnect,
      switchNetwork
    }),
    [address, balance, chainId, connect, disconnect, switchNetwork]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
