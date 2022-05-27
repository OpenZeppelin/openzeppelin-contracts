// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (finance/Withdrawable.sol)
pragma solidity ^0.8.4;

import "../access/Ownable.sol";
import "../token/ERC20/IERC20.sol";

abstract contract Withdrawable is Ownable {

    event WithdrawalCompleted(uint256 amount);
    event TokenWithdrawalCompleted(address tokenAddress, uint256 amount);

    function withdraw(uint256 amount) public payable onlyOwner {
        require(amount > 0, "Withdrawable: Invalid amount");
        require(address(this).balance >= amount, "Withdrawable: Insuficient balance");
        payable(msg.sender).transfer(address(this).balance);
        emit WithdrawalCompleted(amount);
    }

    function withdrawTokens(address tokenAddress, uint256 amount) public payable onlyOwner {
        require(amount > 0, "Withdrawable: Invalid amount");
        IERC20 token = IERC20(tokenAddress);
        require(token.balanceOf(address(this)) >= amount, "Withdrawable: Insuficient balance");
        token.transfer(msg.sender, amount);
        emit TokenWithdrawalCompleted(address(token), amount);
    }
}
