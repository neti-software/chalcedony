import { useConnectWallet } from "@web3-onboard/react";
import { FC, useContext, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Web3Provider } from "zksync-web3";
import Box from "../components/Box";
import CustomTokenLogo from "../components/CustomTokenLogo";
import Loader from "../components/Loader";
import { useCollectedAsset, useERC20Function } from "../helpers/queries";
import { transferERC20FromSmartAccount } from "../helpers/smartAccount";
import { fromWei } from "../helpers/utils";
import { did2address, fetchRegisteredAccountVC } from "../helpers/vc";
import styles from "./Collect.module.scss";
import { MainContext } from "../context";
import { ethers } from "ethers";
import pako from 'pako';

const Collect: FC = () => {
  const [searchParams] = useSearchParams();
  const fromBase58 = searchParams.get("p");
  const [{ wallet }] = useConnectWallet();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { isWrongChain } = useContext(MainContext);

  const decoded = ethers.utils.base58.decode(fromBase58 ?? "");
  const rawData = JSON.parse(new TextDecoder().decode(pako.inflate(decoded)));
  const token = rawData[0];
  const amount = rawData[1];
  const inBlanco = {
    vc: {
      "@context": rawData[2],
      credentialSubject: {
        id: rawData[3],
      },
      issuer: {
        id: rawData[4],
      },
      type: rawData[5],
      issuanceData: rawData[6],
      id: rawData[7],
    },
    proofValue: ethers.utils.base64.decode(rawData[8]),
  };
  const transactionPaid = {
    vc: {
      "@context": rawData[9],
      credentialSubject: {
        id: rawData[10],
      },
      issuer: {
        id: rawData[11],
      },
      type: rawData[12],
      issuanceData: rawData[13],
      id: rawData[14],
    },
    proofValue: ethers.utils.base64.decode(rawData[15]),
  };


  const { data: tokenName, isLoading: isTokenNameLoading } = useERC20Function(
    [token],
    "name"
  );

  const { data: isCollected, refetch: refetchIsCollected } = useCollectedAsset(
    transactionPaid.vc.id,
    wallet
  );

  const { data: tokenSymbols } = useERC20Function([token], "symbol");

  const handleCollect = async () => {
    if (!wallet) return;

    try {
      setIsLoading(true);
      // get metamask wallet signer - this should be Bob
      const provider = new Web3Provider(wallet.provider, "any");
      const signer = provider.getSigner();

      const accountAddress = did2address(
        transactionPaid.vc.credentialSubject.id
      );

      const registeredAccount = await fetchRegisteredAccountVC(
        accountAddress,
        inBlanco.vc.id,
        signer
      );

      await transferERC20FromSmartAccount(
        token,
        inBlanco,
        registeredAccount,
        transactionPaid,
        signer
      );

      refetchIsCollected();

      toast.success("Success !! ", {
        position: "top-center",
      });
    } catch (error) {
      toast.error("Error", { position: "top-center" });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {isLoading ? <Loader /> : null}
      <div className={styles.collect}>
        <Box className={styles.box}>
          <div className={styles.title}>
            <div>You received an </div>
            <span>Token Voucher</span>
          </div>
          <div className={styles.tokenImage}>
            <CustomTokenLogo>
              <div className={styles.logoContainer}>
                <div className={styles.label}>Value</div>
                <div className={styles.amount}>
                  {fromWei(amount)}{" "}
                  {isTokenNameLoading && !tokenSymbols?.[token]
                    ? ""
                    : tokenSymbols?.[token]}
                </div>
              </div>
            </CustomTokenLogo>
          </div>
          <div className={styles.data}>
            <div className={styles.label}>NAME</div>
            <div className={styles.value}>
              {!isTokenNameLoading ? tokenName[token] : "Loading..."}
            </div>
            <div className={styles.label}>TOKEN ADDR:</div>
            <div className={styles.value}>{token}</div>
          </div>
        </Box>
      </div>
      <div className={styles.action}>
        {!wallet ? (
          <div className={styles.message}>
            To collect tokens connect wallet first !
          </div>
        ) : null}
        <button
          className={styles.collectButton}
          onClick={handleCollect}
          disabled={!wallet || (wallet && isCollected) || isWrongChain}
        >
          {wallet && isCollected ? "COLLECTED !" : "COLLECT"}
        </button>
      </div>
    </div>
  );
};

export default Collect;
