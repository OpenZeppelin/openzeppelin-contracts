// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../utils/Address.sol";

contract TimelockReentrant {
    address private _reenterTarget;
    bytes private _reenterData;
    bool _reentered;

    function disableReentrancy() external {
        _reentered = true;
    }

    function enableRentrancy(address target, bytes calldata data) external {
        _reenterTarget = target;
        _reenterData = data;
    }

    function reenter() external {
        if (!_reentered) {
            _reentered = true;
            Address.functionCall(_reenterTarget, _reenterData);
        }
    }
}
