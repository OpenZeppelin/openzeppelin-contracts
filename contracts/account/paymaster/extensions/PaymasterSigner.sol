// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {ERC4337Utils, PackedUserOperation} from "../../utils/ERC4337Utils.sol";
import {AbstractSigner} from "../../../utils/cryptography/signers/AbstractSigner.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";
import {Paymaster} from "../Paymaster.sol";
import {Calldata} from "../../../utils/Calldata.sol";

/**
 * @dev Extension of {Paymaster} that adds signature validation. See {SignerECDSA}, {SignerP256} or {SignerRSA}.
 *
 * Example of usage:
 *
 * ```solidity
 * contract MyPaymasterECDSASigner is PaymasterSigner, SignerECDSA {
 *     constructor(address signerAddr) EIP712("MyPaymasterECDSASigner", "1") SignerECDSA(signerAddr) {}
 * }
 * ```
 */
abstract contract PaymasterSigner is AbstractSigner, EIP712, Paymaster {
    using ERC4337Utils for *;

    bytes32 private constant USER_OPERATION_REQUEST_TYPEHASH =
        keccak256(
            "UserOperationRequest(address sender,uint256 nonce,bytes initCode,bytes callData,bytes32 accountGasLimits,uint256 preVerificationGas,bytes32 gasFees,uint256 paymasterVerificationGasLimit,uint256 paymasterPostOpGasLimit,uint48 validAfter,uint48 validUntil)"
        );

    /**
     * @dev Virtual function that returns the signable hash for a user operations. Given the `userOpHash`
     * contains the `paymasterAndData` itself, it's not possible to sign that value directly. Instead,
     * this function must be used to provide a custom mechanism to authorize an user operation.
     */
    function _signableUserOpHash(
        PackedUserOperation calldata userOp,
        uint48 validAfter,
        uint48 validUntil
    ) internal view virtual returns (bytes32) {
        // Both paymaster gas limits share the word at [20:52]: a single load replaces
        // the two `ERC4337Utils` accessors, which each length-check and load it.
        uint256 paymasterGasLimits = userOp.paymasterAndData.length < 52
            ? 0
            : uint256(bytes32(userOp.paymasterAndData[20:52]));
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        USER_OPERATION_REQUEST_TYPEHASH,
                        userOp.sender,
                        userOp.nonce,
                        keccak256(userOp.initCode),
                        keccak256(userOp.callData),
                        userOp.accountGasLimits,
                        userOp.preVerificationGas,
                        userOp.gasFees,
                        paymasterGasLimits >> 128,
                        uint256(uint128(paymasterGasLimits)),
                        validAfter,
                        validUntil
                    )
                )
            );
    }

    /**
     * @dev Internal validation of whether the paymaster is willing to pay for the user operation.
     * Returns the context to be passed to postOp and the validation data.
     *
     * NOTE: The `context` returned is `bytes(0)`. Developers overriding this function MUST
     * override {_postOp} to process the context passed along.
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 /* userOpHash */,
        uint256 /* maxCost */
    ) internal virtual override returns (bytes memory context, uint256 validationData) {
        (uint48 validAfter, uint48 validUntil, bytes calldata signature) = _decodePaymasterUserOp(userOp);

        // Mixed `BLOCK_RANGE_FLAG` bits between `validAfter` and `validUntil` are rejected
        bool rangeFlagsCompatible = (validAfter ^ validUntil) & ERC4337Utils.BLOCK_RANGE_FLAG == 0;

        return (
            bytes(""),
            rangeFlagsCompatible
                ? _rawSignatureValidation(_signableUserOpHash(userOp, validAfter, validUntil), signature)
                    .packValidationData(validAfter, validUntil)
                : ERC4337Utils.SIG_VALIDATION_FAILED
        );
    }

    /// @dev Decodes the user operation's data from `paymasterAndData`.
    function _decodePaymasterUserOp(
        PackedUserOperation calldata userOp
    ) internal pure virtual returns (uint48 validAfter, uint48 validUntil, bytes calldata signature) {
        bytes calldata paymasterData = userOp.paymasterData();
        if (paymasterData.length < 12) return (uint48(0), uint48(0), Calldata.emptyBytes());

        // Both timestamps share the 12-byte window at [0:12]: a single load replaces
        // the two bounds-checked slices.
        bytes12 validity = bytes12(paymasterData[:12]);
        return (uint48(bytes6(validity)), uint48(bytes6(validity << 48)), paymasterData[12:]);
    }
}
