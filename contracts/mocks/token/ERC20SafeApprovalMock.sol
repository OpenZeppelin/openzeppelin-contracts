// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.20;

import {ERC20SafeApproval} from "../../token/ERC20/extensions/ERC20SafeApproval.sol";
import {ERC20} from "../../token/ERC20/ERC20.sol";

contract ERC20SafeApprovalMock is ERC20SafeApproval {
    constructor(string memory name, string memory symbol, uint256 cap)
        ERC20(name, symbol)
        ERC20SafeApproval(cap)
    {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function setApprovalCap(uint256 newCap) external {
        _setApprovalCap(newCap);
    }
}