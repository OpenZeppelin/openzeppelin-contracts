// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC7802} from "../../interfaces/draft-IERC7802.sol";
import {CrosschainBridgeERC20} from "./CrosschainBridgeERC20.sol";

/**
 * @dev This is a variant of {CrosschainBridgeERC20} that implements the bridge logic for ERC-7802 compliant tokens.
 */
abstract contract CrosschainBridgeERC20Bridgeable is CrosschainBridgeERC20 {
    IERC7802 private immutable _token;

    constructor(
        IERC7802 token_,
        address initialGateway,
        bytes[] memory remoteTokens
    ) CrosschainBridgeERC20(initialGateway, remoteTokens) {
        _token = token_;
    }

    /// @dev Return the address of the ERC20 token this bridge operates on.
    function token() public view virtual returns (IERC7802) {
        return _token;
    }

    /// @dev "Locking" tokens using an ERC-7802 crosschain burn
    function _lock(address from, uint256 amount) internal virtual override {
        token().crosschainBurn(from, amount);
    }

    /// @dev "Unlocking" tokens using an ERC-7802 crosschain burn
    function _unlock(address to, uint256 amount) internal virtual override {
        token().crosschainMint(to, amount);
    }
}
