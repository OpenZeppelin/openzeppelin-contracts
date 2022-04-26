// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (crosschain/optimism/CrossChainEnabledOptimism.sol)

pragma solidity ^0.8.4;

import "../CrossChainEnabled.sol";
import "./LibOptimism.sol";

/**
 * @dev [Optimism](https://www.optimism.io/) specialization or the
 * {CrossChainEnabled} abstraction.
 *
 * The messenger (`CrossDomainMessenger`) contract is provided and maintained by
 * the optimism team. You can find the address of this contract on mainnet and
 * kovan in the [deployments section of Optimism monorepo](https://github.com/ethereum-optimism/optimism/tree/develop/packages/contracts/deployments).
 *
 * _Available since v4.6._
 */
abstract contract CrossChainEnabledOptimism is CrossChainEnabled {
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address private immutable _messenger;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address messenger) {
        _messenger = messenger;
    }

    /**
     * @dev see {CrossChainEnabled-_isCrossChain}
     */
    function _isCrossChain() internal view virtual override returns (bool) {
        return LibOptimism.isCrossChain(_messenger);
    }

    /**
     * @dev see {CrossChainEnabled-_crossChainSender}
     */
    function _crossChainSender() internal view virtual override onlyCrossChain returns (address) {
        return LibOptimism.crossChainSender(_messenger);
    }
}
