//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library DIDUtils {
    function parseHexChar(uint8 char) internal pure returns (uint8) {
        bytes1 b = bytes1(char);
        if (b >= bytes1('0') && b <= bytes1('9')) {
            return char - uint8(bytes1('0'));
        }

        if (b >= bytes1('a') && b <= bytes1('f')) {
            return 10 + char - uint8(bytes1('a'));
        }

        if (b >= bytes1('A') && b <= bytes1('F')) {
            return 10 + char - uint8(bytes1('A'));
        }

        revert("Invalid hex char");
    }

    function parseHexString(bytes memory hexString) internal pure returns (bytes memory out) {
        require(hexString.length % 2 == 0, "Invalid hex string");
        out = new bytes(hexString.length/2);
        for(uint i = 0; i < hexString.length/2; i += 1) {
            out[i] = bytes1(
                parseHexChar(uint8(hexString[2*i])) * 16 +
                parseHexChar(uint8(hexString[2*i + 1]))
            );
        }
    }

    function parseAddress(string memory did_) internal pure returns (address) {
        bytes memory did = bytes(did_);
        require(did.length >= 50, "Invalid DID");

        uint offset = did.length - 43;
        for(; offset >= 6; offset -= 1) {
            if (did[offset] == ':' &&
                did[offset+1] == '0' &&
                did[offset+2] == 'x') {
                offset += 3;
                break;
            }
        }

        bytes memory addressString = new bytes(40);
        for(uint i = 0; i < 40; i++) {
            addressString[i] = did[offset+i];
        }

        return 
            address(
                uint160(
                    bytes20(
                        parseHexString(
                            addressString
                        ))));
    }
}