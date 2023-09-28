// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {DEPLOYER_SYSTEM_CONTRACT, IContractDeployer} from "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";
import {SystemContractsCaller} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/SystemContractsCaller.sol";

error DeploymentFailed(); // 0x30116425

contract AccountFactory {
    bytes32 public bytecodeHash;

    constructor(bytes32 bytecodeHash_) {
        bytecodeHash = bytecodeHash_;
    }

    function deployAccount(
        bytes32 salt,
        string calldata ownerDid,
        string calldata witnessDid
    ) external returns (address accountAddress) {
        (bool success, bytes memory returnData) = SystemContractsCaller
            .systemCallWithReturndata(
                uint32(gasleft()),
                address(DEPLOYER_SYSTEM_CONTRACT),
                uint128(0),
                abi.encodeCall(
                    DEPLOYER_SYSTEM_CONTRACT.create2Account,
                    (salt, bytecodeHash, abi.encode(ownerDid, witnessDid), IContractDeployer.AccountAbstractionVersion.Version1)
                )
            );
        if(!success) revert DeploymentFailed();

        (accountAddress) = abi.decode(returnData, (address));
    }
}
