// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

// Used by the upgradeable transpilation, which inlines the `ERC7535` constructor argument into this mock.
// forge-lint: disable-next-line(unused-import)
import {IERC20} from "../../token/ERC20/IERC20.sol";
import {ERC7535} from "../../token/ERC20/extensions/ERC7535.sol";

abstract contract ERC7535LimitsMock is ERC7535 {
    function maxDeposit(address) public view virtual override returns (uint256) {
        return 1 ether;
    }
}
