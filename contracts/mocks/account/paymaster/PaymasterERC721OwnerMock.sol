// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Ownable} from "../../../access/Ownable.sol";
import {ERC4337Utils, PackedUserOperation} from "../../../account/utils/draft-ERC4337Utils.sol";
import {PaymasterERC721Owner} from "../../../account/paymaster/PaymasterERC721Owner.sol";

abstract contract PaymasterERC721OwnerContextNoPostOpMock is PaymasterERC721Owner, Ownable {
    using ERC4337Utils for *;

    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 requiredPreFund
    ) internal override returns (bytes memory context, uint256 validationData) {
        // use the userOp's callData as context;
        context = userOp.callData;
        // super call (PaymasterERC721Owner) for the validation data
        (, validationData) = super._validatePaymasterUserOp(userOp, userOpHash, requiredPreFund);
    }

    function _authorizeWithdraw() internal override onlyOwner {}
}

abstract contract PaymasterERC721OwnerMock is PaymasterERC721OwnerContextNoPostOpMock {
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
