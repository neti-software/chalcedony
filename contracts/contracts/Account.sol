// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IAccount, ACCOUNT_VALIDATION_SUCCESS_MAGIC} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IAccount.sol";
import {TransactionHelper, Transaction} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/TransactionHelper.sol";
import {SystemContractsCaller} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/SystemContractHelper.sol";
import {Utils} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/Utils.sol";
import {EfficientCall} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/EfficientCall.sol";
import {BOOTLOADER_FORMAL_ADDRESS, NONCE_HOLDER_SYSTEM_CONTRACT, INonceHolder} from "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";
import {VCGeneric} from "./vcs/VCGeneric.sol";
import {VCRegisteredAccountController} from "./vcs/VCRegisteredAccountController.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {DIDUtils} from "./vcs/DIDUtils.sol";
import {IEncodings} from "./IEncodings.sol";


error InvalidAccountSignatureLength(); // 0xc85334ca
error InvalidAccountSignatureSelector(); // 0xec5ef221
error InvalidInBlancoTypeLength(); // 0x16c9001a
error InvalidInBlancoType(); // 0xd2d78a58
error MismatchedInBlancoIssuerSubject(); // 0xbc61c055
error UnauthorizedInBlancoIssuer(); // 0xdcd37fe2
error InvalidInBlancoProof(); // 0x1b1c7a64
error InvalidRegisteredAccountTypeLength(); // 0x16dbfe35
error InvalidRegisteredAccountType(); // 0xbfef2d65
error UnauthorizedRegisteredAccountIssuer(); // 0x5debc062
error MismatchedInBlancoRegisteredAccount(); // 0x338c779e
error UnauthorizedEOA(); // 0xe8873168
error InvalidRegisteredAccountProof(); // 0xe21a8926
error UsePaymaster(); // 0x3fb6d85f
error OnlyBootloader(); // 0xe38026aa

contract Account is IAccount, EIP712  {
    using TransactionHelper for *;
    using VCGeneric for VCGeneric.VerifiableCredential;
    using VCRegisteredAccountController for VCRegisteredAccountController.VerifiableCredential;

    string public ownerDid;
    string public witnessDid;

    modifier onlyBootloader() {
        if(msg.sender != BOOTLOADER_FORMAL_ADDRESS)
            revert OnlyBootloader();
        _;
    }

    constructor(string memory ownerDid_, string memory witnessDid_)
        EIP712("ChalcedonyAccount", "0.0.1")
    {
        ownerDid = ownerDid_;
        witnessDid = witnessDid_;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    fallback() external payable {
        assert(msg.sender != BOOTLOADER_FORMAL_ADDRESS);
    }

    function validateTransaction(
        bytes32,
        bytes32 suggestedSignedHash,
        Transaction calldata transaction
    ) external payable override onlyBootloader returns (bytes4 magic) {
        if(transaction.signature.length <= 4) revert InvalidAccountSignatureLength();
        if(bytes4(transaction.signature[0:4]) != IEncodings.accountSignature.selector)
            revert InvalidAccountSignatureSelector();
        (
            VCGeneric.VerifiableCredential memory inBlancoVC,
            bytes memory inBlancoProofValue,
            VCRegisteredAccountController.VerifiableCredential memory registeredAccountVC,
            bytes memory registeredAccountProofValue,
            bytes memory eoaSignature
        ) = abi.decode(transaction.signature[4:], (
            VCGeneric.VerifiableCredential,
            bytes,
            VCRegisteredAccountController.VerifiableCredential,
            bytes,
            bytes
        ));

        // verify EOA
        bytes32 txHash = suggestedSignedHash != bytes32(0) ? suggestedSignedHash : transaction.encodeHash();
        address eoaSigner = ECDSA.recover(txHash, eoaSignature);
        if(eoaSigner != DIDUtils.parseAddress(registeredAccountVC.credentialSubject.id))
            revert UnauthorizedEOA();

        // verify inBlanco is OK
        address inBlancoSigner = ECDSA.recover(_hashTypedDataV4(inBlancoVC.hash()), inBlancoProofValue);
        if(inBlancoVC._type.length != 2)
            revert InvalidInBlancoTypeLength();
        if(keccak256(bytes(inBlancoVC._type[1])) != keccak256(bytes("InBlancoAccountController")))
            revert InvalidInBlancoType();
        if(keccak256(bytes(inBlancoVC.issuer.id)) != keccak256(bytes(inBlancoVC.credentialSubject.id)))
            revert MismatchedInBlancoIssuerSubject();
        if(keccak256(bytes(inBlancoVC.issuer.id)) != keccak256(bytes(ownerDid)))
            revert UnauthorizedInBlancoIssuer();
        if(inBlancoSigner != DIDUtils.parseAddress(ownerDid))
            revert InvalidInBlancoProof();

        // verify RegisteredAccountController
        address registeredAccountSigner = ECDSA.recover(
            _hashTypedDataV4(registeredAccountVC.hash()),
            registeredAccountProofValue
        );
        if(registeredAccountVC._type.length != 2)
            revert InvalidRegisteredAccountTypeLength();
        if(keccak256(bytes(registeredAccountVC._type[1])) != keccak256(bytes("RegisteredAccountController")))
            revert InvalidRegisteredAccountType();
        if(keccak256(bytes(registeredAccountVC.issuer.id)) != keccak256(bytes(witnessDid)))
            revert UnauthorizedRegisteredAccountIssuer();
        if(keccak256(bytes(registeredAccountVC.credentialSubject.registeredWith.id))
            != keccak256(bytes(inBlancoVC.id)))
            revert MismatchedInBlancoRegisteredAccount();
        if(registeredAccountSigner != DIDUtils.parseAddress(registeredAccountVC.issuer.id))
            revert InvalidRegisteredAccountProof();

        SystemContractsCaller.systemCallWithPropagatedRevert(
            uint32(gasleft()),
            address(NONCE_HOLDER_SYSTEM_CONTRACT),
            0,
            abi.encodeCall(INonceHolder.incrementMinNonceIfEquals, (transaction.nonce))
        );
        
        return ACCOUNT_VALIDATION_SUCCESS_MAGIC;
    }

    function executeTransaction(
        bytes32,
        bytes32,
        Transaction calldata transaction
    ) external payable override onlyBootloader {
        address to = address(uint160(transaction.to));
        uint128 value = Utils.safeCastToU128(transaction.value);
        bytes calldata data = transaction.data;
        uint32 gas = Utils.safeCastToU32(gasleft());

        bool success = EfficientCall.rawCall(gas, to, value, data, false);
        if (!success) {
            EfficientCall.propagateRevert();
        }
    }

    // solhint-disable-next-line no-empty-blocks
    function executeTransactionFromOutside(Transaction calldata transaction) external payable override {}

    function payForTransaction(
        bytes32,
        bytes32,
        Transaction calldata
    ) external payable override onlyBootloader {
        revert UsePaymaster();
    }

    function prepareForPaymaster(
        bytes32, // _txHash
        bytes32, // suggestedSignedHash
        Transaction calldata transaction
    ) external payable override onlyBootloader {
        transaction.processPaymasterInput();
    }
}
