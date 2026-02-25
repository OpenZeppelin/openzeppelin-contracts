// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Ownable} from "../../../access/Ownable.sol";
import {ERC4337Utils, PackedUserOperation} from "../../../account/utils/draft-ERC4337Utils.sol";
import {SignerECDSA} from "../../../utils/cryptography/signers/SignerECDSA.sol";
import {PaymasterSigner} from "../../../account/paymaster/PaymasterSigner.sol";

abstract contract PaymasterSignerContextNoPostOpMock is PaymasterSigner, SignerECDSA, Ownable {
    using ERC4337Utils for *;

    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 requiredPreFund
    ) internal override returns (bytes memory context, uint256 validationData) {
        // use the userOp's callData as context;
        context = userOp.callData;
        // super call (PaymasterSigner + SignerECDSA) for the validation data
        (, validationData) = super._validatePaymasterUserOp(userOp, userOpHash, requiredPreFund);
    }

    function _authorizeWithdraw() internal override onlyOwner {}
}

abstract contract PaymasterSignerMock is PaymasterSignerContextNoPostOpMock {
    event PaymasterDataPostOp(bytes paymasterData);

    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) internal override {
        emit PaymasterDataPostOp(context);
        super._postOp(mode, context, actualGasCost, actualUserOpFeePerGas);
    }
}
