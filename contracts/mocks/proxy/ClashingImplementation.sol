// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

/**
 * @dev Implementation contract with a payable changeAdmin(address) function made to clash with
 * TransparentUpgradeableProxy's to test correct functioning of the Transparent Proxy feature.
 */
contract ClashingImplementation {
    event ClashingImplementationCall();

    function upgradeTo(address) external payable {
        emit ClashingImplementationCall();
    }

    function delegatedFunction() external pure returns (bool) {
        return true;
    }
}
