// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC4626} from "../../interfaces/IERC4626.sol";

contract ERC7535ReentrantMock {
    event ObservedDuringRefund(uint256 totalAssets, uint256 totalSupply, uint256 refund);

    function mint(IERC4626 vault, uint256 shares) public payable {
        vault.mint{value: msg.value}(shares, address(this));
    }

    // Records the price of one share, as seen from a reentrant call during the refund.
    receive() external payable {
        IERC4626 vault = IERC4626(msg.sender);
        emit ObservedDuringRefund(vault.totalAssets(), vault.totalSupply(), msg.value);
    }
}
