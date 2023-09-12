import { useConnectWallet } from '@web3-onboard/react'
import { Web3Provider } from 'zksync-web3'

export default function WalletConnector() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  
  if (wallet) {
    const ethersProvider = new Web3Provider(wallet.provider, 'any')
    const signer = ethersProvider.getSigner()
    console.log(signer);
  }

  return (
    <button
      disabled={connecting}
      onClick={() => (wallet ? disconnect(wallet) : connect())}>
      {connecting ? 'connecting' : wallet ? 'disconnect' : 'connect'}
    </button>
  );
}