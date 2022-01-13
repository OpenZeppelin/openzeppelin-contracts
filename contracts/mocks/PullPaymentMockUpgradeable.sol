// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../security/PullPaymentUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

// mock class using PullPayment
contract PullPaymentMockUpgradeable is Initializable, PullPaymentUpgradeable {
    function __PullPaymentMock_init() internal onlyInitializing {
        __PullPayment_init_unchained();
        __PullPaymentMock_init_unchained();
    }

    function __PullPaymentMock_init_unchained() internal onlyInitializing {}

    // test helper function to call asyncTransfer
    function callTransfer(address dest, uint256 amount) public {
        _asyncTransfer(dest, amount);
    }
    uint256[50] private __gap;
}
