//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { EIP712Utils } from "../vcs/EIP712Utils.sol";

contract EIP712UtilsTest {
    function testHashStringArray(string[] memory arr) external pure returns (bytes32) {
        return EIP712Utils.hashStringArray(arr);
    }
}
