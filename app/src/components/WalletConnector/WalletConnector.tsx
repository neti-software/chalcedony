import { useConnectWallet } from "@web3-onboard/react";
import { useContext, useEffect } from "react";
import { MainContext } from "../../context";
import styles from "./WalletConnectot.module.scss";

const WalletConnector = () => {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const { setWallet } = useContext(MainContext);

  useEffect(() => {
    if (wallet) {
      setWallet?.(wallet);
    }
  }, [setWallet, wallet]);

  return (
    <button
      className={styles.connect}
      disabled={connecting}
      onClick={() => (wallet ? disconnect(wallet) : connect())}
    >
      {connecting ? "Connecting" : wallet ? "Disconnect" : "Connect"}
    </button>
  );
};

export default WalletConnector;
