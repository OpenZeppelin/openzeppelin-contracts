// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

interface IBeacon {
    function implementation() external view returns (address);
}
