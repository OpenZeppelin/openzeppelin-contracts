// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC20, ERC20Bridgeable} from "../../token/ERC20/extensions/draft-ERC20Bridgeable.sol";

abstract contract ERC20BridgeableMock is ERC20Bridgeable {
    address private _bridge;

    error OnlyTokenBridge();
    event OnlyTokenBridgeFnCalled(address caller);

    constructor(address bridge) {
        _bridge = bridge;
    }

    function onlyTokenBridgeFn() external onlyTokenBridge {
        emit OnlyTokenBridgeFnCalled(msg.sender);
    }

    function _checkTokenBridge(address sender) internal view override {
        if (sender != _bridge) {
            revert OnlyTokenBridge();
        }
    }
}
