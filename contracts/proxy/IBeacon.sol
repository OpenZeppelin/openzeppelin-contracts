// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

interface IBeacon {
    function implementation() external view returns (address);
}
