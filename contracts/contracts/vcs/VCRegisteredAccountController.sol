//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { EIP712Utils } from "./EIP712Utils.sol";

library VCRegisteredAccountController {
    struct RegistrationClaim {
        string id;
    }

    struct Issuer {
        string id;
    }

    struct CredentialSubject {
        string id;
        RegistrationClaim registeredWith;
    }

    struct VerifiableCredential {
        // solhint-disable-next-line private-vars-leading-underscore
        string[] _context;
        string id;
        // solhint-disable-next-line private-vars-leading-underscore
        string[] _type;
        Issuer issuer;
        CredentialSubject credentialSubject;
    }

    bytes32 constant public ISSUER_TYPEHASH = keccak256(
        "Issuer(string id)"
    );
    bytes32 constant public REGISTRATION_CLAIM_TYPEHASH = keccak256(
        "RegistrationClaim(string id)"
    );
    bytes32 constant public CREDENTIAL_SUBJECT_TYPEHASH = keccak256(
        "CredentialSubject(string id,RegistrationClaim registeredWith)RegistrationClaim(string id)"
    );
    bytes32 constant public VERIFIABLE_CREDENTIAL_TYPEHASH = keccak256(
        "VerifiableCredential(string[] _context,string id,string[] _type,Issuer issuer,CredentialSubject credentialSubject)CredentialSubject(string id,RegistrationClaim registeredWith)Issuer(string id)RegistrationClaim(string id)"
    );

    function hash(VerifiableCredential memory vc) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                VERIFIABLE_CREDENTIAL_TYPEHASH,
                EIP712Utils.hashStringArray(vc._context),
                keccak256(abi.encodePacked(vc.id)),
                EIP712Utils.hashStringArray(vc._type),
                _hashIssuer(vc.issuer),
                _hashCredentialSubject(vc.credentialSubject)
            )
        );
    }

    function _hashIssuer(Issuer memory issuer) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                ISSUER_TYPEHASH,
                keccak256(abi.encodePacked(issuer.id))
            )
        );
    }

    function _hashRegistrationClaim(RegistrationClaim memory rc) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                REGISTRATION_CLAIM_TYPEHASH,
                keccak256(abi.encodePacked(rc.id))
            )
        );
    }

    function _hashCredentialSubject(CredentialSubject memory cs) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                CREDENTIAL_SUBJECT_TYPEHASH,
                keccak256(abi.encodePacked(cs.id)),
                _hashRegistrationClaim(cs.registeredWith)
            )
        );
    }
}