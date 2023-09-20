
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library VC {
    struct AuthorizationClaim {
        bytes call;
    }

    struct CredentialSubject {
        string id;
        AuthorizationClaim authorizedTo;
    }

    struct VerifiableCredential {
        string[] context;
        string id;
        string[] type_;
        string issuer;
        CredentialSubject credentialSubject;
    }

    bytes32 constant public AUTHORIZATION_CLAIM_TYPEHASH = keccak256(
        "AuthorizationClaim(bytes call)"
    );
    bytes32 constant public CREDENTIAL_SUBJECT_TYPEHASH = keccak256(
        "CredentialSubject(string id,AuthorizationClaim authorizedTo)AuthorizationClaim(bytes call)"
    );
    bytes32 constant public VERIFIABLE_CREDENTIAL_TYPEHASH = keccak256(
        "VerifiableCredential(string[] context,string id,string[] type_,string issuer,CredentialSubject credentialSubject)AuthorizationClaim(bytes call)CredentialSubject(string id,AuthorizationClaim authorizedTo)"
    );

    function hashStringArray(string[] memory arr) private pure returns (bytes32) {
        bytes32[] memory hashedValues = new bytes32[](arr.length);
        for (uint256 i = 0; i < arr.length; ++i) {
            hashedValues[i] = keccak256(abi.encodePacked(arr[i]));
        }
        return keccak256(abi.encodePacked(hashedValues));
    }

    function hashAuthorizationClaim(AuthorizationClaim memory ac) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                AUTHORIZATION_CLAIM_TYPEHASH,
                keccak256(abi.encodePacked(ac.call))
            )
        );
    }

    function hashCredentialSubject(CredentialSubject memory cs) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                CREDENTIAL_SUBJECT_TYPEHASH,
                keccak256(abi.encodePacked(cs.id)),
                hashAuthorizationClaim(cs.authorizedTo)
            )
        );
    }

    function hash(VerifiableCredential memory vc) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                VERIFIABLE_CREDENTIAL_TYPEHASH,
                hashStringArray(vc.context),
                keccak256(abi.encodePacked(vc.id)),
                hashStringArray(vc.type_),
                keccak256(abi.encodePacked(vc.issuer)),
                hashCredentialSubject(vc.credentialSubject)
            )
        );
    }
}