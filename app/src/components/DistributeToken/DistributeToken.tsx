import { useConnectWallet } from "@web3-onboard/react";
import { useWeb3Onboard } from "@web3-onboard/react/dist/context";
import classNames from "classnames";
import { ChangeEvent, FC, useContext, useState } from "react";
import { useERC20Function } from "../../helpers/queries";
import { ASSETS_ICONS, TESTNET_TOKEN_LIST } from "../../helpers/tokensList";
import one from "../../images/DistributeToken/1.png";
import amount from "../../images/DistributeToken/2.00ETH.png";
import two from "../../images/DistributeToken/2.png";
import three from "../../images/DistributeToken/3.png";
import four from "../../images/DistributeToken/4.png";
import at from "../../images/DistributeToken/@.png";
import token from "../../images/DistributeToken/AVAX.png";
import connectWalletIcon from "../../images/DistributeToken/ConnectWallet.png";
import emailIcon from "../../images/DistributeToken/email.png";
import qrIcon from "../../images/DistributeToken/qrcode.png";
import icon from "../../images/tokeIcon.svg";
import styles from "./DistributeToken.module.scss";
import SymbolInput from "./SymbolInput";
import { MainContext } from "../../context";
import { ethers } from "ethers";
import customAssetIcon from "../../images/DistributeToken/customIcon.png";

const steps: Array<{
  step: string;
  text: string;
  image: string;
}> = [
  {
    step: one,
    text: "Connect Your Wallet",
    image: connectWalletIcon,
  },
  {
    step: two,
    text: "Choose the asset",
    image: token,
  },
  {
    step: three,
    text: "Choose the amount",
    image: amount,
  },
  {
    step: four,
    text: "Provide the emails",
    image: at,
  },
];

type EmailInput = {
  email: string;
};

type QrCodeInput = {
  generated: boolean;
};

const DistributeToken: FC = () => {
  const [tokensList] = useState<Array<string>>(TESTNET_TOKEN_LIST);

  const [selectedToken, setSelectedToken] = useState<string>(tokensList[0]);
  const [step, setStep] = useState<number>(1);
  const [amount, setAmount] = useState<number>(0);
  const [split, setSplit] = useState<number>(1);
  const [activeChannel, setActiveChannel] = useState<number>();
  const [emailInputs, setEmailInputs] = useState<Array<EmailInput>>([
    { email: "" },
  ]);
  const [qrcodeInputs, setQrcodeInputs] = useState<Array<QrCodeInput>>([
    { generated: false },
  ]);

  const [{ wallet }] = useConnectWallet();
  const onboard = useWeb3Onboard();
  const { signer } = useContext(MainContext);

  const { data: tokenBalances, isLoading: isTokenBalanceLoading } =
    useERC20Function(
      TESTNET_TOKEN_LIST,
      "balanceOf",
      [onboard.state.get().wallets?.[0]?.accounts?.[0].address],
      signer
    );

  const { data: tokenSymbols, isLoading: isTokenSymbolLoading } =
    useERC20Function(TESTNET_TOKEN_LIST, "symbol", [], signer);

  const changeSplitValue = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setSplit(value);

    const newEmailInputs: Array<EmailInput> = [];
    const newQrcodeInputs: Array<QrCodeInput> = [];

    for (let index = 0; index < value; index++) {
      newEmailInputs.push({ email: "" });
      newQrcodeInputs.push({ generated: false });
    }

    setEmailInputs(newEmailInputs);
    setQrcodeInputs(newQrcodeInputs);
  };

  const changeAmountValue = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setAmount(value);
  };

  const generateSingleQrCode = (index: number) => {
    if (qrcodeInputs[index].generated) return;

    const newItems = [...qrcodeInputs];
    newItems[index] = { generated: true };
    setQrcodeInputs(newItems);
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <div>Distribute </div>
        <div>
          <span>Tokens as Vouchers</span>
        </div>
      </div>
      {step === 1 ? (
        <>
          <div className={styles.middle}>
            <div className={styles.text}>
              With a few simple steps, you can create magic voucher links for
              your users. Connect your wallet, select the token, deposit it into
              our contract, and provide a list of email addresses. <br />
              Your recipients will these magic links, or you can generate QR
              codes leading to them. When users click the link, they're directed
              to a collection page where they can claim their tokens instantly,
              without the need to generate a wallet beforehand.
              <br />
              <span>Simplify token distribution with us today.</span>
            </div>
            <div className={styles.logo}>
              <img src={icon} alt="token-icon" />
            </div>
          </div>
          <div className={styles.steps}>
            {steps.map(({ step, text, image }, index) => {
              return (
                <div key={index} className={styles.singleStep}>
                  <div className={styles.no}>
                    <img src={step} />
                  </div>
                  <div className={styles.text}>{text}</div>
                  <div className={styles.component}>
                    <img src={image} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.button}>
            <button disabled={!wallet} onClick={() => setStep(2)}>
              start
            </button>
          </div>
        </>
      ) : (
        <div className={styles.assets}>
          <div className={styles.label}>Choose asset</div>
          <div className={styles.assetList}>
            {tokensList.map((tokenAddress, index) => {
              return (
                <div
                  key={index}
                  onClick={() => setSelectedToken(tokenAddress)}
                  className={classNames(
                    styles.singleAsset,
                    tokenAddress === selectedToken
                      ? styles.selected
                      : styles.hide
                  )}
                >
                  <div className={styles.logo}>
                    <img src={ASSETS_ICONS[tokenAddress] ?? customAssetIcon} />
                  </div>
                  <div className={styles.symbol}>
                    {!isTokenSymbolLoading && tokenSymbols
                      ? tokenSymbols[tokenAddress]
                      : "Loading symbol..."}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.balance}>
            <div className={styles.label}>Your balance:{""}</div>
            {tokenBalances && !isTokenBalanceLoading ? (
              <div className={styles.value}>
                {ethers.utils.formatEther(tokenBalances[selectedToken])}
              </div>
            ) : (
              "Loading your'e balance..."
            )}{" "}
            {!isTokenSymbolLoading && tokenSymbols
              ? tokenSymbols[selectedToken]
              : ""}
          </div>
          <div className={styles.inputs}>
            <div className={styles.amount}>
              <div className={styles.label}>Amount</div>
              <SymbolInput
                value={amount}
                symbol={
                  !isTokenSymbolLoading && tokenSymbols
                    ? tokenSymbols[selectedToken]
                    : ""
                }
                onChange={changeAmountValue}
              />
            </div>
            <div className={styles.split}>
              <div className={styles.label}>Split</div>
              <SymbolInput
                value={split}
                symbol="CODES"
                min={1}
                onChange={changeSplitValue}
              />
            </div>
          </div>
          <div className={styles.information}>
            Each of the users will get: {split == 0 ? 0 : amount / split}{" "}
            {tokenSymbols && !isTokenSymbolLoading
              ? tokenSymbols[selectedToken]
              : ""}
          </div>
          <div className={styles.label}>Distribution Channel</div>
          <div className={styles.channels}>
            <button
              className={classNames(
                styles.distChannel,
                activeChannel === 1 ? styles.activeChannel : ""
              )}
              onClick={() => setActiveChannel(1)}
            >
              <img src={emailIcon} alt="email-channel" />
            </button>
            <button
              className={classNames(
                styles.distChannel,
                activeChannel === 2 ? styles.activeChannel : ""
              )}
              onClick={() => setActiveChannel(2)}
            >
              <img src={qrIcon} alt="qr-code-channel" />
            </button>
          </div>
          <div className={styles.dynamicInputs}>
            {activeChannel === 1 ? (
              <div className={styles.emails}>
                {split > 0 ? (
                  <>
                    <div className={styles.generateButton}>
                      <button>Import CSV</button>
                    </div>
                    <div className={styles.label}>Distribution e-Mails</div>
                    {emailInputs.map((input, index) => {
                      return (
                        <div key={index} className={styles.emailItem}>
                          <SymbolInput
                            symbol={`User #${index + 1}`}
                            value={input.email}
                            placeholder="@mail"
                          />
                        </div>
                      );
                    })}
                  </>
                ) : null}
              </div>
            ) : null}
            {activeChannel === 2 ? (
              <div className={styles.qrCodes}>
                {split > 0 ? (
                  <>
                    <div className={styles.generateButton}>
                      <button>Generate & Download All</button>
                    </div>
                    <div className={styles.label}>Distribution QR codes</div>
                    {qrcodeInputs.map((input, index) => {
                      return (
                        <div className={styles.qrCodeItem} key={index}>
                          <button
                            className={classNames(
                              styles.generateQrButton,
                              input.generated ? styles.generatedQr : ""
                            )}
                            disabled={input.generated}
                            onClick={() => generateSingleQrCode(index)}
                          >
                            Generate QR-Code
                          </button>
                          {input.generated ? (
                            <button className={styles.showQrButton}>
                              <img src={qrIcon} alt="show-qr" />
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributeToken;
