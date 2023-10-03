import { TypedDataSigner } from "@ethersproject/abstract-signer";
import {
  DID,
  DIDWithKeys,
  createCredential,
} from "@jpmorganchase/onyx-ssi-sdk";
import { EIP712Service } from "@kacperzuk-neti/eip712service";
import { Contract, Signer, Wallet } from "zksync-web3";
import { Address } from "zksync-web3/build/src/types";
import { WITNESS_ENDPOINT } from "./config";
import {
  CONTRACTS,
  getPaymasterContract,
  getWriteContractByAddress,
} from "./contract";

export function did2address(did: DID): string {
  // FIXME need proper parser
  return did.split(":").pop() ?? "";
}

export async function createInBlancoVC(
  accountContract: Contract,
  accountDid: DIDWithKeys
) {
  const { address: vcAddress } = Wallet.createRandom();
  const vc = createCredential(
    accountDid.did, // issuer
    accountDid.did, // subject
    {},
    ["InBlancoAccountController"],
    {
      id: `did:ethr:${vcAddress}`,
    }
  );
  const types = {
    CredentialSubject: [{ name: "id", type: "string" }],
    Issuer: [{ name: "id", type: "string" }],
  };
  const domain = await accountContract.eip712Domain();
  const service = new EIP712Service(domain);
  const proofValue = await service.signVC(accountDid, vc, types);
  return { vc, proofValue };
}

export async function createTransactionPaidVC(
  accountContract: Contract,
  signer: Signer & TypedDataSigner
) {
  const paymaster = await getPaymasterContract(signer);
  const { address: vcAddress } = Wallet.createRandom();
  const signerAddress = await signer.getAddress();
  const vc = createCredential(
    `did:ethr:${signerAddress}`, // issuer, a.k.a. sponsor, a.k.a. metamask address
    `did:ethr:${accountContract.address}`, // subject, a.k.a. smart account contract
    {},
    ["TransactionPaid"],
    {
      id: `did:ethr:${vcAddress}`,
    }
  );
  const types = {
    CredentialSubject: [{ name: "id", type: "string" }],
    Issuer: [{ name: "id", type: "string" }],
  };
  const domain = await paymaster.eip712Domain();
  const service = new EIP712Service(domain);
  const proofValue = await service.signVCWithEthers(signer, vc, types);
  return {
    vc,
    proofValue,
  };
}

export async function fetchRegisteredAccountVC(
  accountAddress: Address,
  inBlancoVCId: DID,
  signer: Signer
) {
  const accountContract = getWriteContractByAddress(
    CONTRACTS.Account,
    accountAddress,
    signer
  );

  const {
    name,
    version,
    chainId,
    verifyingContract,
  } = await accountContract.eip712Domain();

  const domainSeparator = {
    name,
    version,
    chainId,
    verifyingContract,
  };

  const subjectId = `did:ethr:${await signer.getAddress()}`;
  const body = { domainSeparator, subjectId, inBlancoVCId };

  const resp = await fetch(WITNESS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return resp.json();
}
