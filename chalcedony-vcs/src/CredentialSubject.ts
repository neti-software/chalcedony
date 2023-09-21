import { BaseCredentialSubject, EIP712Struct } from "./VC";
import { _TypedDataEncoder } from "ethers/lib/utils";

export class GenericCredentialSubject implements BaseCredentialSubject {
    id: string;

    constructor(id: string) {
        this.id = id;
    }

    hash() {
        return _TypedDataEncoder.hashStruct("CredentialSubject", this.types(), this);
    }

    types() {
        return {
            CredentialSubject: [
                { "name": "id", "type": "string" }
            ]
        }
    }
}

export class RegistrationClaim implements EIP712Struct {
    id: string;

    constructor(id: string) {
        this.id = id;
    }

    hash() {
        return _TypedDataEncoder.hashStruct("RegistrationClaim", this.types(), this);
    }

    types() {
        return {
            RegistrationClaim: [
                { "name": "id", "type": "string" },
            ]
        }
    }
}

export class RegisteredAccountControllerCredentialSubject implements EIP712Struct {
    id: string;
    registeredWith: RegistrationClaim;

    constructor(id: string, registeredWith: RegistrationClaim) {
        this.id = id;
        this.registeredWith = registeredWith;
    }

    hash() {
        return _TypedDataEncoder.hashStruct("CredentialSubject", this.types(), this);
    }

    types() {
        return {
            ...this.registeredWith.types(),
            CredentialSubject: [
                { "name": "id", "type": "string" },
                { "name": "registeredWith", "type": "RegistrationClaim" },
            ]
        }
    }
}