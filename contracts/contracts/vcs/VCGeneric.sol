//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { EIP712Utils } from "./EIP712Utils.sol";

// Simple VC with no claims other then credential subject id
library VCGeneric {
    struct CredentialSubject {
        string id;
    }

    struct VerifiableCredential {
        string[] context;
        string id;
        string[] type_;
        string issuer;
        CredentialSubject credentialSubject;
    }

    bytes32 constant public CREDENTIAL_SUBJECT_TYPEHASH = keccak256(
        "CredentialSubject(string id)"
    );
    bytes32 constant public VERIFIABLE_CREDENTIAL_TYPEHASH = keccak256(
        "VerifiableCredential(string[] context,string id,string[] type_,string issuer,CredentialSubject credentialSubject)CredentialSubject(string id)"
    );

    function hashCredentialSubject(CredentialSubject memory cs) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                CREDENTIAL_SUBJECT_TYPEHASH,
                keccak256(abi.encodePacked(cs.id))
            )
        );
    }

    function hash(VerifiableCredential memory vc) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                VERIFIABLE_CREDENTIAL_TYPEHASH,
                EIP712Utils.hashStringArray(vc.context),
                keccak256(abi.encodePacked(vc.id)),
                EIP712Utils.hashStringArray(vc.type_),
                keccak256(abi.encodePacked(vc.issuer)),
                hashCredentialSubject(vc.credentialSubject)
            )
        );
    }
}