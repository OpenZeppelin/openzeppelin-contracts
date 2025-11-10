// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC20Permit} from "../patched/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Wrapper, IERC20, ERC20} from "../patched/token/ERC20/extensions/ERC20Wrapper.sol";

contract ERC20WrapperHarness is ERC20Permit, ERC20Wrapper {
    constructor(
        IERC20 _underlying,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) ERC20Permit(_name) ERC20Wrapper(_underlying) {}

    function recover(address account) public returns (uint256) {
        return _recover(account);
    }

    function decimals() public view override(ERC20Wrapper, ERC20) returns (uint8) {
        return super.decimals();
    }
}
