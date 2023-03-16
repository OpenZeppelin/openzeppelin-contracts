// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IAuthority {
    function canCall(address caller, address target, bytes4 selector) external view returns (bool allowed);
}
