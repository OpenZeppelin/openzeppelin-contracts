// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {UUPSUpgradeable} from "../../proxy/utils/UUPSUpgradeable.sol";
import {ERC1967Utils} from "../../proxy/ERC1967/ERC1967Utils.sol";

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
    function upgradeToAndCall(address newImplementation, bytes memory data) public payable override {
        ERC1967Utils.upgradeToAndCall(newImplementation, data);
    }
}

contract UUPSUnsupportedProxiableUUID is UUPSUpgradeableMock {
    function proxiableUUID() external pure override returns (bytes32) {
        return keccak256("invalid UUID");
    }
}
