// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

// Used by the upgradeable transpilation, which inlines the `ERC7535` constructor argument into this mock.
// forge-lint: disable-next-line(unused-import)
import {IERC20} from "../../token/ERC20/IERC20.sol";
import {ERC7535} from "../../token/ERC20/extensions/ERC7535.sol";

abstract contract ERC7535DepositHookMock is ERC7535 {
    event TotalAssetsAfterDeposit(uint256 totalAssets);

    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal virtual override {
        super._deposit(caller, receiver, assets, shares);
        emit TotalAssetsAfterDeposit(totalAssets());
    }
}
