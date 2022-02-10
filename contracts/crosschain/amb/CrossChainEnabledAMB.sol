// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../CrossChainEnabled.sol";
import "./LibAMB.sol";

contract CrossChainEnabledAMB is CrossChainEnabled {
    address internal immutable bridge;

    constructor(address _bridge) {
        bridge = _bridge;
    }

    function _isCrossChain() internal view virtual override returns (bool) {
        return LibAMB.isCrossChain(bridge);
    }

    function _crossChainSender() internal view virtual override onlyCrossChain() returns (address) {
        return LibAMB.crossChainSender(bridge);
    }
}