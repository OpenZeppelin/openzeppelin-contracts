// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (crosschain/amb/CrossChainEnabledAMB.sol)

pragma solidity ^0.8.4;

import "../CrossChainEnabled.sol";
import "./LibAMB.sol";

/**
 * @dev https://docs.tokenbridge.net/amb-bridge/about-amb-bridge[AMB]
 * specialization or the {CrossChainEnabled} abstraction.
 *
 * As of february 2020, AMB bridges are available between the following chains:
 *
 * - https://docs.tokenbridge.net/eth-xdai-amb-bridge/about-the-eth-xdai-amb[ETH ⇌ xDai]
 * - https://docs.tokenbridge.net/eth-qdai-bridge/about-the-eth-qdai-amb[ETH ⇌ qDai]
 * - https://docs.tokenbridge.net/eth-etc-amb-bridge/about-the-eth-etc-amb[ETH ⇌ ETC]
 * - https://docs.tokenbridge.net/eth-bsc-amb/about-the-eth-bsc-amb[ETH ⇌ BSC]
 * - https://docs.tokenbridge.net/eth-poa-amb-bridge/about-the-eth-poa-amb[ETH ⇌ POA]
 * - https://docs.tokenbridge.net/bsc-xdai-amb/about-the-bsc-xdai-amb[BSC ⇌ xDai]
 * - https://docs.tokenbridge.net/poa-xdai-amb/about-the-poa-xdai-amb[POA ⇌ xDai]
 * - https://docs.tokenbridge.net/rinkeby-xdai-amb-bridge/about-the-rinkeby-xdai-amb[Rinkeby ⇌ xDai]
 * - https://docs.tokenbridge.net/kovan-sokol-amb-bridge/about-the-kovan-sokol-amb[Kovan ⇌ Sokol]
 *
 * _Available since v4.6._
 */
contract CrossChainEnabledAMB is CrossChainEnabled {
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
        return LibAMB.isCrossChain(_bridge);
    }

    /**
     * @dev see {CrossChainEnabled-_crossChainSender}
     */
    function _crossChainSender() internal view virtual override onlyCrossChain returns (address) {
        return LibAMB.crossChainSender(_bridge);
    }
}
