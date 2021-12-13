// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.x.0 (proxy/ERC1822/IProxiable.sol)

pragma solidity ^0.8.0;

interface IProxiable {
    function proxiableUUID() external view returns (bytes32);
}
