// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../MultiParty.sol";
import "../../token/ERC20/IERC20.sol";

/**
 * @dev Additional implementation of the Multiparty standard with ERC20 support.
 */
contract MultiPartyWithERC20 is MultiParty {
    constructor(address[] memory initialMembers) MultiParty(initialMembers) {}

    /**
     * @dev Transfers `value` amount of tokens of `from` address to address `to`.
     * For this to happen `erc20Contract` should either own/approved to transfer the tokens.
     * This method should be public with `onlySelf` modifier and will be executed only if it's approved by the group.
     * (Approval is defined by the `isActionApproved` method)
     *
     */
    function transferERC20(
        address erc20Contract,
        address from,
        address to,
        uint256 value
    ) external virtual onlySelf returns (bool success) {
        IERC20(erc20Contract).transferFrom(from, to, value);
        return true;
    }

    /**
     * @dev Allows `spender` to withdraw from your group multiple times, up to the `value` amount.
     * If this function is called again it overwrites the current allowance with `value`.
     * This method should be public with `onlySelf` modifier and will be executed only if it's approved by the group.
     * (Approval is defined by the `isActionApproved` method)
     *
     */
    function approveERC20(
        address erc20Contract,
        address spender,
        uint256 value
    ) external virtual onlySelf returns (bool success) {
        IERC20(erc20Contract).approve(spender, value);
        return true;
    }
}
