// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20SafeApproval} from "./ERC20SafeApproval.sol";
import {ERC20} from "../ERC20.sol";

/**
 * @dev Concrete ERC20 token using ERC20SafeApproval extension.
 * Used for testing and demonstration purposes.
 */
contract ERC20SafeApprovalToken is ERC20SafeApproval {
    constructor(string memory name, string memory symbol, uint256 cap, uint256 initialSupply)
        ERC20(name, symbol)
        ERC20SafeApproval(cap)
    {
        _mint(msg.sender, initialSupply);
    }

    // TODO: add owner storage and onlyOwner modifier

    // TODO: add constructor

    // TODO: expose setApprovalCap for owner
}