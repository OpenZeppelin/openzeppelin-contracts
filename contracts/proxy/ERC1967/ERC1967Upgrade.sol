// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC1967Storage.sol";

/**
 * @dev This abstract contract provides event emiting update functions for
 * https://eips.ethereum.org/EIPS/eip-1967[EIP1967] slots.
 */
abstract contract ERC1967Upgrade is ERC1967Storage {
    // This is the keccak-256 hash of "eip1967.proxy.upgradePending" subtracted by 1
    bytes32 internal constant _UPGRADE_PENDING_SLOT = 0x39c07022fef61edd40345eccc814df883dce06b1b65a92ff48ae275074d292ee;

    /**
     * @dev Emitted when the implementation is upgraded.
     */
    event Upgraded(address indexed implementation);

    /**
     * @dev Emitted when the beacon is upgraded.
     */
    event BeaconUpgraded(address indexed beacon);

    /**
     * @dev Emitted when the admin account has changed.
     */
    event AdminChanged(address previousAdmin, address newAdmin);

    /**
     * @dev Perform implementation upgrade (with additional setup call)
     *
     * Emits an {Upgraded} event.
     */
    function _upgradeToAndCall(address newImplementation, bytes memory data) internal {
        _upgradeToAndCall(newImplementation, data, false);
    }

    function _upgradeToAndCall(address newImplementation, bytes memory data, bool forceCall) internal {
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
        if (data.length > 0 || forceCall) {
            Address.functionDelegateCall(newImplementation, data);
        }
    }

    /**
     * @dev Perform implementation upgrade (with security checks and additional setup call)
     *
     * Emits an {Upgraded} event.
     */
    function _upgradeToAndCallSecure(address newImplementation, bytes memory data) internal {
        _upgradeToAndCallSecure(newImplementation, data, false);
    }

    function _upgradeToAndCallSecure(address newImplementation, bytes memory data, bool forceCall) internal {
        address oldImplementation = _getImplementation();
        // check if nested in an upgrade check
        StorageSlot.BooleanSlot storage upgradePending = StorageSlot.getBooleanSlot(_UPGRADE_PENDING_SLOT);
        // do inital upgrade
        _setImplementation(newImplementation);
        // do setup call
        if (data.length > 0 || forceCall) {
            Address.functionDelegateCall(newImplementation, data);
        }
        if (!upgradePending.value) {
            // trigger upgrade check with flag set to true
            upgradePending.value = true;
            Address.functionDelegateCall(
                newImplementation,
                abi.encodeWithSignature(
                    "upgradeToAndCall(address,bytes)",
                    oldImplementation,
                    bytes("")
                )
            );
            upgradePending.value = false;
            // check upgrade was effective
            require(oldImplementation == _getImplementation(), "ERC1967Upgrade: upgrade breaks further upgrades");
            // reset upgrade
            _setImplementation(newImplementation);
            // emit event
            emit Upgraded(newImplementation);
        }
    }

    /**
     * @dev Perform implementation upgrade (with addition delegate call)
     *
     * Emits an {Upgraded} event.
     */
    function _upgradeBeaconToAndCall(address newBeacon, bytes memory data) internal {
        _upgradeBeaconToAndCall(newBeacon, data, false);
    }

    function _upgradeBeaconToAndCall(address newBeacon, bytes memory data, bool forceCall) internal {
        _setBeacon(newBeacon);
        emit BeaconUpgraded(newBeacon);
        if (data.length > 0 || forceCall) {
            Address.functionDelegateCall(IBeacon(newBeacon).implementation(), data);
        }
    }

    /**
     * @dev Changes the admin of the proxy.
     *
     * Emits an {AdminChanged} event.
     */
    function _changeAdmin(address newAdmin) internal {
        emit AdminChanged(_getAdmin(), newAdmin);
        _setAdmin(newAdmin);
    }
}
