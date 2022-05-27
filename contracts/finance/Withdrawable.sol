// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (finance/Withdrawable.sol)
pragma solidity ^0.8.4;

import "../access/Ownable.sol";
import "../token/ERC20/IERC20.sol";

/**
 * @title Withdrawable
 * @dev This contract handles the withdrawal of Ether and ERC20 tokens by the contract owner.
 *
 * Any ERC20 token can be used to withdraw funds from the contract.
 */
abstract contract Withdrawable is Ownable {
    event WithdrawalCompleted(uint256 amount);
    event TokenWithdrawalCompleted(address tokenAddress, uint256 amount);

    /**
     * @dev Withdraw Ether from the contract by the owner.
     *
     * Emits a {WithdrawalCompleted} event.
     */
    function withdraw(uint256 amount) public payable onlyOwner {
        require(amount > 0, "Withdrawable: Invalid amount");
        require(address(this).balance >= amount, "Withdrawable: Insuficient balance");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawable: Transfer failed.");
        emit WithdrawalCompleted(amount);
    }

    /**
     * @dev Withdraw an ERC20 Token from the contract by the owner.
     *
     * Emits a {TokenWithdrawalCompleted} event.
     */
    function withdrawTokens(address tokenAddress, uint256 amount) public payable onlyOwner {
        require(amount > 0, "Withdrawable: Invalid amount");
        IERC20 token = IERC20(tokenAddress);
        require(token.balanceOf(address(this)) >= amount, "Withdrawable: Insuficient balance");
        token.transfer(msg.sender, amount);
        emit TokenWithdrawalCompleted(address(token), amount);
    }
}
