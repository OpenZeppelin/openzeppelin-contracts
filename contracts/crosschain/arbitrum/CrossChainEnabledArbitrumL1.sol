// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../CrossChainEnabled.sol";
import "./LibArbitrumL1.sol";

/**
 * @dev [Arbitrum](https://arbitrum.io/) specialization or the
 * {CrossChainEnabled} abstraction the L1 side (mainnet).
 *
 * This version should only be deployed on L1 to process cross-chain messages
 * originating from L2. For the other side, use {CrossChainEnabledArbitrumL2}.
 *
 * The inbox contract is provided and maintained by the arbitrum team. You can
 * find the address of this contract on the rinkeby testnet in
 * [Arbitrum's developer documentation](https://developer.offchainlabs.com/docs/public_testnet#l1).
 *
 * _Available since v4.6._
 */
abstract contract CrossChainEnabledArbitrumL1 is CrossChainEnabled {
    address private immutable _inbox;

    constructor(address inbox) {
        _inbox = inbox;
    }

    /**
     * @dev see {CrossChainEnabled-_isCrossChain}
     */
    function _isCrossChain() internal view virtual override returns (bool) {
        return LibArbitrumL1.isCrossChain(_inbox);
    }

    /**
     * @dev see {CrossChainEnabled-_crossChainSender}
     */
    function _crossChainSender() internal view virtual override onlyCrossChain returns (address) {
        return LibArbitrumL1.crossChainSender(_inbox);
    }
}
