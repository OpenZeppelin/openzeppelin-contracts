// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./UUPSUpgradeableMockUpgradeable.sol";
import "../../proxy/utils/Initializable.sol";

// This contract implements the pre-4.5 UUPS upgrade function with a rollback test.
// It's used to test that newer UUPS contracts are considered valid upgrades by older UUPS contracts.
contract UUPSUpgradeableLegacyMockUpgradeable is Initializable, UUPSUpgradeableMockUpgradeable {
    function __UUPSUpgradeableLegacyMock_init() internal onlyInitializing {
    }

    function __UUPSUpgradeableLegacyMock_init_unchained() internal onlyInitializing {
    }
    // Inlined from ERC1967Upgrade
    bytes32 private constant _ROLLBACK_SLOT = 0x4910fdfa16fed3260ed0e7147f7cc6da11a60208b5b9406d12a635614ffd9143;

    // ERC1967Upgrade._setImplementation is private so we reproduce it here.
    // An extra underscore prevents a name clash error.
    function __setImplementation(address newImplementation) private {
        require(AddressUpgradeable.isContract(newImplementation), "ERC1967: new implementation is not a contract");
        StorageSlotUpgradeable.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
    }

    function _upgradeToAndCallSecureLegacyV1(
        address newImplementation,
        bytes memory data,
        bool forceCall
    ) internal {
        address oldImplementation = _getImplementation();

        // Initial upgrade and setup call
        __setImplementation(newImplementation);
        if (data.length > 0 || forceCall) {
            __functionDelegateCall(newImplementation, data);
        }

        // Perform rollback test if not already in progress
        StorageSlotUpgradeable.BooleanSlot storage rollbackTesting = StorageSlotUpgradeable.getBooleanSlot(_ROLLBACK_SLOT);
        if (!rollbackTesting.value) {
            // Trigger rollback using upgradeTo from the new implementation
            rollbackTesting.value = true;
            __functionDelegateCall(
                newImplementation,
                abi.encodeWithSignature("upgradeTo(address)", oldImplementation)
            );
            rollbackTesting.value = false;
            // Check rollback was effective
            require(oldImplementation == _getImplementation(), "ERC1967Upgrade: upgrade breaks further upgrades");
            // Finally reset to the new implementation and log the upgrade
            _upgradeTo(newImplementation);
        }
    }

    // hooking into the old mechanism
    function upgradeTo(address newImplementation) external virtual override {
        _upgradeToAndCallSecureLegacyV1(newImplementation, bytes(""), false);
    }

    function upgradeToAndCall(address newImplementation, bytes memory data) external payable virtual override {
        _upgradeToAndCallSecureLegacyV1(newImplementation, data, false);
    }

    // ERC1967Upgrade._functionDelegateCall is private so we reproduce it here.
    // An extra underscore prevents a name clash error.
    function __functionDelegateCall(address target, bytes memory data) private returns (bytes memory) {
        require(AddressUpgradeable.isContract(target), "Address: delegate call to non-contract");

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return AddressUpgradeable.verifyCallResult(success, returndata, "Address: low-level delegate call failed");
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
