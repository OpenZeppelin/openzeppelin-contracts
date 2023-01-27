// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../proxy/utils/UUPSUpgradeable.sol";
import "../../utils/Counters.sol";

contract NonUpgradeableMock {
    Counters.Counter internal _counter;

    function current() external view returns (uint256) {
        return Counters.current(_counter);
    }

    function increment() external {
        return Counters.increment(_counter);
    }
}

contract UUPSUpgradeableMock is NonUpgradeableMock, UUPSUpgradeable {
    // Not having any checks in this function is dangerous! Do not do this outside tests!
    function _authorizeUpgrade(address) internal override {}
}

contract UUPSUpgradeableUnsafeMock is UUPSUpgradeableMock {
    function upgradeTo(address newImplementation) public override {
        ERC1967Upgrade._upgradeToAndCall(newImplementation, bytes(""), false);
    }

    function upgradeToAndCall(address newImplementation, bytes memory data) public payable override {
        ERC1967Upgrade._upgradeToAndCall(newImplementation, data, false);
    }
}
