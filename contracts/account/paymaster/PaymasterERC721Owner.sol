// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC721} from "../../interfaces/IERC721.sol";
import {ERC4337Utils, PackedUserOperation} from "../utils/draft-ERC4337Utils.sol";
import {Paymaster} from "./Paymaster.sol";

/**
 * @dev Extension of {Paymaster} that supports account based on ownership of an ERC-721 token.
 *
 * This paymaster will sponsor user operations if the user has at least 1 token of the token specified
 * during construction (or via {_setToken}).
 */
abstract contract PaymasterERC721Owner is Paymaster {
    IERC721 private _token;

    /// @dev Emitted when the paymaster token is set.
    event PaymasterERC721OwnerTokenSet(IERC721 token);

    constructor(IERC721 token_) {
        _setToken(token_);
    }

    /// @dev ERC-721 token used to validate the user operation.
    function token() public virtual returns (IERC721) {
        return _token;
    }

    /// @dev Sets the ERC-721 token used to validate the user operation.
    function _setToken(IERC721 token_) internal virtual {
        _token = token_;
        emit PaymasterERC721OwnerTokenSet(token_);
    }

    /**
     * @dev Internal validation of whether the paymaster is willing to pay for the user operation.
     * Returns the context to be passed to postOp and the validation data.
     *
     * NOTE: The default `context` is `bytes(0)`. Developers that add a context when overriding this function MUST
     * also override {_postOp} to process the context passed along.
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 /* userOpHash */,
        uint256 /* maxCost */
    ) internal virtual override returns (bytes memory context, uint256 validationData) {
        return (
            bytes(""),
            // balanceOf reverts if the `userOp.sender` is the address(0), so this becomes unreachable with address(0)
            // assuming a compliant entrypoint (`_validatePaymasterUserOp` is called after `validateUserOp`),
            token().balanceOf(userOp.sender) == 0
                ? ERC4337Utils.SIG_VALIDATION_FAILED
                : ERC4337Utils.SIG_VALIDATION_SUCCESS
        );
    }
}
