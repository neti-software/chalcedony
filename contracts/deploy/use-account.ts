import { EIP712Signer, Provider, types, utils } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// load env file
import dotenv from "dotenv";
dotenv.config();

// load contract artifact. Make sure to compile first!
import * as AccountArtifact from "../artifacts-zk/contracts/Account.sol/Account.json";
import * as PaymasterArtifact from "../artifacts-zk/contracts/Paymaster.sol/Paymaster.json";
import * as TestTokenArtifact from "../artifacts-zk/contracts/test/TestToken.sol/TestToken.json";
import * as IEncodingsArtifact from "../artifacts-zk/contracts/IEncodings.sol/IEncodings.json";
import { GenericCredentialSubject, Issuer, RegisteredAccountControllerCredentialSubject, RegistrationClaim, VC } from "@kacperzuk-neti/chalcedony-vcs";
import { Account, Paymaster, TestToken } from "../typechain-types";

const ALICE_PRIVATE_KEY = process.env.ALICE_PRIVATE_KEY || "";
const BOB_PRIVATE_KEY = process.env.BOB_PRIVATE_KEY || "";
const SMART_ACCOUNT_PRIVATE_KEY = process.env.SMART_ACCOUNT_PRIVATE_KEY || "";
const WITNESS_PRIVATE_KEY = process.env.WITNESS_PRIVATE_KEY || "";

if (!ALICE_PRIVATE_KEY || !SMART_ACCOUNT_PRIVATE_KEY || !WITNESS_PRIVATE_KEY || !BOB_PRIVATE_KEY)
  throw "⛔️ Private key not detected! Add it to the .env file!";

const PAYMASTER_ADDRESS = process.env.PAYMASTER_ADDRESS || "";
const SMART_ACCOUNT_ADDRESS = process.env.SMART_ACCOUNT_ADDRESS || "";
const TEST_TOKEN_ADDRESS = process.env.TEST_TOKEN_ADDRESS || "";

if (!PAYMASTER_ADDRESS || !SMART_ACCOUNT_ADDRESS || !TEST_TOKEN_ADDRESS)
  throw "⛔️ Missing contract addresses! Add it to the .env file!";

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running script to interact with contract ${SMART_ACCOUNT_ADDRESS}`);

  // @ts-ignore
  const provider = new Provider(hre.userConfig.networks?.zkSyncTestnet?.url);
  const alice = new ethers.Wallet(ALICE_PRIVATE_KEY, provider);
  const bob = new ethers.Wallet(BOB_PRIVATE_KEY, provider);
  const accountWallet = new ethers.Wallet(SMART_ACCOUNT_PRIVATE_KEY, provider);
  const witness = new ethers.Wallet(WITNESS_PRIVATE_KEY, provider);

  // Initialize contract instance
  const accountContract = new ethers.Contract(
    SMART_ACCOUNT_ADDRESS,
    AccountArtifact.abi,
    alice
  ) as Account;
  const paymaster = new ethers.Contract(
    PAYMASTER_ADDRESS,
    PaymasterArtifact.abi,
    alice
  ) as Paymaster;
  const token = new ethers.Contract(
    TEST_TOKEN_ADDRESS,
    TestTokenArtifact.abi,
    alice
  ) as TestToken;
    
  // Fund paymaster
  const expectedBalance = ethers.utils.parseEther("0.1");
  const currentBalance = await paymaster.balanceOf(alice.address);
  if (expectedBalance.gt(currentBalance)) {
    const fundTx = await alice.sendTransaction({
      to: paymaster.address,
      value: expectedBalance.sub(currentBalance)
    });
    await fundTx.wait();
  }

  // Generate VCs
  const { address: inBlancoVCAddress } = ethers.Wallet.createRandom();
  const { address: registeredAccountVCAddress } = ethers.Wallet.createRandom();
  const { address: transactionPaidVCAddress } = ethers.Wallet.createRandom();
  const inBlancoVC = new VC(
    ["https://www.w3.org/ns/credentials/v2"],
    `did:ethr:${inBlancoVCAddress}`,
    ["VerifiableCredential", "InBlancoAccountController"],
    new Issuer(`did:ethr:${accountWallet.address}`),
    new GenericCredentialSubject(
      `did:ethr:${accountWallet.address}`,
    ),
  );
  const registeredAccountVC = new VC(
    ["https://www.w3.org/ns/credentials/v2"],
    `did:ethr:${registeredAccountVCAddress}`,
    ["VerifiableCredential", "RegisteredAccountController"],
    new Issuer(`did:ethr:${witness.address}`),
    new RegisteredAccountControllerCredentialSubject(
      `did:ethr:${bob.address}`,
      new RegistrationClaim(inBlancoVC.id),
    ),
  );
  const transactionPaidVC = new VC(
    ["https://www.w3.org/ns/credentials/v2"],
    `did:ethr:${transactionPaidVCAddress}`,
    ["VerifiableCredential", "TransactionPaid"],
    new Issuer(`did:ethr:${alice.address}`), // issuer, a.k.a. sponsor
    new GenericCredentialSubject(
      `did:ethr:${accountContract.address}` // subject, a.k.a. spender
    ),
  );

  // Create paymaster params
  const encodings = new ethers.utils.Interface(IEncodingsArtifact.abi);
  const paymasterDomainSeparator = await paymaster.eip712Domain();
  const paymasterInnerInput = encodings.encodeFunctionData("paymasterInnerInput", [
    transactionPaidVC,
    await transactionPaidVC.sign(alice, paymasterDomainSeparator),
  ]);
  const paymasterParams = utils.getPaymasterParams(paymaster.address, {
    type: "General",
    innerInput: paymasterInnerInput.replace(encodings.getSighash("paymasterInnerInput"), "0x")
  })

  // Prepare tx
  const mintTx = await token.populateTransaction.mint(bob.address, ethers.utils.parseEther("1"));
  const gasLimit = (await bob.provider.estimateGas(mintTx)).add(70000);
  const gasPrice = await bob.provider.getGasPrice();
  const tx = {
    ...mintTx,
    from: accountContract.address,
    gasLimit,
    gasPrice,
    chainId: (await bob.provider.getNetwork()).chainId,
    nonce: await bob.provider.getTransactionCount(accountContract.address),
    type: 113,
    value: ethers.BigNumber.from(0),
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams,
    } as types.Eip712Meta,
  };

  // Create signature
  const accountDomainSeparator = await accountContract.eip712Domain();
  const signedTxHash = EIP712Signer.getSignedDigest(tx);
  tx.customData.customSignature = encodings.encodeFunctionData("accountSignature", [
    inBlancoVC,
    await inBlancoVC.sign(accountWallet, accountDomainSeparator),
    registeredAccountVC,
    await registeredAccountVC.sign(witness, accountDomainSeparator),
    ethers.utils.joinSignature(bob._signingKey().signDigest(signedTxHash)),
  ]);
    
  // Send tx
  console.log(`Bobs balance before: ${await token.balanceOf(bob.address)}`)
  const serializedTx = utils.serialize({ ...tx });
  const sentTx = await bob.provider.sendTransaction(serializedTx);
  await sentTx.wait();
  console.log(`Bobs balance after: ${await token.balanceOf(bob.address)}`)
}
