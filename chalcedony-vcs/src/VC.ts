import { TypedDataDomain, Wallet } from 'ethers';
import { BytesLike, _TypedDataEncoder } from 'ethers/lib/utils';

export interface EIP712Type {
  name: string;
  type: string;
}

export interface EIP712Struct {
  hash(): string;
  types(): Record<string, Array<EIP712Type>>;
}

export interface BaseCredentialSubject extends EIP712Struct {
  id: string;
}

export class VC<CredentialSubject extends BaseCredentialSubject> implements EIP712Struct {
  context: string[];
  id: string;
  type_: string[];
  issuer: string;
  credentialSubject: CredentialSubject;

  constructor(
    context: string[],
    id: string,
    type_: string[],
    issuer: string,
    credentialSubject: CredentialSubject
  ) {
    this.context = context;
    this.id = id;
    this.type_ = type_;
    this.issuer = issuer;
    this.credentialSubject = credentialSubject;
  }

  hash() {
      return _TypedDataEncoder.hashStruct("VerifiableCredential", this.types(), this);
  }

  types() {
    return {
      ...this.credentialSubject.types(),
      VerifiableCredential: [
        { name: 'context', type: 'string[]' },
        { name: 'id', type: 'string' },
        { name: 'type_', type: 'string[]' },
        { name: 'issuer', type: 'string' },
        { name: 'credentialSubject', type: 'CredentialSubject' },
      ]
    }
  }

  async sign(
    signer: Wallet,
    domainSeparator: TypedDataDomain,
  ): Promise<BytesLike> {
    return await signer._signTypedData({
      name: domainSeparator.name,
      version: domainSeparator.version,
      chainId: domainSeparator.chainId,
      verifyingContract: domainSeparator.verifyingContract,
    }, this.types(), this)
  }
}