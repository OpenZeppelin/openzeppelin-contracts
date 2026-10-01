// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {ERC4626, ERC20, IERC20} from "../patched/token/ERC20/extensions/ERC4626.sol";

contract ERC4626Harness is ERC4626 {
    constructor(IERC20 asset_, string memory name_, string memory symbol_) ERC20(name_, symbol_) ERC4626(asset_) {}

    /// @dev Not part of ERC-4626. Models an asset donation: an external actor sending assets to the vault without
    /// minting shares. Present so parametric rules and invariants range over it.
    function donate(uint256 assets) public {
        _transferIn(_msgSender(), assets);
    }
}
