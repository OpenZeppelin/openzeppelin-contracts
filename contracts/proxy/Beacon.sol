// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import './IBeacon.sol';
import '../access/Ownable.sol';
import '../utils/Address.sol';

/**
 * @title Beacon
 * @notice Defines the implementation for one or more `BeaconUpgradeabilityProxy` instances.
 * @dev There is one Beacon for each like-kind contract.
 */
contract Beacon is IBeacon, Ownable {
    /**
     * @dev Stores the address of the logic implementation to be used by all `BeaconUpgradeabilityProxy` pointing to this `Beacon`.
     */
    address private _implementation;

    event Upgraded(address indexed implementation);

    /**
     * @notice Sets the owner to msg.sender and the initial logic implementaion to use.
     */
    constructor(address implementation_) public {
        _setImplementation(implementation_);
    }

    /**
     * @notice Returns the logic implementation to be used by each `BeaconUpgradeabilityProxy` pointing to this `Beacon`.
     */
    function implementation() public view override returns (address) {
        return _implementation;
    }

    /**
     * @notice Allows the owner to change the logic implementation.
     * @dev The owner may or may not be another contract, e.g. allowing for a multi-sig or more sophisticated upgrade logic.
     */
    function upgradeTo(address newImplementation) public onlyOwner {
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }

    /**
     * @dev Confirms that the logic implementation is a valid contract before setting the associated variable.
     */
    function _setImplementation(address newImplementation) private {
        require(Address.isContract(newImplementation), "Beacon: implementation is not a contract");
        _implementation = newImplementation;
    }
}
