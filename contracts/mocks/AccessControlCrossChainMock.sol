// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../access/AccessControlCrossChain.sol";
import "../crosschain/arbitrum/CrossChainEnabledArbitrumL2.sol";

contract AccessControlCrossChainMock is AccessControlCrossChain, CrossChainEnabledArbitrumL2 {}
