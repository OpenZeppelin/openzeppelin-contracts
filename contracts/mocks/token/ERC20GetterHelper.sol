// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../../token/ERC20/IERC20.sol";
import {IERC20Metadata} from "../../token/ERC20/extensions/IERC20Metadata.sol";

contract ERC20GetterHelper {
    event ERC20totalSupply(IERC20 token, uint256 totalSupply);
    event ERC20balanceOf(IERC20 token, address account, uint256 balanceOf);
    event ERC20allowance(IERC20 token, address owner, address spender, uint256 allowance);
    event ERC20name(IERC20Metadata token, string name);
    event ERC20symbol(IERC20Metadata token, string symbol);
    event ERC20decimals(IERC20Metadata token, uint8 decimals);

    function totalSupply(IERC20 token) external {
        emit ERC20totalSupply(token, token.totalSupply());
    }

    function balanceOf(IERC20 token, address account) external {
        emit ERC20balanceOf(token, account, token.balanceOf(account));
    }

    function allowance(IERC20 token, address owner, address spender) external {
        emit ERC20allowance(token, owner, spender, token.allowance(owner, spender));
    }

    function name(IERC20Metadata token) external {
        emit ERC20name(token, token.name());
    }

    function symbol(IERC20Metadata token) external {
        emit ERC20symbol(token, token.symbol());
    }

    function decimals(IERC20Metadata token) external {
        emit ERC20decimals(token, token.decimals());
    }
}
