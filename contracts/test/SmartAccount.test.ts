import { expect } from 'chai';
import { Wallet, Provider, utils, EIP712Signer, types } from 'zksync-web3';
import * as hre from 'hardhat';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Account, DummyPaymaster, TestToken } from '../typechain-types';
import { Issuer, VC, GenericCredentialSubject, RegisteredAccountControllerCredentialSubject, RegistrationClaim } from '@kacperzuk-neti/chalcedony-vcs';
import { TypedDataDomain, ethers } from 'ethers';
import { PaymasterParams } from 'zksync-web3/build/src/types';

const RICH_WALLET_PK =
  '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';
const RICH_WALLET_PK_2 =
  '0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3';
const RICH_WALLET_PK_3 =
  '0xd293c684d884d56f8d6abd64fc76757d3664904e309a0645baf8522ab6366d9e';

describe('Smart Account', function () {
  let account: Account;
  let paymaster: DummyPaymaster;
  let inBlancoVC: VC<GenericCredentialSubject>;
  let registeredAccountVC: VC<RegisteredAccountControllerCredentialSubject>;
  let signer: Wallet;
  let witness: Wallet;
  let smartAccountSigner: Wallet;
  let token: TestToken;
  let domainSeparator: TypedDataDomain;
  let smartAccountDid: string;
  let witnessDid: string;
  let paymasterParams: PaymasterParams;
  let IEncodings: ethers.utils.Interface;

  beforeEach(async function () {
    const provider = Provider.getDefaultProvider();

    signer = new Wallet(RICH_WALLET_PK, provider);
    witness = new Wallet(RICH_WALLET_PK_2, provider);
    smartAccountSigner = new Wallet(RICH_WALLET_PK_3, provider);
    smartAccountDid = `did:ethr:${smartAccountSigner.address}`;
    witnessDid = `did:ethr:${witness.address}`;
    const deployer = new Deployer(hre, signer);
    const accountDeployer = new Deployer(hre, signer, 'createAccount');

    IEncodings = new ethers.utils.Interface(
      (await deployer.loadArtifact('IEncodings')).abi
    );
    account = await accountDeployer.deploy(await deployer.loadArtifact('Account'), [
      smartAccountDid,
      witnessDid,
    ]) as Account;
    paymaster = await deployer.deploy(await deployer.loadArtifact('DummyPaymaster'), []) as DummyPaymaster;
    token = await deployer.deploy(await deployer.loadArtifact('TestToken'), []) as TestToken;

    domainSeparator = await account.eip712Domain();
    inBlancoVC = new VC(
      ["https://www.w3.org/ns/credentials/v2"],
      "did:ethr:0x0000000000000000000000000000000000000000",
      ["VerifiableCredential", "InBlancoAccountController"],
      new Issuer(smartAccountDid),
      new GenericCredentialSubject(
        smartAccountDid,
      ),
    );
    registeredAccountVC = new VC(
      ["https://www.w3.org/ns/credentials/v2"],
      "did:ethr:0x0000000000000000000000000000000000000001",
      ["VerifiableCredential", "RegisteredAccountController"],
      new Issuer(witnessDid),
      new RegisteredAccountControllerCredentialSubject(
        `did:ethr:${signer.address}`,
        new RegistrationClaim(inBlancoVC.id),
      ),
    );
    const fundTx = await signer.sendTransaction({
      to: paymaster.address,
      value: ethers.utils.parseEther("100")
    });
    await fundTx.wait();

    paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "General",
      innerInput: []
    });
  });

  it("Should execute legit transactions", async function () {
    const mintTx = await token.populateTransaction.mint(signer.address, ethers.utils.parseEther("1"));
    const gasLimit = (await signer.provider.estimateGas(mintTx)).add(100000);
    const gasPrice = await signer.provider.getGasPrice();

    const tx = {
      ...mintTx,
      from: account.address,
      gasLimit,
      gasPrice,
      chainId: (await signer.provider.getNetwork()).chainId,
      nonce: await signer.provider.getTransactionCount(account.address),
      type: 113,
      value: ethers.BigNumber.from(0),
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      } as types.Eip712Meta,
    };
    const signedTxHash = EIP712Signer.getSignedDigest(tx);

    const customSig = ethers.utils.joinSignature(signer._signingKey().signDigest(signedTxHash));
    tx.customData.customSignature = IEncodings.encodeFunctionData("accountSignature", [
      inBlancoVC,
      await inBlancoVC.sign(smartAccountSigner, domainSeparator),
      registeredAccountVC,
      await registeredAccountVC.sign(witness, domainSeparator),
      ethers.utils.joinSignature(signer._signingKey().signDigest(signedTxHash)),
    ]);
    const serializedTx = utils.serialize({ ...tx });
    const sentTx = signer.provider.sendTransaction(serializedTx);
    await expect(sentTx).to.not.be.reverted;
    expect(await token.balanceOf(signer.address)).to.be.equal(ethers.utils.parseEther("1001"));
  });

  it("Should reject invalid signature", async function () {
    const mintTx = await token.populateTransaction.mint(signer.address, ethers.utils.parseEther("1"));
    const gasLimit = (await signer.provider.estimateGas(mintTx)).add(100000);
    const gasPrice = await signer.provider.getGasPrice();

    const tx = {
      ...mintTx,
      from: account.address,
      gasLimit,
      gasPrice,
      chainId: (await signer.provider.getNetwork()).chainId,
      nonce: await signer.provider.getTransactionCount(account.address),
      type: 113,
      value: ethers.BigNumber.from(0),
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      } as types.Eip712Meta,
    };
    tx.customData.customSignature = "0x0000000000";
    const serializedTx = utils.serialize({ ...tx });
    const sentTx = signer.provider.sendTransaction(serializedTx);
    await expect(sentTx).to.be.reverted;
  });

  it("Should reject invalid eoa signature", async function () {
    const mintTx = await token.populateTransaction.mint(signer.address, ethers.utils.parseEther("1"));
    const gasLimit = (await signer.provider.estimateGas(mintTx)).add(100000);
    const gasPrice = await signer.provider.getGasPrice();

    const tx = {
      ...mintTx,
      from: account.address,
      gasLimit,
      gasPrice,
      chainId: (await signer.provider.getNetwork()).chainId,
      nonce: await signer.provider.getTransactionCount(account.address),
      type: 113,
      value: ethers.BigNumber.from(0),
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      } as types.Eip712Meta,
    };
    const signedTxHash = EIP712Signer.getSignedDigest(tx);

    tx.customData.customSignature = IEncodings.encodeFunctionData("accountSignature", [
      inBlancoVC,
      await inBlancoVC.sign(smartAccountSigner, domainSeparator),
      registeredAccountVC,
      await registeredAccountVC.sign(witness, domainSeparator),
      ethers.utils.joinSignature(witness._signingKey().signDigest(signedTxHash)),
    ]);
    const serializedTx = utils.serialize({ ...tx });
    const sentTx = signer.provider.sendTransaction(serializedTx);
    await expect(sentTx).to.be.reverted;
  });

  it("Should reject mismatched InBlanco issuer", async function () {
    inBlancoVC.issuer.id = `did:ethr:${witness.address}`;
    const mintTx = await token.populateTransaction.mint(signer.address, ethers.utils.parseEther("1"));
    const gasLimit = (await signer.provider.estimateGas(mintTx)).add(100000);
    const gasPrice = await signer.provider.getGasPrice();

    const tx = {
      ...mintTx,
      from: account.address,
      gasLimit,
      gasPrice,
      chainId: (await signer.provider.getNetwork()).chainId,
      nonce: await signer.provider.getTransactionCount(account.address),
      type: 113,
      value: ethers.BigNumber.from(0),
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      } as types.Eip712Meta,
    };
    const signedTxHash = EIP712Signer.getSignedDigest(tx);

    tx.customData.customSignature = IEncodings.encodeFunctionData("accountSignature", [
      inBlancoVC,
      await inBlancoVC.sign(witness, domainSeparator),
      registeredAccountVC,
      await registeredAccountVC.sign(witness, domainSeparator),
      ethers.utils.joinSignature(signer._signingKey().signDigest(signedTxHash)),
    ]);
    const serializedTx = utils.serialize({ ...tx });
    const sentTx = signer.provider.sendTransaction(serializedTx);
    await expect(sentTx).to.be.reverted;
  });

  it("Should reject invalid InBlanco signature", async function () {
    const mintTx = await token.populateTransaction.mint(signer.address, ethers.utils.parseEther("1"));
    const gasLimit = (await signer.provider.estimateGas(mintTx)).add(100000);
    const gasPrice = await signer.provider.getGasPrice();

    const tx = {
      ...mintTx,
      from: account.address,
      gasLimit,
      gasPrice,
      chainId: (await signer.provider.getNetwork()).chainId,
      nonce: await signer.provider.getTransactionCount(account.address),
      type: 113,
      value: ethers.BigNumber.from(0),
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      } as types.Eip712Meta,
    };
    const signedTxHash = EIP712Signer.getSignedDigest(tx);

    tx.customData.customSignature = IEncodings.encodeFunctionData("accountSignature", [
      inBlancoVC,
      await inBlancoVC.sign(witness, domainSeparator),
      registeredAccountVC,
      await registeredAccountVC.sign(witness, domainSeparator),
      ethers.utils.joinSignature(signer._signingKey().signDigest(signedTxHash)),
    ]);
    const serializedTx = utils.serialize({ ...tx });
    const sentTx = signer.provider.sendTransaction(serializedTx);
    await expect(sentTx).to.be.reverted;
  });

  it("Should reject invalid RegisteredAccount issuer", async function () {
    registeredAccountVC.issuer.id = smartAccountDid;
    const mintTx = await token.populateTransaction.mint(signer.address, ethers.utils.parseEther("1"));
    const gasLimit = (await signer.provider.estimateGas(mintTx)).add(100000);
    const gasPrice = await signer.provider.getGasPrice();

    const tx = {
      ...mintTx,
      from: account.address,
      gasLimit,
      gasPrice,
      chainId: (await signer.provider.getNetwork()).chainId,
      nonce: await signer.provider.getTransactionCount(account.address),
      type: 113,
      value: ethers.BigNumber.from(0),
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      } as types.Eip712Meta,
    };
    const signedTxHash = EIP712Signer.getSignedDigest(tx);

    tx.customData.customSignature = IEncodings.encodeFunctionData("accountSignature", [
      inBlancoVC,
      await inBlancoVC.sign(smartAccountSigner, domainSeparator),
      registeredAccountVC,
      await registeredAccountVC.sign(smartAccountSigner, domainSeparator),
      ethers.utils.joinSignature(signer._signingKey().signDigest(signedTxHash)),
    ]);
    const serializedTx = utils.serialize({ ...tx });
    const sentTx = signer.provider.sendTransaction(serializedTx);
    await expect(sentTx).to.be.reverted;
  });

  it("Should reject invalid subject", async function () {
    registeredAccountVC.credentialSubject.id = smartAccountDid;
    const mintTx = await token.populateTransaction.mint(signer.address, ethers.utils.parseEther("1"));
    const gasLimit = (await signer.provider.estimateGas(mintTx)).add(100000);
    const gasPrice = await signer.provider.getGasPrice();

    const tx = {
      ...mintTx,
      from: account.address,
      gasLimit,
      gasPrice,
      chainId: (await signer.provider.getNetwork()).chainId,
      nonce: await signer.provider.getTransactionCount(account.address),
      type: 113,
      value: ethers.BigNumber.from(0),
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      } as types.Eip712Meta,
    };
    const signedTxHash = EIP712Signer.getSignedDigest(tx);

    tx.customData.customSignature = IEncodings.encodeFunctionData("accountSignature", [
      inBlancoVC,
      await inBlancoVC.sign(smartAccountSigner, domainSeparator),
      registeredAccountVC,
      await registeredAccountVC.sign(witness, domainSeparator),
      ethers.utils.joinSignature(signer._signingKey().signDigest(signedTxHash)),
    ]);
    const serializedTx = utils.serialize({ ...tx });
    const sentTx = signer.provider.sendTransaction(serializedTx);
    await expect(sentTx).to.be.reverted;
  });

  it("Should reject invalid tx signature", async function () {
    const mintTx = await token.populateTransaction.mint(signer.address, ethers.utils.parseEther("1"));
    const gasLimit = (await signer.provider.estimateGas(mintTx)).add(100000);
    const gasPrice = await signer.provider.getGasPrice();

    const tx = {
      ...mintTx,
      from: account.address,
      gasLimit,
      gasPrice,
      chainId: (await signer.provider.getNetwork()).chainId,
      nonce: await signer.provider.getTransactionCount(account.address),
      type: 113,
      value: ethers.BigNumber.from(0),
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      } as types.Eip712Meta,
    };
    const signedTxHash = EIP712Signer.getSignedDigest(tx);

    tx.customData.customSignature = IEncodings.encodeFunctionData("accountSignature", [
      inBlancoVC,
      await inBlancoVC.sign(smartAccountSigner, domainSeparator),
      registeredAccountVC,
      await registeredAccountVC.sign(witness, domainSeparator),
      "0x000000000000000000000000000000000000000000",
    ]);
    const serializedTx = utils.serialize({ ...tx });
    const sentTx = signer.provider.sendTransaction(serializedTx);
    await expect(sentTx).to.be.reverted;
  });

  it("Should reject mismatched registeredWith", async function () {
    registeredAccountVC.credentialSubject.registeredWith.id = "did:ethr:0x000000000000000000000";
    const mintTx = await token.populateTransaction.mint(signer.address, ethers.utils.parseEther("1"));
    const gasLimit = (await signer.provider.estimateGas(mintTx)).add(100000);
    const gasPrice = await signer.provider.getGasPrice();

    const tx = {
      ...mintTx,
      from: account.address,
      gasLimit,
      gasPrice,
      chainId: (await signer.provider.getNetwork()).chainId,
      nonce: await signer.provider.getTransactionCount(account.address),
      type: 113,
      value: ethers.BigNumber.from(0),
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      } as types.Eip712Meta,
    };
    const signedTxHash = EIP712Signer.getSignedDigest(tx);

    tx.customData.customSignature = IEncodings.encodeFunctionData("accountSignature", [
      inBlancoVC,
      await inBlancoVC.sign(smartAccountSigner, domainSeparator),
      registeredAccountVC,
      await registeredAccountVC.sign(witness, domainSeparator),
      ethers.utils.joinSignature(signer._signingKey().signDigest(signedTxHash)),
    ]);
    const serializedTx = utils.serialize({ ...tx });
    const sentTx = signer.provider.sendTransaction(serializedTx);
    await expect(sentTx).to.be.reverted;
  });
});
