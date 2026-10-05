// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Implementation contract with a payable `upgradeToAndCall(address,bytes)` function made to clash with
 * `TransparentUpgradeableProxy`'s interface to test correct functioning of the Transparent Proxy feature.
 */
contract ClashingImplementation {
    event ClashingImplementationCall();

    function upgradeToAndCall(address, bytes calldata) external payable {
        emit ClashingImplementationCall();
    }

    function delegatedFunction() external pure returns (bool) {
        return true;
    }
}
