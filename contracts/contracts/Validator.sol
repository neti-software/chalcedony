//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import { VC } from "./VC.sol";

contract Validator is EIP712 {
    using VC for VC.VerifiableCredential;

    constructor() EIP712("Chalcedony", "0.0.1") {}

    function verifyVCSignature(
        VC.VerifiableCredential calldata vc,
        bytes calldata proofValue,
        address expectedSigner
    ) public view {
        bytes32 digest = _hashTypedDataV4(vc.hash());
        address signer = ECDSA.recover(digest, proofValue);
        if (expectedSigner != signer)
            revert("Invalid signer");
    }
}