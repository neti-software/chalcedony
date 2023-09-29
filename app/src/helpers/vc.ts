import { Contract, Signer, Wallet } from "zksync-web3";
import { DID, DIDWithKeys, createCredential } from "@jpmorganchase/onyx-ssi-sdk";
import { EIP712Service } from "eip712service";
import { getPaymasterContract } from "./contract";
import { TypedDataSigner } from "@ethersproject/abstract-signer";

export function did2address(did: DID): string {
    // FIXME need proper parser
    return did.split(":").pop() ?? "";
}

export async function createInBlancoVC(accountContract: Contract, accountDid: DIDWithKeys) {
    const signer = new Wallet(accountDid.keyPair.privateKey);
    const { address: vcAddress } = Wallet.createRandom();
    const vc = createCredential(
        `did:ethr:${signer.address}`, // issuer
        `did:ethr:${signer.address}`, // subject
        { },
        ["InBlancoAccountController"],
        {
            id: `did:ethr:${vcAddress}`,
        },
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

export async function createTransactionPaidVC(accountContract: Contract, signer: Signer & TypedDataSigner) {
    const { address: vcAddress } = Wallet.createRandom();
    const signerAddress = await signer.getAddress();
    const vc = createCredential(
        `did:ethr:${signerAddress}`, // issuer, a.k.a. sponsor, a.k.a. metamask address
        `did:ethr:${accountContract.address}`, // subject, a.k.a. smart account contract
        { },
        ["TransactionPaid"],
        {
            id: `did:ethr:${vcAddress}`,
        },
    );
    const types = {
        CredentialSubject: [{ name: "id", type: "string" }],
        Issuer: [{ name: "id", type: "string" }],
    };
    const domain = await accountContract.eip712Domain();
    const service = new EIP712Service(domain);
    const proofValue = await service.signVCWithEthers(signer, vc, types);
    return {
        vc, proofValue
    };
}

const WITNESS_ENDPOINT = import.meta.env.VITE_WITNESS_ENDPOINT ?? "http://127.0.0.1:5000/api/v1/witness";
export async function fetchRegisteredAccountVC(inBlancoVCId: DID, signer: Signer) {
    const paymaster = getPaymasterContract(signer);
    const {
        name,
        version,
        chainId,
        verifyingContract,
        salt
    } = await paymaster.eip712Domain();
    const domainSeparator = {
        name,
        version,
        chainId,
        verifyingContract,
        salt
    };
    const subjectId = await signer.getAddress();
    const body = { domainSeparator, subjectId, inBlancoVCId };
    const resp = await fetch(WITNESS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return resp.json()
}