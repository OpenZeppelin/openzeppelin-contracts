// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../../proxy/utils/UUPSUpgradeable.sol";

contract NonUpgradeableMock {
    uint256 internal _counter;

    function current() external view returns (uint256) {
        return _counter;
    }

    function increment() external {
        ++_counter;
    }
}

contract UUPSUpgradeableMock is NonUpgradeableMock, UUPSUpgradeable {
    // Not having any checks in this function is dangerous! Do not do this outside tests!
    function _authorizeUpgrade(address) internal override {}
}

contract UUPSUpgradeableUnsafeMock is UUPSUpgradeableMock {
    function upgradeTo(address newImplementation) public override {
        _upgradeToAndCall(newImplementation, bytes(""), false);
    }

    function upgradeToAndCall(address newImplementation, bytes memory data) public payable override {
        _upgradeToAndCall(newImplementation, data, false);
    }
}
