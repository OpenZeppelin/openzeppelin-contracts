// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../../access/Ownable.sol";
import "../../crosschain/amb/CrossChainEnabledAMB.sol";
import "../../crosschain/arbitrum/CrossChainEnabledArbitrumL1.sol";
import "../../crosschain/arbitrum/CrossChainEnabledArbitrumL2.sol";
import "../../crosschain/optimism/CrossChainEnabledOptimism.sol";
import "../../crosschain/polygon/CrossChainEnabledPolygonChild.sol";

abstract contract Receiver is CrossChainEnabled {
    // we don't use Ownable because it messes up testing for the upgradeable contracts
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable state-variable-assignment
    address public immutable owner = msg.sender;

    function crossChainRestricted() external onlyCrossChain {}

    function crossChainOwnerRestricted() external onlyCrossChainSender(owner) {}
}

/**
 * AMB
 */
contract CrossChainEnabledAMBMock is Receiver, CrossChainEnabledAMB {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address bridge) CrossChainEnabledAMB(bridge) {}
}

/**
 * Arbitrum
 */
contract CrossChainEnabledArbitrumL1Mock is Receiver, CrossChainEnabledArbitrumL1 {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address bridge) CrossChainEnabledArbitrumL1(bridge) {}
}

contract CrossChainEnabledArbitrumL2Mock is Receiver, CrossChainEnabledArbitrumL2 {}

/**
 * Optimism
 */
contract CrossChainEnabledOptimismMock is Receiver, CrossChainEnabledOptimism {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address bridge) CrossChainEnabledOptimism(bridge) {}
}

/**
 * Polygon
 */
contract CrossChainEnabledPolygonChildMock is Receiver, CrossChainEnabledPolygonChild {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address bridge) CrossChainEnabledPolygonChild(bridge) {}
}
