import { WalletState } from "@web3-onboard/core";
import { ReactNode, createContext, useEffect, useState } from "react";
import { Signer, Web3Provider } from "zksync-web3";

type ContextType = {
  signer?: Signer;
  provider?: Web3Provider;
  setWallet?: (value: WalletState | null) => void;
};

export const MainContext = createContext<ContextType>({});

type MainContextProviderProps = {
  children?: ReactNode;
};

export const MainContextProvider = ({ children }: MainContextProviderProps) => {
  const [provider, setProvider] = useState<Web3Provider>();
  const [signer, setSigner] = useState<Signer>();
  const [wallet, setWallet] = useState<WalletState | null>();

  useEffect(() => {
    if (wallet) {
      const ethersProvider = new Web3Provider(wallet.provider, "any");
      const signer = ethersProvider.getSigner();

      if (ethersProvider && signer) {
        setProvider?.(ethersProvider);
        setSigner?.(signer);
      }
    }
  }, [wallet, setProvider, setSigner]);

  return (
    <MainContext.Provider value={{ provider, signer, setWallet }}>
      {children}
    </MainContext.Provider>
  );
};

export default MainContextProvider;
