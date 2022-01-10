// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.x.0 (proxy/ERC1822/IProxiable.sol)

pragma solidity ^0.8.0;

/**
 * @dev ERC1822: Universal Upgradeable Proxy Standard (UUPS) documents a method for upgradeability through a simplified
 * proxy whose upgrades are fully controlled by the current implementation.
 */
interface IERC1822Proxiable {
    /**
     * @dev Returns the storage slot that the proxiable contract assumes is being used to store the implementation
     * address. Must revert if invoked through delegatecall, i.e. through a proxy, otherwise risks bricking a contract
     * that upgrades to it.
     */
    function proxiableUUID() external view returns (bytes32);
}
