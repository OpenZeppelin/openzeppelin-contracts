// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../CrossChainEnabled.sol";
import "./LibAMB.sol";

/**
 * @dev [AMB](https://docs.tokenbridge.net/amb-bridge/about-amb-bridge)
 * specialization or the {CrossChainEnabled} abstraction.
 *
 * As of february 2020, AMB bridges are available between the following chains:
 * - [ETH <> xDai](https://docs.tokenbridge.net/eth-xdai-amb-bridge/about-the-eth-xdai-amb)
 * - [ETH <> qDai](https://docs.tokenbridge.net/eth-qdai-bridge/about-the-eth-qdai-amb)
 * - [ETH <> ETC](https://docs.tokenbridge.net/eth-etc-amb-bridge/about-the-eth-etc-amb)
 * - [ETH <> BSC](https://docs.tokenbridge.net/eth-bsc-amb/about-the-eth-bsc-amb)
 * - [ETH <> POA](https://docs.tokenbridge.net/eth-poa-amb-bridge/about-the-eth-poa-amb)
 * - [BSC <> xDai](https://docs.tokenbridge.net/bsc-xdai-amb/about-the-bsc-xdai-amb)
 * - [POA <> xDai](https://docs.tokenbridge.net/poa-xdai-amb/about-the-poa-xdai-amb)
 * - [Rinkeby <> xDai](https://docs.tokenbridge.net/rinkeby-xdai-amb-bridge/about-the-rinkeby-xdai-amb)
 * - [Kovan <> Sokol](https://docs.tokenbridge.net/kovan-sokol-amb-bridge/about-the-kovan-sokol-amb)
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
