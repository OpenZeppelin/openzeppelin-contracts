// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IProxiable {
    function upgradeTo(address) external;
    function upgradeToAndCall(address, bytes calldata) external payable;
}
