import { expect } from 'chai';
import { Wallet, Provider } from 'zksync-web3';
import * as hre from 'hardhat';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { DIDUtilsTest } from '../typechain-types';
import { _TypedDataEncoder } from 'ethers/lib/utils';
import { ethers } from 'ethers';

const RICH_WALLET_PK =
  '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe('DIDUtils', function () {
  let testContract: DIDUtilsTest;

  beforeEach(async function () {
    const provider = Provider.getDefaultProvider();

    let signer = new Wallet(RICH_WALLET_PK, provider);
    const deployer = new Deployer(hre, signer);

    const artifact = await deployer.loadArtifact('DIDUtilsTest');
    testContract = (await deployer.deploy(artifact, []) as DIDUtilsTest);
  });

  it("Should correctly parse hex characters", async function () {
    const testVector = [
      '0','1','2','3','4','5','6','7','8','9',
      'a','b','c','d','e','f',
      'A','B','C','D','E','F',
    ];

    for(let i = 0; i < testVector.length; i++) {
      const charCode = testVector[i].charCodeAt(0);
      const value = parseInt(testVector[i], 16);
      const result = await testContract.testParseHexChar([charCode]);
      expect(result).to.be.equal(value);
    }
  });

  it("Should correctly parse hex strings", async function () {
    const testVector = Buffer.from('hello world', 'utf8');
    const hexString = testVector.toString('hex');
    const result = await testContract.testParseHexString(hexString);
    expect(result).to.be.equal('0x'+hexString);
  });

  it("Should correctly parse DIDs", async function () {
    const testVector = [
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
      "0x90F79BF6EB2C4F870365E785982E1F101E93B906",
    ];

    for(let i = 0; i < testVector.length; i++) {
      const v = testVector[i];
      const expected = ethers.utils.getAddress(v);
      expect(await testContract.testParseAddress(`did:ethr:${v}`))
        .to.be.equal(expected);
      expect(await testContract.testParseAddress(`did:ethr:goerli:${v}`))
        .to.be.equal(expected);
      expect(await testContract.testParseAddress(`did:key:${v}`))
        .to.be.equal(expected);
      expect(await testContract.testParseAddress(`did:ethr:goerli:${v}#blockchainAddress`))
        .to.be.equal(expected);
    }
  })
});
