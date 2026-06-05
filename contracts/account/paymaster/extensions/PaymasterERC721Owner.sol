// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC721} from "../../../interfaces/IERC721.sol";
import {ERC4337Utils, PackedUserOperation} from "../../utils/draft-ERC4337Utils.sol";
import {Paymaster} from "../Paymaster.sol";

/**
 * @dev Extension of {Paymaster} that supports account based on ownership of an ERC-721 token.
 *
 * This paymaster will sponsor user operations if the user has at least 1 token of the token specified
 * during construction.
 *
 * NOTE: {_validatePaymasterUserOp} reads `token.balanceOf` during the validation phase, accessing storage in
 * an external contract. ERC-7562 restricts unstaked paymasters from such accesses, and public mempool bundlers
 * will reject these operations when the token contract is proxied or upgradeable. Stake the paymaster
 * (see {Paymaster-_addStake}) when deploying against a public mempool.
 */
abstract contract PaymasterERC721Owner is Paymaster {
    IERC721 private immutable _token;

    constructor(IERC721 token_) {
        _token = token_;
    }

    /// @dev ERC-721 token used to validate the user operation.
    function token() public virtual returns (IERC721) {
        return _token;
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
