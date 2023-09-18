import { expect } from 'chai';
import { Wallet, Provider, Contract } from 'zksync-web3';
import * as hre from 'hardhat';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { Validator } from '../typechain-types';
import { VC } from '../typechain-types/contracts/Validator';

const RICH_WALLET_PK =
  '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

const vcTypes = {
  AuthorizationClaim: [
    { name: 'call', type: 'bytes' },
  ],
  CredentialSubject: [
    { name: 'id', type: 'string' },
    { name: 'authorizedTo', type: 'AuthorizationClaim' },
  ],
  VerifiableCredential: [
    { name: 'context', type: 'string[]' },
    { name: 'id', type: 'string' },
    { name: 'type_', type: 'string[]' },
    { name: 'issuer', type: 'string' },
    { name: 'credentialSubject', type: 'CredentialSubject' },
  ],
};

describe('Validator', function () {
  let validator: Validator;
  let vc: VC.VerifiableCredentialStruct;
  let proof: string;
  let signer: Wallet;

  beforeEach(async function () {
    const provider = Provider.getDefaultProvider();

    signer = new Wallet(RICH_WALLET_PK, provider);
    const deployer = new Deployer(hre, signer);

    const artifact = await deployer.loadArtifact('Validator');
    validator = (await deployer.deploy(artifact, []) as Validator);
    const domainSeparator = await validator.eip712Domain();
    vc = {
      context: ["https://www.w3.org/ns/credentials/v2"],
      id: "did:ethr:0xbaad",
      type_: ["VerifiableCredential", "MyCred"],
      issuer: "did:ethr:0xdeadbeaf",
      credentialSubject: {
        id: "did:ethr:0xc00ffebabe",
        authorizedTo: {
          call: "0xcafebabe"
        }
      }
    };
    proof = await signer._signTypedData({
      name: domainSeparator.name,
      version: domainSeparator.version,
      chainId: domainSeparator.chainId,
      verifyingContract: domainSeparator.verifyingContract,
    }, vcTypes, vc);
  });

  it("Should revert invalid signature", async function () {
    const proof = "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    await expect(validator.verifyVCSignature(vc, proof, validator.address)).to.be.revertedWith("ECDSA: invalid signature");
  });

  it("Should revert invalid signer", async function () {
    await expect(validator.verifyVCSignature(vc, proof, validator.address)).to.be.revertedWith("Invalid signer");
  });

  it("Should accept valid sig", async function () {
    await expect(validator.verifyVCSignature(vc, proof, signer.address)).to.not.be.reverted;
  });
});
