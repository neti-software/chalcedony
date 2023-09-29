import { FC, useState } from "react";
import styles from "./Header.module.scss";
import WalletConnector from "../WalletConnector";
import { createInBlancoVC, createTransactionPaidVC, fetchRegisteredAccountVC } from "../../helpers/vc";
import { useConnectWallet } from "@web3-onboard/react";
import { createSmartAccount } from "../../helpers/accountFactory";
import { Web3Provider } from "zksync-web3";
import { ethers } from "ethers";
import { getPaymasterContract } from "../../helpers/contract";
import { transferERC20FromSmartAccount } from "../../helpers/smartAccount";

const TestHack = () => {
  const [{ wallet }] = useConnectWallet();
  const [payload, setPayload] = useState<string>("");

  if (!wallet) return;

  const generate = async () => {
    // get metamask wallet signer - this should be Alice
    const provider = new Web3Provider(wallet.provider, 'any');
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();

    // deploy Account Abstraction contract
    const smartAccount = await createSmartAccount(signer);

    // create VCs
    const inBlanco = await createInBlancoVC(smartAccount.contract, smartAccount.did);
    const transactionPaid = await createTransactionPaidVC(smartAccount.contract, signer);

    // fund paymaster
    const paymaster = getPaymasterContract(signer);
    const expectedBalance = ethers.utils.parseEther("0.1");
    const currentBalance = await paymaster.balanceOf(signerAddress);
    if (expectedBalance.gt(currentBalance)) {
      const fundTx = await signer.sendTransaction({
        to: paymaster.address,
        value: expectedBalance.sub(currentBalance)
      });
      await fundTx.wait();
    }

    // encode it
    setPayload(btoa(JSON.stringify({ inBlanco, transactionPaid })));
  };

  const redeem = async () => {
    // get metamask wallet signer - this should be Bob
    const provider = new Web3Provider(wallet.provider, 'any');
    const signer = provider.getSigner();

    const { inBlanco, transactionPaid } = JSON.parse(atob(payload));
    const registeredAccount = await fetchRegisteredAccountVC(inBlanco.vc.id, signer);

    await transferERC20FromSmartAccount(
      import.meta.env.VITE_TEST_TOKEN_CONTRACT ?? "",
      inBlanco,
      registeredAccount,
      transactionPaid,
      signer
    );
  };

  return (<>
    <button onClick={generate}>
      Generate payload
    </button>
    <input type="text" value={payload} />
    <button onClick={redeem}>
      Redeem
    </button>
  </>);
}

const Header: FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.menu}>
        <div className={styles.pages}>
          <a href={"/pre-collected"} rel="noreferrer">
            Pre-Collected
          </a>
        </div>
        <div className={styles.pages}>
          <a href={"/create"} rel="noreferrer">
            Create
          </a>
        </div>
      </div>
      <div className={styles.wallet}>
        <TestHack/>
        <WalletConnector />
        {/* <button className={styles.more}>. . .</button> */}
      </div>
    </div>
  );
};

export default Header;
