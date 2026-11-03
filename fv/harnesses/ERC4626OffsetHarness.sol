// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {ERC4626, ERC20, IERC20} from "../patched/token/ERC20/extensions/ERC4626.sol";

/// @dev ERC4626Harness with the decimals offset left symbolic instead of pinned to zero. The offset
/// is an immutable the prover treats as an unconstrained constant, so rules verified here hold for
/// every offset a deployment could choose, not just the default.
contract ERC4626OffsetHarness is ERC4626 {
    uint8 private immutable _offset;

    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        uint8 offset_
    ) ERC20(name_, symbol_) ERC4626(asset_) {
        _offset = offset_;
    }

    function _decimalsOffset() internal view override returns (uint8) {
        return _offset;
    }

    /// @dev Exposed so rules can constrain the offset and state the range they hold over.
    function decimalsOffset() public view returns (uint8) {
        return _offset;
    }

    /// @dev The virtual share supply, 10**offset. Exposed so rules can state bounds in terms of the
    /// quantity the conversions actually use, rather than re-deriving the exponentiation in CVL.
    function virtualShares() public view returns (uint256) {
        return 10 ** _decimalsOffset();
    }

    /// @dev Not part of ERC-4626. Models an asset donation: an external actor sending assets to the
    /// vault without minting shares. Present so parametric rules and invariants range over it.
    function donate(uint256 assets) public {
        _transferIn(_msgSender(), assets);
    }
}
