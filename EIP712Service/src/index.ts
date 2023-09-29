import { TypedDataSigner } from "@ethersproject/abstract-signer";
import { DIDWithKeys } from "@jpmorganchase/onyx-ssi-sdk";
import { CredentialPayload } from "did-jwt-vc";
import { Wallet, Signer } from "ethers";

// TYPES
export interface EIP712Config {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

export interface TypedData {
  name: string;
  type:
    | "bool"
    | "uint8"
    | "uint16"
    | "uint32"
    | "uint64"
    | "uint128"
    | "uint256"
    | "address"
    | "string"
    | "string[]"
    | "bytes"
    | "bytes32"
    | "Issuer"
    | "CredentialSubject"
    | "CredentialSchema"
    | "Proof";
}
export interface EIP712MessageTypes {
  EIP712Domain: TypedData[];
  [additionalProperties: string]: TypedData[];
}

export interface EIP712DomainTypedData {
  chainId: number;
  name: string;
  verifyingContract: string;
  version: string;
}
export interface EIP712TypedData<T extends EIP712MessageTypes> {
  types: T;
  primaryType: keyof T;
  domain: EIP712DomainTypedData;
  message: any;
}
export interface EIP712CredentialMessageTypes extends EIP712MessageTypes {
  VerifiableCredential: typeof VERIFIABLE_CREDENTIAL_EIP712_TYPE;
  Issuer: any;
  CredentialSubject: any;
  CredentialSchema: typeof CREDENTIAL_SCHEMA_EIP712_TYPE;
  Proof: typeof PROOF_EIP712_TYPE;
}
export type Extensible<T> = T & { [x: string]: any };

export type EIP712CredentialPayload = {
  _context: string[];
  _type: string[];
  id: string;
  issuer: Extensible<{ id: string }> | string;
  credentialSubject: Extensible<{
    id?: string;
  }>;
};
export type EIP712Credential = Extensible<EIP712CredentialPayload>;
export interface EIP712CredentialTypedData
  extends EIP712TypedData<EIP712CredentialMessageTypes> {
  message: EIP712Credential;
}

// CONSTS

export const VERIFIABLE_CREDENTIAL_PRIMARY_TYPE = "VerifiableCredential";
export const VERIFIABLE_CREDENTIAL_EIP712_TYPE: TypedData[] = [
  { name: "_context", type: "string[]" },
  { name: "id", type: "string" },
  { name: "_type", type: "string[]" },
  { name: "issuer", type: "Issuer" },
  { name: "credentialSubject", type: "CredentialSubject" },
];
export const CREDENTIAL_SCHEMA_EIP712_TYPE: TypedData[] = [
  { name: "_context", type: "string[]" },
  { name: "id", type: "string" },
  { name: "_type", type: "string[]" },
  { name: "issuer", type: "Issuer" },
  {
    name: "credentialSubject",
    type: "CredentialSubject",
  },
];
export const PROOF_EIP712_TYPE: TypedData[] = [
  { name: "verificationMethod", type: "string" },
  { name: "ethereumAddress", type: "address" },
  { name: "created", type: "string" },
  { name: "proofPurpose", type: "string" },
  { name: "_type", type: "string" },
];

export class EIP712Service {
  private eip712Config: EIP712Config;
  public name = "EIP712";

  public constructor(eip712Config: EIP712Config) {
    this.eip712Config = eip712Config;
  }

  public async signVCWithEthers(
    signer: TypedDataSigner & Signer,
    token: CredentialPayload,
    credentialSubjectTypes: any
  ): Promise<string> {
    const credentialTypedData = this.getEIP712CredentialTypedData(
      token,
      credentialSubjectTypes
    );

    return await signer._signTypedData(
      credentialTypedData.domain,
      credentialTypedData.types,
      credentialTypedData.message
    );
  }

  public async signVC(
    keys: DIDWithKeys,
    token: CredentialPayload,
    credentialSubjectTypes: any
  ): Promise<string> {
    const credentialTypedData = this.getEIP712CredentialTypedData(
      token,
      credentialSubjectTypes
    );

    const signer = new Wallet(keys.keyPair.privateKey);
    return await signer._signTypedData(
      credentialTypedData.domain,
      credentialTypedData.types,
      credentialTypedData.message
    );
  }

  private getDomainTypedData(): EIP712DomainTypedData {
    return {
      name: this.eip712Config.name,
      version: this.eip712Config.version,
      chainId: this.eip712Config.chainId,
      verifyingContract: this.eip712Config.verifyingContract,
    };
  }

  public static onyxCredentialToEIP712Credential(
    credential: CredentialPayload
  ): EIP712CredentialPayload {
    const _context = Array.isArray(credential["@context"])
      ? credential["@context"]
      : [credential["@context"]];
    const _type = Array.isArray(credential.type)
      ? credential.type
      : [credential.type];

    if (!credential.id) {
      throw new Error("Id is required to create EIP712 credential");
    }

    return {
      _context,
      id: credential.id,
      _type,
      issuer: credential.issuer,
      credentialSubject: credential.credentialSubject,
    };
  }

  private getEIP712CredentialTypedData(
    credential: CredentialPayload,
    credentialSubjectTypes: any
  ): EIP712CredentialTypedData {
    const message = EIP712Service.onyxCredentialToEIP712Credential(credential);

    return {
      domain: this.getDomainTypedData(),
      primaryType: VERIFIABLE_CREDENTIAL_PRIMARY_TYPE,
      message,
      types: {
        [VERIFIABLE_CREDENTIAL_PRIMARY_TYPE]: VERIFIABLE_CREDENTIAL_EIP712_TYPE,
        ...credentialSubjectTypes,
      },
    };
  }
}
