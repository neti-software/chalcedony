// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IPaymaster, ExecutionResult, PAYMASTER_VALIDATION_SUCCESS_MAGIC} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymaster.sol";
import {IPaymasterFlow} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymasterFlow.sol";
import {TransactionHelper, Transaction} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/TransactionHelper.sol";
import {VCGeneric} from "./vcs/VCGeneric.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import { DIDUtils } from "./vcs/DIDUtils.sol";


import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";
import "hardhat/console.sol";

contract Paymaster is IPaymaster, EIP712 {
    using VCGeneric for VCGeneric.VerifiableCredential;

    uint256 constant PRICE_FOR_PAYING_FEES = 1;

    mapping(address sponsor => uint256 balance) public balanceOf;
    mapping(string did => bool burned) burnedVCs;

    constructor() EIP712("Chalcedony", "0.0.1") {}

    modifier onlyBootloader() {
        require(msg.sender == BOOTLOADER_FORMAL_ADDRESS, "Only bootloader can call this method");
        _;
    }

    function encodeTest(VCGeneric.VerifiableCredential memory vc, bytes memory proof) pure external returns (bytes memory) {
        return abi.encode(vc, proof);
    }

    function validateAndPayForPaymasterTransaction  (
        bytes32,
        bytes32,
        Transaction calldata transaction
    ) external payable onlyBootloader returns (bytes4 magic, bytes memory context) {
        /// CHECKS
        /* Parse input */
        require(transaction.paymasterInput.length >= 4,
            "The standard paymaster input must be at least 4 bytes long");

        bytes4 paymasterInputSelector = bytes4(transaction.paymasterInput[0:4]);
        require(paymasterInputSelector == IPaymasterFlow.general.selector, "Unsupported Paymaster Flow");

        bytes memory paymasterInput = abi.decode(transaction.paymasterInput[4:], (bytes));
        (VCGeneric.VerifiableCredential memory vc, bytes memory proofValue) =
            abi.decode(paymasterInput, (VCGeneric.VerifiableCredential, bytes));

        address sponsor = DIDUtils.parseAddress(vc.issuer);
        address subject = DIDUtils.parseAddress(vc.credentialSubject.id);

        /* Calculate required payment */
        uint256 fee = transaction.gasLimit * transaction.maxFeePerGas;

        /* Check if we really want to pay for this tx */
        bytes32 digest = _hashTypedDataV4(vc.hash());
        address signer = ECDSA.recover(digest, proofValue);
        address aaAddress = address(uint160(transaction.from));
        if(balanceOf[sponsor] < fee)
            return (bytes4(0), ""); // no revert, simplifies gas estimation

        require(subject == aaAddress, "Unauthorized");
        require(signer == sponsor, "Invalid VC");
        require(vc.type_.length == 2, "Incorrect VC");
        require(keccak256(bytes(vc.type_[1])) == keccak256(bytes("TransactionPaid")), "Incorrect VC");
        require(!burnedVCs[vc.id], "VC already used");

        /// EFFECTS
        /* Deduct sponsor's balance, burn VC and pay for transaction */
        balanceOf[sponsor] -= fee;
        burnedVCs[vc.id] = true;

        /// INTERACTIONS
        (bool success, ) = payable(BOOTLOADER_FORMAL_ADDRESS).call{ value: fee }("");
        require(success, "Payment to bootloader failed");

        return (
            PAYMASTER_VALIDATION_SUCCESS_MAGIC,
            ""
        );
    }

    function postTransaction (
        bytes calldata _context,
        Transaction calldata _transaction,
        bytes32,
        bytes32,
        ExecutionResult _txResult,
        uint256 _maxRefundedGas
    ) external payable onlyBootloader override {
        // refunds not supported
    }

    function refund() external {
        uint256 amount = balanceOf[msg.sender];
        require(amount > 0, "Nothing to refund");
        balanceOf[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{ value: amount }("");
        require(success, "Payment failed??");
    }

    receive() external payable {
        balanceOf[msg.sender] += msg.value;
    }
}