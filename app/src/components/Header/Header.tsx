import { FC, useContext, useState } from "react";
import { MainContext } from "../../context";
import WalletConnector from "../WalletConnector";
import styles from "./Header.module.scss";
import { CONTRACTS, getWriteContractByAddress } from "../../helpers/contract";
import { Web3Provider } from "zksync-web3";
import { useConnectWallet } from "@web3-onboard/react";
import { toWei } from "../../helpers/utils";
import Loader from "../Loader";
import { toast } from "react-toastify";
import { TEST_TOKEN_CONTRACT } from "../../helpers/config";

const Header: FC = () => {
  const { isWrongChain } = useContext(MainContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [{ wallet }] = useConnectWallet();

  const handleGetTokens = async () => {
    if (!wallet || isWrongChain) return;

    try {
      setIsLoading(true);
      const provider = new Web3Provider(wallet.provider, "any");
      const signer = provider.getSigner();

      const token = getWriteContractByAddress(
        CONTRACTS.Token,
        TEST_TOKEN_CONTRACT,
        signer
      );

      const tx = await token.mint(wallet?.accounts?.[0].address, toWei("10"));
      if(window.ethereum)
        await window.ethereum.request({
          "method": "wallet_watchAsset",
          "params": {
            "type": "ERC20",
            "options": {
              "address": token.address,
              "symbol": await token.symbol(),
              "decimals": await token.decimals(),
            }
          }
        });
      await tx.wait();

      toast.success("Success !! ", {
        position: "top-center",
      });
    } catch (error) {
      toast.error("Error", { position: "top-center" });
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading ? <Loader /> : null}
      <div className={styles.container}>
        <div className={styles.menu}>
          <div className={styles.pages}>
            <a href={"/create"} rel="noreferrer">
              Create
            </a>
          </div>
          <div className={styles.pages}>
            <div className={styles.faucet} onClick={() => handleGetTokens()}>
              Test faucet
            </div>
          </div>
        </div>
        {isWrongChain ? (
          <div className={styles.message}>
            Wrong chain, please interact with metamask
          </div>
        ) : null}

        <div className={styles.wallet}>
          <WalletConnector />
        </div>
      </div>
    </>
  );
};

export default Header;
