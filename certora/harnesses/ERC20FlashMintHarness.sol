// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../patched/token/ERC20/ERC20.sol";
import "../patched/token/ERC20/extensions/ERC20FlashMint.sol";

contract ERC20FlashMintHarness is ERC20, ERC20FlashMint {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
}
