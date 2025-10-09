// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20Permit, ERC20} from "../patched/token/ERC20/extensions/ERC20Permit.sol";

contract ERC20PermitHarness is ERC20Permit {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) ERC20Permit(name) {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }
}
