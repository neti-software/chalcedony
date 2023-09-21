//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { VCRegisteredAccountController as VC } from "../vcs/VCRegisteredAccountController.sol";

contract VCRegisteredAccountControllerTest {
    function testHash(
        VC.VerifiableCredential calldata vc
    ) pure public returns(bytes32) {
        return VC.hash(vc);
    }
}