// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../../token/ERC20/IERC20.sol";
import {IERC20Metadata} from "../../token/ERC20/extensions/IERC20Metadata.sol";

contract ERC20GetterHelper {
    event erc20totalSupply(IERC20 token, uint256 totalSupply);
    event erc20balanceOf(IERC20 token, address account, uint256 balanceOf);
    event erc20allowance(IERC20 token, address owner, address spender, uint256 allowance);
    event erc20name(IERC20Metadata token, string name);
    event erc20symbol(IERC20Metadata token, string symbol);
    event erc20decimals(IERC20Metadata token, uint8 decimals);

    function totalSupply(IERC20 token) external {
        emit erc20totalSupply(token, token.totalSupply());
    }

    function balanceOf(IERC20 token, address account) external {
        emit erc20balanceOf(token, account, token.balanceOf(account));
    }

    function allowance(IERC20 token, address owner, address spender) external {
        emit erc20allowance(token, owner, spender, token.allowance(owner, spender));
    }

    function name(IERC20Metadata token) external {
        emit erc20name(token, token.name());
    }

    function symbol(IERC20Metadata token) external {
        emit erc20symbol(token, token.symbol());
    }

    function decimals(IERC20Metadata token) external {
        emit erc20decimals(token, token.decimals());
    }
}
