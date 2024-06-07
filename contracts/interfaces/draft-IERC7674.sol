// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

interface IERC7674 {
    function temporaryApprove(address spender, uint256 value) external returns (bool success);
}
