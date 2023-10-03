import injectedModule from "@web3-onboard/injected-wallets";
import { Web3OnboardProvider, init } from "@web3-onboard/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import Layout from "./components/Layout/Layout.tsx";
import { QueryClient, QueryClientProvider } from "react-query";
import MainContextProvider from "./context";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const web3Onboard = init({
  wallets: [injectedModule()],
  chains: [
    {
      id: "0x10E",
      token: "ETH",
      label: "zkSync Era Local Testnet",
      rpcUrl: "http://127.0.0.1:3050/",
    },
    {
      id: "0x144",
      token: "ETH",
      label: "zkSync Era Mainnet",
      rpcUrl: "https://zksync.drpc.org",
    },
    {
      id: "0x118",
      token: "ETH",
      label: "zkSync Era Testnet",
      rpcUrl: "https://testnet.era.zksync.dev",
    },
  ],
  appMetadata: {
    name: "Chalcedony",
    description: "Transfer assets by link, SSI style!",
  },
  connect: {
    autoConnectLastWallet: true,
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      <BrowserRouter>
        <MainContextProvider>
          <ToastContainer limit={2} />
          <QueryClientProvider client={queryClient}>
            <Layout>
              <App />
            </Layout>
          </QueryClientProvider>
        </MainContextProvider>
      </BrowserRouter>
    </Web3OnboardProvider>
  </React.StrictMode>
);
