// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../CrossChainEnabled.sol";
import "./LibArbitrumL1.sol";

abstract contract CrossChainEnabledArbitrumL1 is CrossChainEnabled {
    address private immutable _bridge;

    constructor(address bridge) {
        _bridge = bridge;
    }

    function _isCrossChain() internal view virtual override returns (bool) {
        return LibArbitrumL1.isCrossChain(_bridge);
    }

    function _crossChainSender() internal view virtual override onlyCrossChain returns (address) {
        return LibArbitrumL1.crossChainSender(_bridge);
    }
}
