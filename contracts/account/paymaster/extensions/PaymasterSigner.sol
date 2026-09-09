// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (account/paymaster/extensions/PaymasterSigner.sol)

pragma solidity ^0.8.24;

import {ERC4337Utils, PackedUserOperation} from "../../utils/ERC4337Utils.sol";
import {EIP7702Utils} from "../../utils/EIP7702Utils.sol";
import {AbstractSigner} from "../../../utils/cryptography/signers/AbstractSigner.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";
import {Paymaster} from "../Paymaster.sol";
import {Bytes} from "../../../utils/Bytes.sol";
import {Calldata} from "../../../utils/Calldata.sol";
import {Memory} from "../../../utils/Memory.sol";

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
     *
     * For EIP-7702 senders (i.e. `userOp.initCode` starting with the 20-byte `0x7702` marker), the
     * `initCode` component of the digest substitutes the effective delegate read from `userOp.sender`'s
     * code, mirroring the {IEntryPoint}'s `userOpHash` computation. For all other senders, the raw
     * `initCode` is hashed directly.
     */
    function _signableUserOpHash(
        PackedUserOperation calldata userOp,
        uint48 validAfter,
        uint48 validUntil
    ) internal view virtual returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        USER_OPERATION_REQUEST_TYPEHASH,
                        userOp.sender,
                        userOp.nonce,
                        _effectiveInitCodeHash(userOp),
                        keccak256(userOp.callData),
                        userOp.accountGasLimits,
                        userOp.preVerificationGas,
                        userOp.gasFees,
                        userOp.paymasterVerificationGasLimit(),
                        userOp.paymasterPostOpGasLimit(),
                        validAfter,
                        validUntil
                    )
                )
            );
    }

    /// @dev `initCode` hash for {_signableUserOpHash}, substituting the effective delegate for EIP-7702 senders.
    function _effectiveInitCodeHash(PackedUserOperation calldata userOp) private view returns (bytes32) {
        // Cache the free memory pointer so the allocations below (initCode copy, and the delegate
        // buffer on the EIP-7702 branch) do not persist past this function.
        Memory.Pointer fmp = Memory.getFreeMemoryPointer();

        // Matches Eip7702Support._isEip7702InitCode: the marker is compared over the full 20 bytes, so
        // the 18 bytes following it must be zero. Shorter initCode is zero-padded by the cast.
        bytes memory initCode = userOp.initCode;
        if (bytes20(initCode) == bytes20(bytes2(0x7702))) {
            bytes memory delegate = abi.encodePacked(EIP7702Utils.fetchDelegate(userOp.sender));
            initCode = initCode.length > 20 ? Bytes.replace(initCode, 0, delegate) : delegate;
        }
        bytes32 initCodeHash = keccak256(initCode);

        Memory.unsafeSetFreeMemoryPointer(fmp);
        return initCodeHash;
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

        // If validUntil is non-zero, mixed `BLOCK_RANGE_FLAG` bits between `validAfter` and `validUntil` are rejected
        bool rangeFlagsCompatible = validUntil == 0 || ((validAfter ^ validUntil) & ERC4337Utils.BLOCK_RANGE_FLAG == 0);

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
        return
            paymasterData.length < 12
                ? (uint48(0), uint48(0), Calldata.emptyBytes())
                : (uint48(bytes6(paymasterData[0:6])), uint48(bytes6(paymasterData[6:12])), paymasterData[12:]);
    }
}
