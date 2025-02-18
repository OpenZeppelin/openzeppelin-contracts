// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC20} from "../../interfaces/IERC20.sol";
import {ERC20, ERC1363} from "../../token/ERC20/extensions/ERC1363.sol";

// contract that replicate USDT approval behavior in approveAndCall
abstract contract ERC1363ForceApproveMock is ERC1363 {
    function approveAndCall(address spender, uint256 amount, bytes memory data) public virtual override returns (bool) {
        require(amount == 0 || allowance(msg.sender, spender) == 0, "USDT approval failure");
        return super.approveAndCall(spender, amount, data);
    }
}
