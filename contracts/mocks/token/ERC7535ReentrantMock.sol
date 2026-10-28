// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC4626} from "../../interfaces/IERC4626.sol";

contract ERC7535ReentrantMock {
    event ObservedOnReceive(uint256 totalAssets, uint256 totalSupply, uint256 value);

    function mint(IERC4626 vault, uint256 shares) public payable {
        vault.mint{value: msg.value}(shares, address(this));
    }

    function redeem(IERC4626 vault, uint256 shares) public {
        vault.redeem(shares, address(this), address(this));
    }

    // Records the price of one share, as seen from a reentrant call while the vault sends native asset.
    receive() external payable {
        IERC4626 vault = IERC4626(msg.sender);
        emit ObservedOnReceive(vault.totalAssets(), vault.totalSupply(), msg.value);
    }
}
