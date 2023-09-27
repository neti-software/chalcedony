// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IPaymaster, ExecutionResult, PAYMASTER_VALIDATION_SUCCESS_MAGIC} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymaster.sol";
import {IPaymasterFlow} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IPaymasterFlow.sol";
import {Transaction} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/TransactionHelper.sol";
import {VCGeneric} from "./vcs/VCGeneric.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {DIDUtils} from "./vcs/DIDUtils.sol";
import {BOOTLOADER_FORMAL_ADDRESS} from "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";

error OnlyBootloader(); // 0xe38026aa
error InvalidPaymasterInputLength(); // 0xe5029198
error UnsupportedPaymasterFlow(); // 0xff15b069
error Unauthorized(); // 0x82b42900
error InvalidSignature(); // 0x8baa579f
error InvalidVCTypeLength(); // 0xe7a3a907
error InvalidVCType(); // 0x8b20b982
error BurnedVC(); // 0x2ba40cdf
error PaymentFailed(); // 0xf499da20
error NothingToRefund(); // 0xf76aef65


contract Paymaster is IPaymaster, EIP712 {
    using VCGeneric for VCGeneric.VerifiableCredential;

    mapping(address sponsor => uint256 balance) public balanceOf;
    mapping(string did => bool burned) public burnedVCs;

    modifier onlyBootloader() {
        if(msg.sender != BOOTLOADER_FORMAL_ADDRESS)
            revert OnlyBootloader();
        _;
    }

    constructor() EIP712("ChalcedonyPaymaster", "0.0.1") {}

    receive() external payable {
        balanceOf[msg.sender] += msg.value;
    }

    function validateAndPayForPaymasterTransaction  (
        bytes32,
        bytes32,
        Transaction calldata transaction
    ) external payable onlyBootloader returns (bytes4 magic, bytes memory context) {
        /// CHECKS
        /* Parse input */
        if(transaction.paymasterInput.length < 4)
            revert InvalidPaymasterInputLength();

        bytes4 paymasterInputSelector = bytes4(transaction.paymasterInput[0:4]);
        if(paymasterInputSelector != IPaymasterFlow.general.selector)
            revert UnsupportedPaymasterFlow();

        bytes memory paymasterInnerInput = abi.decode(transaction.paymasterInput[4:], (bytes));
        (VCGeneric.VerifiableCredential memory vc, bytes memory proofValue) =
            abi.decode(paymasterInnerInput, (VCGeneric.VerifiableCredential, bytes));

        address sponsor = DIDUtils.parseAddress(vc.issuer.id);
        address subject = DIDUtils.parseAddress(vc.credentialSubject.id);

        /* Calculate ifd payment */
        uint256 fee = transaction.gasLimit * transaction.maxFeePerGas;

        /* Check if we really want to pay for this tx */
        bytes32 digest = _hashTypedDataV4(vc.hash());
        address signer = ECDSA.recover(digest, proofValue);
        address aaAddress = address(uint160(transaction.from));
        if(balanceOf[sponsor] < fee)
            return (bytes4(0), ""); // no revert, simplifies gas estimation

        if(subject != aaAddress)
            revert Unauthorized();
        if(signer != sponsor)
            revert InvalidSignature();
        if(vc._type.length != 2)
            revert InvalidVCTypeLength();
        if(keccak256(bytes(vc._type[1])) != keccak256(bytes("TransactionPaid")))
            revert InvalidVCType();
        if(burnedVCs[vc.id])
            revert BurnedVC();

        /// EFFECTS
        /* Deduct sponsor's balance, burn VC and pay for transaction */
        balanceOf[sponsor] -= fee;
        burnedVCs[vc.id] = true;

        /// INTERACTIONS
        (bool success, ) = payable(BOOTLOADER_FORMAL_ADDRESS).call{ value: fee }("");
        if(!success) revert PaymentFailed();

        return (
            PAYMASTER_VALIDATION_SUCCESS_MAGIC,
            ""
        );
    }

    /* solhint-disable no-empty-blocks */
    function postTransaction (
        bytes calldata,
        Transaction calldata,
        bytes32,
        bytes32,
        ExecutionResult,
        uint256
    ) external payable onlyBootloader override { }
    /* solhint-enable no-empty-blocks */

    function refund() external {
        uint256 amount = balanceOf[msg.sender];
        if(amount == 0) revert NothingToRefund();
        balanceOf[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{ value: amount }("");
        if(!success) revert PaymentFailed();
    }
}