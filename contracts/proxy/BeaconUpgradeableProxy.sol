// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import './Proxy.sol';
import '../utils/Address.sol';
import './IBeacon.sol';

/**
 * @title BeaconUpgradeableProxy
 * @notice An individual contract instance for the implementation defined by the associated `Beacon` contract.
 */
contract BeaconUpgradeableProxy is Proxy {
    /**
     * @dev The storage slot of the Beacon contract which defines the implementation for this proxy.
     * This is bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1)) and is validated in the constructor.
     */
    bytes32 private constant BEACON_SLOT = 0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50;

    /**
     * @notice Creates a new proxy and optionally calls an initialize funcion defined in the implementation.
     * @param beacon The address of the Beacon contract which defines the logic to use for this proxy.
     * @param data The calldata to initialize this proxy, or empty if no initialization is required.
     */
    constructor(address beacon, bytes memory data) public payable {
        assert(BEACON_SLOT == bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1));
        _setBeacon(beacon, data);
    }

    /**
     * @dev Returns the address of the beacon defining the logic for this proxy.
     */
    function _beacon() internal view returns (address beacon) {
        bytes32 slot = BEACON_SLOT;
        assembly {
            beacon := sload(slot)
        }
    }

    /**
     * @dev Returns the address of the logic for this proxy, as defined by the Beacon.
     * This function is leveraged by the inherited `Proxy` implementation.
     */
    function _implementation() internal view override returns (address) {
        return IBeacon(_beacon()).implementation();
    }

    /**
     * @dev Sets the address of the beacon this proxy should use and optionally calls an initializer.
     * @param beacon The address of the Beacon contract which defines the logic to use for this proxy.
     * @param data The calldata to initialize this proxy, or empty if no initialization is required.
     */
    function _setBeacon(address beacon, bytes memory data) internal {
        require(
            Address.isContract(IBeacon(beacon).implementation()),
            "Cannot set a proxy beacon which points to a non-contract address"
        );
        bytes32 slot = BEACON_SLOT;
        assembly {
            sstore(slot, beacon)
        }

        if (data.length > 0) {
            Address.functionDelegateCall(_implementation(), data);
        }
    }
}
