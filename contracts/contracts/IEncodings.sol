// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {VCGeneric} from "./vcs/VCGeneric.sol";
import {VCRegisteredAccountController} from "./vcs/VCRegisteredAccountController.sol";

// not for implementation by contracts
// just a helper for encoding
interface IEncodings {
    function paymasterInnerInput(
        VCGeneric.VerifiableCredential calldata vc,
        bytes calldata proof
    ) external;

    function accountSignature(
        VCGeneric.VerifiableCredential calldata inBlancoVC,
        bytes calldata inBlancoProof,
        VCRegisteredAccountController.VerifiableCredential calldata registeredAccountVC,
        bytes calldata registeredAccountProof,
        bytes calldata eoaSignature
    ) external;
}