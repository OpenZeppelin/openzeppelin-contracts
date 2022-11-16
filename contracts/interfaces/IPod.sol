// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v5.0.0 (interfaces/IPod.sol)

pragma solidity ^0.8.0;

interface IPod {
    function updateBalances(address from, address to, uint256 amount) external;
}
