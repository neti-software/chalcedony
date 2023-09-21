//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { DIDUtils } from "../vcs/DIDUtils.sol";

contract DIDUtilsTest {
    function testParseHexChar(bytes1 char) external pure returns (uint8) {
        return DIDUtils.parseHexChar(uint8(char));
    }

    function testParseHexString(string calldata hexString) external pure returns (bytes memory) {
        return DIDUtils.parseHexString(bytes(hexString));
    }

    function testParseAddress(string calldata did) external pure returns (address) {
        return DIDUtils.parseAddress(did);
    }
}
