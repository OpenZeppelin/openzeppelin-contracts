// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {IERC20, SafeERC20} from "../../token/ERC20/utils/SafeERC20.sol";
import {BridgeERC20Core} from "./BridgeERC20Core.sol";

/**
 * @dev This is a variant of {BridgeERC20Core} that implements the bridge logic for ERC-20 tokens that do not expose mint
 * and burn mechanism. Instead it takes custody of bridged assets.
 */
abstract contract BridgeERC20Custodial is BridgeERC20Core {
    using SafeERC20 for IERC20;

    IERC20 private immutable _token;

    constructor(IERC20 token_) {
        _token = token_;
    }

    /// @dev Return the address of the ERC20 token this bridge operates on.
    function token() public view virtual returns (IERC20) {
        return _token;
    }

    /// @dev "Locking" tokens is done by taking custody
    function _lock(address from, uint256 amount) internal virtual override {
        token().safeTransferFrom(from, address(this), amount);
    }

    /// @dev "Unlocking" tokens is done by releasing custody
    function _unlock(address to, uint256 amount) internal virtual override {
        token().safeTransfer(to, amount);
    }
}
