// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../CrossChainEnabled.sol";
import "./LibArbitrumL2.sol";

abstract contract CrossChainEnabledArbitrumL2 is CrossChainEnabled {
    function _isCrossChain() internal view virtual override returns (bool) {
        return LibArbitrumL2.isCrossChain(address(LibArbitrumL2.ARBSYS));
    }

    function _crossChainSender() internal view virtual override onlyCrossChain() returns (address) {
        return LibArbitrumL2.crossChainSender(address(LibArbitrumL2.ARBSYS));
    }
}