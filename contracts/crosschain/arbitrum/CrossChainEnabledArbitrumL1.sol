// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (crosschain/arbitrum/CrossChainEnabledArbitrumL1.sol)

pragma solidity ^0.8.4;

import "../CrossChainEnabled.sol";
import "./LibArbitrumL1.sol";

/**
 * @dev [Arbitrum](https://arbitrum.io/) specialization or the
 * {CrossChainEnabled} abstraction the L1 side (mainnet).
 *
 * This version should only be deployed on L1 to process cross-chain messages
 * originating from L2. For the other side, use {CrossChainEnabledArbitrumL2}.
 *
 * The bridge contract is provided and maintained by the arbitrum team. You can
 * find the address of this contract on the rinkeby testnet in
 * [Arbitrum's developer documentation](https://developer.offchainlabs.com/docs/useful_addresses).
 *
 * _Available since v4.6._
 */
abstract contract CrossChainEnabledArbitrumL1 is CrossChainEnabled {
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address private immutable _bridge;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address bridge) {
        _bridge = bridge;
    }

    /**
     * @dev see {CrossChainEnabled-_isCrossChain}
     */
    function _isCrossChain() internal view virtual override returns (bool) {
        return LibArbitrumL1.isCrossChain(_bridge);
    }

    /**
     * @dev see {CrossChainEnabled-_crossChainSender}
     */
    function _crossChainSender() internal view virtual override onlyCrossChain returns (address) {
        return LibArbitrumL1.crossChainSender(_bridge);
    }
}
