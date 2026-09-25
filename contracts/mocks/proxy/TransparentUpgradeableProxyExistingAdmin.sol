// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import {TransparentUpgradeableProxy} from "../../proxy/transparent/TransparentUpgradeableProxy.sol";

contract TransparentUpgradeableProxyExistingAdmin is TransparentUpgradeableProxy {
    constructor(
        address logic,
        address admin,
        bytes memory data
    ) payable TransparentUpgradeableProxy(logic, admin, data) {}

    function _deployProxyAdmin(address initialOwner) internal pure override returns (address) {
        return initialOwner;
    }
}
