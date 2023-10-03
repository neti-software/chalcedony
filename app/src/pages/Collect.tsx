import { useConnectWallet } from "@web3-onboard/react";
import { useSearchParams } from "react-router-dom";
import { Web3Provider } from "zksync-web3";
import Box from "../components/Box";
import CustomTokenLogo from "../components/CustomTokenLogo";
import { useERC20Function } from "../helpers/queries";
import { transferERC20FromSmartAccount } from "../helpers/smartAccount";
import { fromWei } from "../helpers/utils";
import { did2address, fetchRegisteredAccountVC } from "../helpers/vc";
import styles from "./Collect.module.scss";
import { FC } from "react";
import { toast } from "react-toastify";

const Collect: FC = () => {
  const [searchParams] = useSearchParams();
  const fromBase64 = searchParams.get("payload");
  const [{ wallet }] = useConnectWallet();

  const { amount, inBlanco, token, transactionPaid } = JSON.parse(
    atob(fromBase64 ?? "")
  );

  const { data: tokenName, isLoading: isTokenNameLoading } = useERC20Function(
    [token],
    "name"
  );

  const { data: tokenSymbols } = useERC20Function([token], "symbol");

  const handleCollect = async () => {
    if (!wallet) return;

    try {
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

      toast.success("Success !! ", {
        position: "top-center",
      });
    } catch (error) {
      toast.error("Error", { position: "top-center" });
    }
  };

  return (
    <div className={styles.container}>
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
          disabled={!wallet}
        >
          COLLECT
        </button>
      </div>
    </div>
  );
};

export default Collect;
