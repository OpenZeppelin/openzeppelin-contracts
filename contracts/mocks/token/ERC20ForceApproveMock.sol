// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../../token/ERC20/ERC20.sol";

// contract that replicate USDT (0xdac17f958d2ee523a2206206994597c13d831ec7) approval beavior
abstract contract ERC20ForceApproveMock is ERC20 {
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        require(amount == 0 || allowance(msg.sender, spender) == 0, "USDT approval failure");
        return super.approve(spender, amount);
    }
}
