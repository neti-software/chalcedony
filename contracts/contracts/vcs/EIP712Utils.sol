//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library EIP712Utils {
    function hashStringArray(string[] memory arr) internal pure returns (bytes32) {
        bytes32[] memory hashedValues = new bytes32[](arr.length);
        for (uint256 i = 0; i < arr.length; ++i) {
            hashedValues[i] = keccak256(abi.encodePacked(arr[i]));
        }
        return keccak256(abi.encodePacked(hashedValues));
    }
}