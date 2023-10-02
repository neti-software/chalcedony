import { expect } from 'chai';
import { Wallet, Provider, utils, EIP712Signer, types } from 'zksync-web3';
import * as hre from 'hardhat';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Account, AccountFactory, DummyPaymaster, TestToken } from '../typechain-types';
import { Issuer, VC, GenericCredentialSubject, RegisteredAccountControllerCredentialSubject, RegistrationClaim } from '@kacperzuk-neti/chalcedony-vcs';
import { Contract, TypedDataDomain, ethers } from 'ethers';
import { PaymasterParams } from 'zksync-web3/build/src/types';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/dist/types';

const RICH_WALLET_PK =
  '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';
const RICH_WALLET_PK_2 =
  '0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3';
const RICH_WALLET_PK_3 =
  '0xd293c684d884d56f8d6abd64fc76757d3664904e309a0645baf8522ab6366d9e';

describe('Factory', function () {
  let factory: AccountFactory;
  let signer: Wallet;
  let accountArtifact: ZkSyncArtifact;

  beforeEach(async function () {
    const provider = Provider.getDefaultProvider();

    signer = new Wallet(RICH_WALLET_PK, provider);
    const deployer = new Deployer(hre, signer);
    const factoryArtifact = await deployer.loadArtifact("AccountFactory");
    accountArtifact = await deployer.loadArtifact("Account");
    const bytecodeHash = utils.hashBytecode(accountArtifact.bytecode);
    factory = await deployer.deploy(factoryArtifact, [bytecodeHash], undefined, [
      accountArtifact.bytecode,
    ]) as AccountFactory;
  });

  it("Should deploy account", async function () {
    const salt = ethers.constants.HashZero;
    const tx = await factory.deployAccount(salt, "asd", "dsa");
    await tx.wait();
    const abiCoder = new ethers.utils.AbiCoder();
    const accountAddress = utils.create2Address(
      factory.address,
      await factory.bytecodeHash(),
      salt,
      abiCoder.encode(["string", "string"], ["asd", "dsa"])
    );
    const accountContract = new Contract(accountAddress, accountArtifact.abi, signer)
    await accountContract.eip712Domain();
  });
});
