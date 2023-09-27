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

export class Issuer implements EIP712Struct {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  hash(): string {
    return _TypedDataEncoder.hashStruct("Issuer", this.types(), this);
  }

  types(): Record<string, EIP712Type[]> {
    return {
      Issuer: [
        { "name": "id", "type": "string" },
      ]
    }
  }
}

export class VC<CredentialSubject extends BaseCredentialSubject> implements EIP712Struct {
  _context: string[];
  id: string;
  _type: string[];
  issuer: Issuer;
  credentialSubject: CredentialSubject;

  constructor(
    _context: string[],
    id: string,
    _type: string[],
    issuer: Issuer,
    credentialSubject: CredentialSubject
  ) {
    this._context = _context;
    this.id = id;
    this._type = _type;
    this.issuer = issuer;
    this.credentialSubject = credentialSubject;
  }

  hash() {
    return _TypedDataEncoder.hashStruct("VerifiableCredential", this.types(), this);
  }

  types() {
    return {
      ...this.credentialSubject.types(),
      ...this.issuer.types(),
      VerifiableCredential: [
        { name: '_context', type: 'string[]' },
        { name: 'id', type: 'string' },
        { name: '_type', type: 'string[]' },
        { name: 'issuer', type: 'Issuer' },
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