import { expect } from 'chai';
import { Wallet, Provider } from 'zksync-web3';
import * as hre from 'hardhat';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { EIP712UtilsTest } from '../typechain-types';
import { _TypedDataEncoder, hexConcat, keccak256, toUtf8Bytes } from 'ethers/lib/utils';

const RICH_WALLET_PK =
  '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe('EIP712Utils', function () {
  let testContract: EIP712UtilsTest;

  beforeEach(async function () {
    const provider = Provider.getDefaultProvider();

    let signer = new Wallet(RICH_WALLET_PK, provider);
    const deployer = new Deployer(hre, signer);

    const artifact = await deployer.loadArtifact('EIP712UtilsTest');
    testContract = (await deployer.deploy(artifact, []) as EIP712UtilsTest);
  });

  it("Should correctly hash string array", async function () {
    const array = ["1", "2", "3"];
    const expectedHash = keccak256(hexConcat(array.map(v => keccak256(toUtf8Bytes(v)))))
    expect(await testContract.testHashStringArray(array)).to.be.equal(expectedHash);
  });
});
