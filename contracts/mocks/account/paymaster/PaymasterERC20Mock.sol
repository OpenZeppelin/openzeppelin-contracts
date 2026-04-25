// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccessControl} from "../../../access/AccessControl.sol";
import {ERC4337Utils, PackedUserOperation} from "../../../account/utils/draft-ERC4337Utils.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";
import {SignatureChecker} from "../../../utils/cryptography/SignatureChecker.sol";
import {PaymasterERC20, IERC20} from "../../../account/paymaster/PaymasterERC20.sol";
import {PaymasterERC20Guarantor} from "../../../account/paymaster/PaymasterERC20Guarantor.sol";

/**
 * NOTE: struct or the expected paymaster data is:
 * * [0x00:0x14                      ] token                 (IERC20)
 * * [0x14:0x1a                      ] validAfter            (uint48)
 * * [0x1a:0x20                      ] validUntil            (uint48)
 * * [0x20:0x40                      ] tokenPrice            (uint256)
 * * [0x40:0x54                      ] oracle                (address)
 * * [0x54:0x56                      ] oracleSignatureLength (uint16)
 * * [0x56:0x56+oracleSignatureLength] oracleSignature       (bytes)
 */
abstract contract PaymasterERC20Mock is EIP712, PaymasterERC20, AccessControl {
    using ERC4337Utils for *;

    bytes32 private constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 private constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
    bytes32 private constant TOKEN_PRICE_TYPEHASH =
        keccak256("TokenPrice(address token,uint48 validAfter,uint48 validUntil,uint256 tokenPrice)");

    function _authorizeWithdraw() internal override onlyRole(WITHDRAWER_ROLE) {}

    function _fetchDetails(
        PackedUserOperation calldata userOp,
        bytes32 /* userOpHash */
    ) internal view virtual override returns (uint256 validationData, IERC20 token, uint256 tokenPrice) {
        bytes calldata paymasterData = userOp.paymasterData();

        // parse oracle and oracle signature
        address oracle = address(bytes20(paymasterData[0x40:0x54]));

        // check oracle is registered
        if (!hasRole(ORACLE_ROLE, oracle)) return (ERC4337Utils.SIG_VALIDATION_FAILED, IERC20(address(0)), 0);

        // parse repayment details
        token = IERC20(address(bytes20(paymasterData[0x00:0x14])));
        uint48 validAfter = uint48(bytes6(paymasterData[0x14:0x1a]));
        uint48 validUntil = uint48(bytes6(paymasterData[0x1a:0x20]));
        tokenPrice = uint256(bytes32(paymasterData[0x20:0x40]));

        // verify signature
        validationData = SignatureChecker
            .isValidSignatureNow(
                oracle,
                _hashTypedDataV4(
                    keccak256(abi.encode(TOKEN_PRICE_TYPEHASH, token, validAfter, validUntil, tokenPrice))
                ),
                paymasterData[0x56:0x56 + uint16(bytes2(paymasterData[0x54:0x56]))]
            )
            .packValidationData(validAfter, validUntil);
    }
}

/**
 * NOTE: struct or the expected guarantor data is (starts at 0x56+oracleSignatureLength):
 * * [0x00:0x14                      ] guarantor                (address) (optional: 0 if no guarantor)
 * * [0x14:0x16                      ] guarantorSignatureLength (uint16)
 * * [0x16+guarantorSignatureLength  ] guarantorSignature       (bytes)
 */
abstract contract PaymasterERC20GuarantorMock is PaymasterERC20Mock, PaymasterERC20Guarantor {
    using ERC4337Utils for *;

    bytes32 private constant PACKED_USER_OPERATION_TYPEHASH =
        keccak256(
            "PackedUserOperation(address sender,uint256 nonce,bytes initCode,bytes callData,bytes32 accountGasLimits,uint256 preVerificationGas,bytes32 gasFees,bytes paymasterAndData)"
        );

    function _fetchGuarantor(
        PackedUserOperation calldata userOp
    ) internal view virtual override returns (address guarantor) {
        bytes calldata paymasterData = userOp.paymasterData();

        uint16 oracleSignatureLength = uint16(bytes2(paymasterData[0x54:0x56]));
        bytes calldata guarantorData = paymasterData[0x56 + oracleSignatureLength:];

        if (guarantorData.length < 0x16) return address(0);
        address guarantorInput = address(bytes20(guarantorData[0x00:0x14]));
        if (guarantorInput == address(0)) return guarantorInput;

        uint16 guarantorSignatureLength = uint16(bytes2(guarantorData[0x14:0x16]));
        bytes calldata guarantorSignature = guarantorData[0x16:0x16 + guarantorSignatureLength];
        return
            SignatureChecker.isValidSignatureNow(
                guarantorInput,
                _hashTypedDataV4(_getStructHashWithoutOracleAndGuarantorSignature(userOp)),
                guarantorSignature
            )
                ? guarantorInput
                : address(0);
    }

    function _refund(
        IERC20 token,
        uint256 tokenPrice,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas,
        address prefunder,
        uint256 prefundAmount,
        bytes calldata prefundContext
    ) internal virtual override(PaymasterERC20, PaymasterERC20Guarantor) returns (bool refunded, uint256 actualAmount) {
        return
            super._refund(
                token,
                tokenPrice,
                actualGasCost,
                actualUserOpFeePerGas,
                prefunder,
                prefundAmount,
                prefundContext
            );
    }

    function _prefund(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        IERC20 token,
        uint256 tokenPrice,
        address prefunder_,
        uint256 maxCost
    )
        internal
        virtual
        override(PaymasterERC20, PaymasterERC20Guarantor)
        returns (bool prefunded, uint256 prefundAmount, address prefunder, bytes memory prefundContext)
    {
        return super._prefund(userOp, userOpHash, token, tokenPrice, prefunder_, maxCost);
    }

    function _getStructHashWithoutOracleAndGuarantorSignature(
        PackedUserOperation calldata userOp
    ) private pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    PACKED_USER_OPERATION_TYPEHASH,
                    userOp.sender,
                    userOp.nonce,
                    keccak256(userOp.initCode),
                    keccak256(userOp.callData),
                    userOp.accountGasLimits,
                    userOp.preVerificationGas,
                    userOp.gasFees,
                    keccak256(userOp.paymasterAndData[:0x88]) // 0x34 (paymasterDataOffset) + 0x54 (token + validAfter + validUntil + tokenPrice + oracle)
                )
            );
    }
}
