import { expect } from 'chai';
import { Wallet, Provider, utils } from 'zksync-web3';
import * as hre from 'hardhat';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Paymaster, TestToken } from '../typechain-types';
import { VC, GenericCredentialSubject, Issuer } from '@kacperzuk-neti/chalcedony-vcs';
import { BigNumber, BytesLike, TypedDataDomain, ethers } from 'ethers';
import { PaymasterParams } from 'zksync-web3/build/src/types';

const RICH_WALLET_PK =
  '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';
const RICH_WALLET_PK_2 =
  '0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3';

async function paymasterInnerInput(
  encodings: ethers.utils.Interface,
  vc: VC<GenericCredentialSubject>,
  signer: Wallet,
  domainSeparator: TypedDataDomain
): Promise<BytesLike> {
  const withSelector = encodings.encodeFunctionData("paymasterInnerInput", [
        vc,
        await vc.sign(signer, domainSeparator),
      ])
  // strip selector
  return withSelector.replace(encodings.getSighash("paymasterInnerInput"), "0x");
}

describe('Paymaster', function () {
  let paymaster: Paymaster;
  let vc: VC<GenericCredentialSubject>;
  let signer: Wallet;
  let signer2: Wallet;
  let token: TestToken;
  let domainSeparator: TypedDataDomain;
  let paymasterParams: PaymasterParams;
  let IEncodings: ethers.utils.Interface;

  beforeEach(async function () {
    const provider = Provider.getDefaultProvider();

    signer = new Wallet(RICH_WALLET_PK, provider);
    signer2 = new Wallet(RICH_WALLET_PK_2, provider);
    const deployer = new Deployer(hre, signer);

    IEncodings = new ethers.utils.Interface(
      (await deployer.loadArtifact('IEncodings')).abi
    );
    paymaster = await deployer.deploy(await deployer.loadArtifact('Paymaster'), []) as Paymaster;
    token = await deployer.deploy(await deployer.loadArtifact('TestToken'), []) as TestToken;

    domainSeparator = await paymaster.eip712Domain();
    vc = new VC(
      ["https://www.w3.org/ns/credentials/v2"],
      "did:ethr:0x0000000000000000000000000000000000000000",
      ["VerifiableCredential", "TransactionPaid"],
      new Issuer(`did:ethr:${signer.address}`), // issuer, a.k.a. sponsor
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
      innerInput: await paymasterInnerInput(IEncodings, vc, signer, domainSeparator)
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
      innerInput: await paymasterInnerInput(IEncodings, vc, signer, domainSeparator)
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
    vc.issuer.id = `did:ethr:${signer2.address}`;
    vc.credentialSubject.id = vc.issuer.id;
    paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "General",
      innerInput: await paymasterInnerInput(IEncodings, vc, signer, domainSeparator), 
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
      innerInput: await paymasterInnerInput(IEncodings, vc, signer, domainSeparator)
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

    vc.issuer.id = signer2.address;
    paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "General",
      innerInput: await paymasterInnerInput(IEncodings, vc, signer, domainSeparator)
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
    vc._type = ["VerifiableCredential"];
    paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "General",
      innerInput: await paymasterInnerInput(IEncodings, vc, signer, domainSeparator)
    });
    
    let tx = token.mint(signer.address, 10, {
      gasLimit: 2000000,
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      }
    })
    await expect(tx).to.be.reverted;

    vc._type = ["VerifiableCredential", "NotTransactionPaid"];
    paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "General",
      innerInput: await paymasterInnerInput(IEncodings, vc, signer, domainSeparator)
    });
    
    tx = token.mint(signer.address, 10, {
      gasLimit: 2000000,
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams,
      }
    })
    await expect(tx).to.be.reverted;

    vc._type = ["VerifiableCredential", "TransactionPaid", "TooMuch"];
    paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: "General",
      innerInput: await paymasterInnerInput(IEncodings, vc, signer, domainSeparator)
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
