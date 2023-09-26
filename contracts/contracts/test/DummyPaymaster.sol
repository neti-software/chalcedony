// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IPaymaster, ExecutionResult, PAYMASTER_VALIDATION_SUCCESS_MAGIC} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymaster.sol";
import {Transaction} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/TransactionHelper.sol";
import {PAYMASTER_VALIDATION_SUCCESS_MAGIC} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymaster.sol";
import {BOOTLOADER_FORMAL_ADDRESS} from "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";

error PaymentFailed();

contract DummyPaymaster is IPaymaster {
    /* solhint-disable no-empty-blocks */

    receive() external payable { }

    function validateAndPayForPaymasterTransaction  (
        bytes32,
        bytes32,
        Transaction calldata transaction
    ) external payable returns (bytes4 magic, bytes memory context) {
        uint256 fee = transaction.gasLimit * transaction.maxFeePerGas;
        (bool success, ) = payable(BOOTLOADER_FORMAL_ADDRESS).call{ value: fee }("");
        if(!success) revert PaymentFailed();
        magic = PAYMASTER_VALIDATION_SUCCESS_MAGIC;
        context = "";
    }

    function postTransaction (
        bytes calldata,
        Transaction calldata,
        bytes32,
        bytes32,
        ExecutionResult,
        uint256
    ) external payable override {}
}