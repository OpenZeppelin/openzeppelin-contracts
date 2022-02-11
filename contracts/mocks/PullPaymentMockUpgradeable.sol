// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../security/PullPaymentUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

// mock class using PullPayment
contract PullPaymentMockUpgradeable is Initializable, PullPaymentUpgradeable {
    function __PullPaymentMock_init() internal onlyInitializing {
        __PullPayment_init_unchained();
    }

    function __PullPaymentMock_init_unchained() internal onlyInitializing {}

    // test helper function to call asyncTransfer
    function callTransfer(address dest, uint256 amount) public {
        _asyncTransfer(dest, amount);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
