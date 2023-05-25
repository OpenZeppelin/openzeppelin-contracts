// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

interface ICondition {
    function getCaller() external view returns (address);
}