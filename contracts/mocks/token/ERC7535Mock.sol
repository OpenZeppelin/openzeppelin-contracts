// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

// `IERC20` is used by the upgradeable transpilation, which inlines the `ERC7535` constructor argument into this mock.
// forge-lint: disable-next-line(unused-import)
import {IERC20, ERC20} from "../../token/ERC20/ERC20.sol";
import {ERC7535} from "../../token/ERC20/extensions/ERC7535.sol";

// Concrete (non-exposed) vault: the `$` wrapper adds a `receive` function, which ERC7535 deliberately lacks.
contract ERC7535Mock is ERC7535 {
    constructor() ERC20("ERC7535Mock", "E7535M") {}
}
