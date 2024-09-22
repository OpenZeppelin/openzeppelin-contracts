// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../interfaces/IERC4337.sol";
import {ERC4337Utils} from "./../utils/ERC4337Utils.sol";
import {EIP712ReadableSigner} from "./EIP712ReadableSigner.sol";
import {AccountBase} from "../AccountBase.sol";

abstract contract AccountSigner is AccountBase, EIP712ReadableSigner {
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address private immutable __impl = address(this);

    error AccountOnlyProxy();

    modifier onlyProxy() {
        _checkProxy();
        _;
    }

    function _checkProxy() internal view {
        if (msg.sender != __impl) revert AccountOnlyProxy();
    }

    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override onlyProxy returns (address signer, uint256 validationData) {
        if (!_isValidSignature(userOpHash, userOp.signature)) return (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);
        return (address(this), ERC4337Utils.SIG_VALIDATION_SUCCESS);
    }
}
