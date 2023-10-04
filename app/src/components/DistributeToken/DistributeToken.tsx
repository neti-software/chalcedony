import { useConnectWallet } from "@web3-onboard/react";
import classNames from "classnames";
import { ethers } from "ethers";
import QRCode from "qrcode";
import { ChangeEvent, FC, useContext, useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "react-toastify";
import { Web3Provider } from "zksync-web3";
import { createSmartAccount } from "../../helpers/accountFactory";
import {
  CONTRACTS,
  getPaymasterContract,
  getWriteContractByAddress,
} from "../../helpers/contract";
import { useERC20Function } from "../../helpers/queries";
import { ASSETS_ICONS, TESTNET_TOKEN_LIST } from "../../helpers/tokensList";
import { fromWei, toBN, toWei } from "../../helpers/utils";
import { createInBlancoVC, createTransactionPaidVC } from "../../helpers/vc";
import one from "../../images/DistributeToken/1.png";
import amount from "../../images/DistributeToken/2.00ETH.png";
import two from "../../images/DistributeToken/2.png";
import three from "../../images/DistributeToken/3.png";
import four from "../../images/DistributeToken/4.png";
import at from "../../images/DistributeToken/@.png";
import token from "../../images/DistributeToken/AVAX.png";
import connectWalletIcon from "../../images/DistributeToken/ConnectWallet.png";
import customAssetIcon from "../../images/DistributeToken/customIcon.png";
import qrIcon from "../../images/DistributeToken/qrcode.png";
import Box from "../Box";
import CustomTokenLogo from "../CustomTokenLogo";
import Loader from "../Loader";
import styles from "./DistributeToken.module.scss";
import SymbolInput from "./SymbolInput";
import { MainContext } from "../../context";

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
  qrCode: string;
  payload?: string;
  url?: string;
};

const DistributeToken: FC = () => {
  const [tokensList] = useState<Array<string>>(TESTNET_TOKEN_LIST);

  const [selectedToken, setSelectedToken] = useState<string>(tokensList[0]);
  const [step, setStep] = useState<number>(1);
  const [amount, setAmount] = useState<number>(0);
  const [split, setSplit] = useState<number>(1);
  const [activeChannel] = useState<number>(2);
  const [emailInputs, setEmailInputs] = useState<Array<EmailInput>>([
    { email: "" },
  ]);
  const [qrcodeInputs, setQrcodeInputs] = useState<Array<QrCodeInput>>([
    { generated: false, qrCode: "", payload: "", url: "" },
  ]);

  const [tokensLeft, setTokensLeft] = useState("0");
  // const [showQrDialog, setShowQrDialog] = useState<boolean>(false);
  const [qrCodeDialogData, setQrCodeDialogData] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopiedToClipboard, setCopiedToClipboard] = useState(false);

  const [{ wallet }] = useConnectWallet();
  const { isWrongChain } = useContext(MainContext);

  const {
    data: tokenBalances,
    isLoading: isTokenBalanceLoading,
  } = useERC20Function(TESTNET_TOKEN_LIST, "balanceOf", [
    wallet?.accounts?.[0].address,
  ]);

  const {
    data: tokenSymbols,
    isLoading: isTokenSymbolLoading,
  } = useERC20Function(TESTNET_TOKEN_LIST, "symbol");

  const setDistributionInputs = (value: number) => {
    const newEmailInputs: Array<EmailInput> = [];
    const newQrcodeInputs: Array<QrCodeInput> = [];

    for (let index = 0; index < value; index++) {
      newEmailInputs.push({ email: "" });
      newQrcodeInputs.push({ generated: false, qrCode: "" });
    }

    setEmailInputs(newEmailInputs);
    setQrcodeInputs(newQrcodeInputs);
  };

  // const changeSplitValue = (e: ChangeEvent<HTMLInputElement>) => {
  //   const value = Number(e.target.value);
  //   setSplit(value);
  //   setDistributionInputs(value);
  // };

  const calcTokensLeft = () => {
    if (!tokenBalances || !tokenBalances[selectedToken] || !wallet) {
      setTokensLeft("0");
      return;
    }

    const tokensAvail = !tokenBalances[selectedToken]._isBigNumber
      ? toBN(tokenBalances[selectedToken])
      : tokenBalances[selectedToken];
    const amountBN = toBN(toWei(amount.toString()));
    const tokensLeft = tokensAvail.sub(amountBN);

    setTokensLeft(fromWei(tokensLeft));
  };

  const changeAmountValue = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setAmount(value);
  };

  const generatePayload = async () => {
    if (!wallet) return;

    const provider = new Web3Provider(wallet.provider, "any");
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();

    // deploy Account Abstraction contract
    const smartAccount = await createSmartAccount(signer);

    // create VCs
    const inBlanco = await createInBlancoVC(
      smartAccount.contract,
      smartAccount.did
    );

    const transactionPaid = await createTransactionPaidVC(
      smartAccount.contract,
      signer
    );

    // transfer ERC-20 tokens
    const token = getWriteContractByAddress(
      CONTRACTS.Token,
      selectedToken,
      signer
    );

    const amoutToTransaction = toWei((amount / split).toString());

    const transferTx = await token.transfer(
      smartAccount.contract.address,
      amoutToTransaction
    );

    await transferTx.wait();

    // fund paymaster
    const paymaster = getPaymasterContract(signer);
    const expectedBalance = ethers.utils.parseEther("0.1");
    const currentBalance = await paymaster.balanceOf(signerAddress);

    if (expectedBalance.gt(currentBalance)) {
      const fundTx = await signer.sendTransaction({
        to: paymaster.address,
        value: expectedBalance.sub(currentBalance),
      });

      await fundTx.wait();
    }

    // encode it
    return btoa(
      JSON.stringify({
        token: token.address,
        amount: amoutToTransaction,
        inBlanco,
        transactionPaid,
      })
    );
  };

  const generateQR = async (value: string) => {
    try {
      const result = await QRCode.toDataURL(value);
      return result;
    } catch (err) {
      console.error(err);
      return "";
    }
  };

  const generateSingleQrCode = async (index: number) => {
    if (qrcodeInputs[index].generated) return;

    try {
      setIsLoading(true);
      const newItems = [...qrcodeInputs];
      const payload = await generatePayload();

      if (payload) {
        toast.success("Success !! ", {
          position: "top-center",
        });
      } else {
        toast.error("Error", { position: "top-center" });

        return;
      }

      const url = `${window.location.origin}/collect?payload=${payload}`;
      const qrCode = await generateQR(url);

      newItems[index] = { generated: true, qrCode, payload, url };

      setQrcodeInputs(newItems);
      setQrCodeDialogData(qrCode);
    } catch (error) {
      console.log("Error while generating payload", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeActiveToken = (tokenAddress: string) => {
    setSelectedToken(tokenAddress);
    setAmount(0);
    setSplit(1);
    setDistributionInputs(1);
  };

  // const showQrCode = (index: number) => {
  //   if (!qrcodeInputs[index].generated) return;

  //   setQrCodeDialogData(qrcodeInputs[index].qrCode);

  //   setShowQrDialog(true);
  // };

  // const closeQrCode = () => {
  //   setShowQrDialog(false);
  //   setQrCodeDialogData("");
  // };

  useEffect(() => {
    calcTokensLeft();
    // FIXME calcTokensLeft should probably be defined inside the useEffect or with useMemo and added to deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTokenBalanceLoading, amount, selectedToken, wallet]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCopiedToClipboard(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isCopiedToClipboard]);

  return (
    <>
      {/* <DialogWhite isOpen={showQrDialog} handleClose={closeQrCode}>
        <div className={styles.dialogQrCode}>
          <img src={qrCodeDialogData} />
        </div>
      </DialogWhite> */}
      {isLoading ? <Loader /> : null}
      <Box>
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
                your users. Connect your wallet, select the token, deposit it
                into our contract, and provide a list of email addresses. <br />
                Your recipients will these magic links, or you can generate QR
                codes leading to them. When users click the link, they're
                directed to a collection page where they can claim their tokens
                instantly, without the need to generate a wallet beforehand.
                <br />
                <span>Simplify token distribution with us today.</span>
              </div>
              <CustomTokenLogo />
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
              <button
                disabled={!wallet || isWrongChain}
                onClick={() => setStep(2)}
              >
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
                    onClick={() => onChangeActiveToken(tokenAddress)}
                    className={classNames(
                      styles.singleAsset,
                      tokenAddress === selectedToken
                        ? styles.selected
                        : styles.hide
                    )}
                  >
                    <div
                      className={classNames(
                        !ASSETS_ICONS[tokenAddress]
                          ? styles.customIcon
                          : styles.logo
                      )}
                    >
                      <img
                        src={ASSETS_ICONS[tokenAddress] ?? customAssetIcon}
                      />
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
              <div className={styles.label}>Your balance:</div>
              {tokenBalances &&
              !isTokenBalanceLoading &&
              !isTokenSymbolLoading &&
              tokenSymbols ? (
                <div className={styles.value}>
                  {tokensLeft} <span>{tokenSymbols[selectedToken]}</span>
                </div>
              ) : (
                "Loading your'e balance..."
              )}
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
              {/* <div className={styles.split}>
                <div className={styles.label}>Split</div>
                <SymbolInput
                  value={split}
                  symbol="CODES"
                  min={1}
                  onChange={changeSplitValue}
                  disabled={true}
                />
              </div> */}
            </div>
            {/* <div className={styles.information}>
              Each of the users will get: {split == 0 ? 0 : amount / split}{" "}
              {tokenSymbols && !isTokenSymbolLoading
                ? tokenSymbols[selectedToken]
                : ""}
            </div> */}
            {/* <div className={styles.label}>Distribution Channel</div>
            <div className={styles.channels}>
              <button
                className={classNames(
                  styles.distChannel,
                  activeChannel === 1 ? styles.activeChannel : ""
                )}
                disabled={true}
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
            </div> */}
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
                      {/* <div className={styles.generateButton}>
                        <button disabled>Generate & Download All</button>
                      </div> 
                      <div className={styles.label}>Distribution QR codes</div>
                      */}
                      {qrcodeInputs.map((input, index) => {
                        return (
                          <div className={styles.qrCodeItem} key={index}>
                            <button
                              className={classNames(styles.generateQrButton)}
                              disabled={
                                input.generated || amount <= 0 || isWrongChain
                              }
                              onClick={() => generateSingleQrCode(index)}
                            >
                              <img src={qrIcon} alt="show-qr" />
                              Transfer & Get Link
                            </button>
                            {input.generated ? (
                              <>
                                {/* <button
                                  className={styles.showQrButton}
                                  onClick={() => showQrCode(index)}
                                >
                                  <img src={qrIcon} alt="show-qr" />
                                </button> */}

                                <CopyToClipboard
                                  text={input.url ?? ""}
                                  onCopy={() => setCopiedToClipboard(true)}
                                >
                                  <div
                                    className={
                                      isCopiedToClipboard
                                        ? styles.copied
                                        : styles.url
                                    }
                                  >
                                    {isCopiedToClipboard
                                      ? "Copied !"
                                      : `${input.url?.slice(0, 20)}
                                      [...]
                                      ${input.url?.slice(
                                        input.url.length - 10,
                                        input.url.length
                                      )} (click to copy)`}
                                  </div>
                                </CopyToClipboard>

                                <div className={styles.dialogQrCode}>
                                  <img src={qrCodeDialogData} />
                                </div>
                              </>
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
      </Box>
    </>
  );
};

export default DistributeToken;
