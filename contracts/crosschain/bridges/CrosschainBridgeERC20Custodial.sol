// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC20, SafeERC20} from "../../token/ERC20/utils/SafeERC20.sol";
import {CrosschainBridgeERC20} from "./CrosschainBridgeERC20.sol";

/**
 * @dev This is a variant of {CrosschainBridgeERC20} that implements the bridge logic for existing ERC-20 tokens.
 */
abstract contract CrosschainBridgeERC20Custodial is CrosschainBridgeERC20 {
    using SafeERC20 for IERC20;

    IERC20 private immutable _token;

    constructor(
        IERC20 token_,
        address initialGateway,
        bytes[] memory remoteTokens
    ) CrosschainBridgeERC20(initialGateway, remoteTokens) {
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
