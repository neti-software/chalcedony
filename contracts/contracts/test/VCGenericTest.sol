//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { VCGeneric } from "../vcs/VCGeneric.sol";

contract VCGenericTest {
    function testHash(
        VCGeneric.VerifiableCredential calldata vc
    ) external pure returns(bytes32) {
        return VCGeneric.hash(vc);
    }
}