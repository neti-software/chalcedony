import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { Web3OnboardProvider, init } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import './index.css'

const web3Onboard = init({
  wallets: [injectedModule()],
  chains: [
    {
      id: '0x10E',
      token: 'ETH',
      label: 'zkSync Era Local Testnet',
      rpcUrl: 'http://127.0.0.1:3050/',
    },
  ],
  appMetadata: {
    name: 'Chalcedony',
    description: 'Transfer assets by link, SSI style!'
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      <App />
    </Web3OnboardProvider>
  </React.StrictMode>,
)
