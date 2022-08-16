// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (crosschain/arbitrum/CrossChainEnabledArbitrumL2.sol)

pragma solidity ^0.8.4;

import "../CrossChainEnabled.sol";
import "./LibArbitrumL2.sol";

/**
 * @dev https://arbitrum.io/[Arbitrum] specialization or the
 * {CrossChainEnabled} abstraction the L2 side (arbitrum).
 *
 * This version should only be deployed on L2 to process cross-chain messages
 * originating from L1. For the other side, use {CrossChainEnabledArbitrumL1}.
 *
 * Arbitrum L2 includes the `ArbSys` contract at a fixed address. Therefore,
 * this specialization of {CrossChainEnabled} does not include a constructor.
 *
 * _Available since v4.6._
 *
 * WARNING: There is currently a bug in Arbitrum that causes this contract to
 * fail to detect cross-chain calls when deployed behind a proxy. This will be
 * fixed when the network is upgraded to Arbitrum Nitro, currently scheduled for
 * August 31st 2022.
 */
abstract contract CrossChainEnabledArbitrumL2 is CrossChainEnabled {
    /**
     * @dev see {CrossChainEnabled-_isCrossChain}
     */
    function _isCrossChain() internal view virtual override returns (bool) {
        return LibArbitrumL2.isCrossChain(LibArbitrumL2.ARBSYS);
    }

    /**
     * @dev see {CrossChainEnabled-_crossChainSender}
     */
    function _crossChainSender() internal view virtual override onlyCrossChain returns (address) {
        return LibArbitrumL2.crossChainSender(LibArbitrumL2.ARBSYS);
    }
}
