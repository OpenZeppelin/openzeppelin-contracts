// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../CrossChainEnabled.sol";
import "./LibOptimism.sol";

/**
 * @dev [Optimism](https://www.optimism.io/) specialization or the
 * {CrossChainEnabled} abstraction.
 *
 * The bridge (`CrossDomainMessenger`) contract is provided and maintained by
 * the optimism team. You can find the address of this contract on mainnet and
 * kovan in the [deployments section of Optimism monorepo](https://github.com/ethereum-optimism/optimism/tree/develop/packages/contracts/deployments).
 *
 * _Available since v4.6._
 */
abstract contract CrossChainEnabledOptimism is CrossChainEnabled {
    address private immutable _bridge;

    constructor(address bridge) {
        _bridge = bridge;
    }

    /**
     * @dev see {CrossChainEnabled-_isCrossChain}
     */
    function _isCrossChain() internal view virtual override returns (bool) {
        return LibOptimism.isCrossChain(_bridge);
    }

    /**
     * @dev see {CrossChainEnabled-_crossChainSender}
     */
    function _crossChainSender() internal view virtual override onlyCrossChain returns (address) {
        return LibOptimism.crossChainSender(_bridge);
    }
}
