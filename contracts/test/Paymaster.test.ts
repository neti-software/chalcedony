import { expect } from 'chai';
import { Wallet, Provider, utils } from 'zksync-web3';
import * as hre from 'hardhat';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Paymaster, TestToken } from '../typechain-types';
import { VC, GenericCredentialSubject } from 'chalcedony-vcs';
import { BigNumber, TypedDataDomain, ethers } from 'ethers';
import { PaymasterParams } from 'zksync-web3/build/src/types';

const RICH_WALLET_PK =
  '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';
const RICH_WALLET_PK_2 =
  '0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3';

describe('Paymaster', function () {
  let paymaster: Paymaster;
  let vc: VC<GenericCredentialSubject>;
  let signer: Wallet;
  let signer2: Wallet;
  let token: TestToken;
  let domainSeparator: TypedDataDomain;
  let paymasterParams: PaymasterParams;

  beforeEach(async function () {
    const provider = Provider.getDefaultProvider();

    signer = new Wallet(RICH_WALLET_PK, provider);
    signer2 = new Wallet(RICH_WALLET_PK_2, provider);
    const deployer = new Deployer(hre, signer);

    paymaster = await deployer.deploy(await deployer.loadArtifact('Paymaster'), []) as Paymaster;
    token = await deployer.deploy(await deployer.loadArtifact('TestToken'), []) as TestToken;

    domainSeparator = await paymaster.eip712Domain();
    vc = new VC(
      ["https://www.w3.org/ns/credentials/v2"],
      "did:ethr:0x0000000000000000000000000000000000000000",
      ["VerifiableCredential", "TransactionPaid"],
      `did:ethr:${signer.address}`, // issuer, a.k.a. sponsor
      new GenericCredentialSubject(
        `did:ethr:${signer.address}` // subject, a.k.a. spender
      ),
    );
    const fundTx = await signer.sendTransaction({
      to: paymaster.address,
      value: ethers.utils.parseEther("100")
    });
    await fundTx.wait();

    paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "General",
      innerInput: await vc.singAndEncode(signer, domainSeparator)
    });
  });

  it("Should pay for legit transactions", async function () {
    const sentTx = token.mint(signer.address, 10, {
      gasLimit: 2000000,
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      }
    })
    await expect(sentTx).to.not.be.reverted;
  });

  it("Should refuse invalid paymaster flow", async function () {
    const paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "ApprovalBased",
      minimalAllowance: BigNumber.from(1),
      token: token.address,
      innerInput: await vc.singAndEncode(signer, domainSeparator),
    });
    const tx = token.mint(signer.address, 10, {
      gasLimit: 2000000,
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      }
    })
    await expect(tx).to.be.reverted;
  });

  it("Should refuse underfunded", async function () {
    vc.issuer = `did:ethr:${signer2.address}`;
    vc.credentialSubject.id = vc.issuer;
    paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "General",
      innerInput: await vc.singAndEncode(signer2, domainSeparator)
    });
    
    const tx = token.connect(signer2).mint(signer.address, 10, {
      gasLimit: 2000000,
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      }
    })
    await expect(tx).to.be.reverted;
  });

  it("Should refuse invalid subject", async function () {
    vc.credentialSubject.id = "0x0000000000000000000000000000000000000000";
    paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "General",
      innerInput: await vc.singAndEncode(signer, domainSeparator)
    });
    
    const tx = token.mint(signer.address, 10, {
      gasLimit: 2000000,
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      }
    })
    await expect(tx).to.be.reverted;
  });

  it("Should refuse mismatched sponsor", async function () {
    const fundTx = await signer2.sendTransaction({
      to: paymaster.address,
      value: ethers.utils.parseEther("100")
    });
    await fundTx.wait();

    vc.issuer = signer2.address;
    paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "General",
      innerInput: await vc.singAndEncode(signer, domainSeparator)
    });
    
    const tx = token.mint(signer.address, 10, {
      gasLimit: 2000000,
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      }
    })
    await expect(tx).to.be.reverted;
  });

  it("Should refuse incorrect VC type", async function () {
    vc.type_ = ["VerifiableCredential"];
    paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "General",
      innerInput: await vc.singAndEncode(signer, domainSeparator)
    });
    
    let tx = token.mint(signer.address, 10, {
      gasLimit: 2000000,
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      }
    })
    await expect(tx).to.be.reverted;

    vc.type_ = ["VerifiableCredential", "NotTransactionPaid"];
    paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "General",
      innerInput: await vc.singAndEncode(signer, domainSeparator)
    });
    
    tx = token.mint(signer.address, 10, {
      gasLimit: 2000000,
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      }
    })
    await expect(tx).to.be.reverted;

    vc.type_ = ["VerifiableCredential", "TransactionPaid", "TooMuch"];
    paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "General",
      innerInput: await vc.singAndEncode(signer, domainSeparator)
    });
    
    tx = token.mint(signer.address, 10, {
      gasLimit: 2000000,
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      }
    })
    await expect(tx).to.be.reverted;
  });

  it("Should refuse used VCs", async function () {
    let sentTx = token.mint(signer.address, 10, {
      gasLimit: 2000000,
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      }
    })
    await expect(sentTx).to.not.be.reverted;

    sentTx = token.mint(signer.address, 10, {
      gasLimit: 2000000,
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      }
    })
    await expect(sentTx).to.be.reverted;
  });

  it("Should deduce sponsors balance", async function () {
    const initialBalance = await paymaster.balanceOf(signer.address);
    const gasPrice = await signer.provider.getGasPrice();
    const gasLimit = 2000000;
    const sentTx = await token.mint(signer.address, 10, {
      gasLimit,
      gasPrice,
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      }
    })
    await sentTx.wait();
    const expectedBalance = initialBalance.sub(gasPrice.mul(gasLimit));
    expect(await paymaster.balanceOf(signer.address)).to.be.equal(expectedBalance);
  });

});
