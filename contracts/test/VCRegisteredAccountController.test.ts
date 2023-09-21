import { expect } from 'chai';
import { Wallet, Provider } from 'zksync-web3';
import * as hre from 'hardhat';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { VCRegisteredAccountControllerTest } from '../typechain-types';
import { VC, RegisteredAccountControllerCredentialSubject, RegistrationClaim } from 'chalcedony-vcs';

const RICH_WALLET_PK =
  '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe('VCRegisteredAccountController', function () {
  let testContract: VCRegisteredAccountControllerTest;

  beforeEach(async function () {
    const provider = Provider.getDefaultProvider();

    let signer = new Wallet(RICH_WALLET_PK, provider);
    const deployer = new Deployer(hre, signer);

    const artifact = await deployer.loadArtifact('VCRegisteredAccountControllerTest');
    testContract = (await deployer.deploy(artifact, []) as VCRegisteredAccountControllerTest);
  });

  it("Should calculate correct hash", async function () {
    const subject = new RegisteredAccountControllerCredentialSubject(
      "asd",
      new RegistrationClaim("dsa")
    );
    const vc = new VC(["asd"], "asd", ["asd", "dsa"], "asd", subject);
    expect(await testContract.testHash(vc)).to.be.equal(vc.hash());
  });
});
