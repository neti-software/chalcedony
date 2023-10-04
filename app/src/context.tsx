import { WalletState } from "@web3-onboard/core";
import { useSetChain } from "@web3-onboard/react";
import { ReactNode, createContext, useEffect, useState } from "react";
import { Signer, Web3Provider } from "zksync-web3";
import { CHAIN_ID } from "./helpers/config";

type ContextType = {
  signer?: Signer;
  provider?: Web3Provider;
  setWallet?: (value: WalletState | null) => void;
  isWrongChain: boolean;
};

export const MainContext = createContext<ContextType>({ isWrongChain: false });

type MainContextProviderProps = {
  children?: ReactNode;
};

export const MainContextProvider = ({ children }: MainContextProviderProps) => {
  const [provider, setProvider] = useState<Web3Provider>();
  const [signer, setSigner] = useState<Signer>();
  const [wallet, setWallet] = useState<WalletState | null>();
  const [isWrongChain, setIsWrongChain] = useState<boolean>(false);
  const [{ connectedChain }, setChain] = useSetChain();

  useEffect(() => {
    if (wallet) {
      const ethersProvider = new Web3Provider(wallet.provider, "any");
      const signer = ethersProvider.getSigner();

      if (ethersProvider && signer) {
        setProvider?.(ethersProvider);
        setSigner?.(signer);
        setIsWrongChain(
          wallet && connectedChain?.id !== CHAIN_ID.toLowerCase()
        );
        setChain({ chainId: CHAIN_ID });
      }
    }
  }, [wallet, setProvider, setSigner]);

  return (
    <MainContext.Provider
      value={{
        provider,
        signer,
        setWallet,
        isWrongChain,
      }}
    >
      {children}
    </MainContext.Provider>
  );
};

export default MainContextProvider;
