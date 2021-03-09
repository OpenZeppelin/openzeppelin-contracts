// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC1967Upgrade.sol";

abstract contract ERC1967UpgradeSecure is ERC1967Upgrade {
    /**
     * @dev Upgrade the implementation of the proxy, and then call a function from the new implementation as specified
     * by `data`, which should be an encoded function call. This is useful to initialize new storage variables in the
     * proxied contract.
     */
    function upgradeToAndCall(address newImplementation, bytes memory data) public payable virtual override {
        beforeUpgrade(newImplementation);
        ERC1967Storage._upgradeToAndCallSecure(newImplementation, data);
    }
}
