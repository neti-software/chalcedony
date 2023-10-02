import { expect } from 'chai';
import { Wallet, Provider } from 'zksync-web3';
import * as hre from 'hardhat';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { VCGenericTest } from '../typechain-types';
import { VC, GenericCredentialSubject, Issuer } from '@kacperzuk-neti/chalcedony-vcs';

const RICH_WALLET_PK =
  '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe('VCGeneric', function () {
  let testContract: VCGenericTest;

  beforeEach(async function () {
    const provider = Provider.getDefaultProvider();

    let signer = new Wallet(RICH_WALLET_PK, provider);
    const deployer = new Deployer(hre, signer);

    const artifact = await deployer.loadArtifact('VCGenericTest');
    testContract = (await deployer.deploy(artifact, []) as VCGenericTest);
  });

  it("Should calculate correct hash", async function () {
    const vc = new VC(["asd"], "asd", ["asd", "dsa"], new Issuer("asd"), new GenericCredentialSubject("asd"));
    expect(await testContract.testHash(vc)).to.be.equal(vc.hash());
  });
});
