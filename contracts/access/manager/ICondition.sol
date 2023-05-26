// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

interface ICondition {
    function currentCaller() external view returns (address);
}