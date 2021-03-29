// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../CountersImpl.sol";
import "../../proxy/UUPS/UUPSUpgradeable.sol";

contract ProxiableMock is CountersImpl, UUPSUpgradeable {
    // Not having any checks in this function is dangerous! Do not do this outside tests!
    function _authorizeUpgrade(address) internal virtual override {}
}

contract ProxiableUnsafeMock is ProxiableMock {
    function upgradeTo(address newImplementation) external virtual override {
        ERC1967Upgrade._upgradeToAndCall(newImplementation, bytes(""));
    }

    function upgradeToAndCall(address newImplementation, bytes memory data) external payable virtual override {
        ERC1967Upgrade._upgradeToAndCall(newImplementation, data);
    }
}

contract ProxiableBrokenMock is ProxiableMock {
    function upgradeTo(address) external virtual override {
        // pass
    }

    function upgradeToAndCall(address, bytes memory) external payable virtual override {
        // pass
    }

}
