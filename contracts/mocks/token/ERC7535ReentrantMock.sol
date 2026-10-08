// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC4626} from "../../interfaces/IERC4626.sol";

contract ERC7535ReentrantMock {
    IERC4626 private immutable _vault;
    uint256 public observedAssets;

    constructor(IERC4626 vault) {
        _vault = vault;
    }

    function mint(uint256 shares) public payable {
        _vault.mint{value: msg.value}(shares, address(this));
    }

    // Records the price of one share, as seen from a reentrant call during the refund.
    receive() external payable {
        observedAssets = _vault.convertToAssets(10 ** _vault.decimals());
    }
}
