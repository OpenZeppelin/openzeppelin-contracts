// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {IERC7802} from "../../interfaces/draft-IERC7802.sol";
import {BridgeERC20} from "./BridgeERC20.sol";

/**
 * @dev This is a variant of {BridgeERC20} that implements the bridge logic for ERC-7802 compliant tokens.
 */
abstract contract BridgeERC7802 is BridgeERC20 {
    IERC7802 private immutable _token;

    constructor(IERC7802 token_) {
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

    /// @dev "Unlocking" tokens using an ERC-7802 crosschain mint
    function _unlock(address to, uint256 amount) internal virtual override {
        token().crosschainMint(to, amount);
    }
}
