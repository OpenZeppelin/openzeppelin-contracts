// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../access/AccessControlCrossChain.sol";
import "../crosschain/arbitrum/CrossChainEnabledArbitrumL2.sol";

contract AccessControlCrossChainMock is AccessControlCrossChain, CrossChainEnabledArbitrumL2 {
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function setRoleAdmin(bytes32 roleId, bytes32 adminRoleId) public {
        _setRoleAdmin(roleId, adminRoleId);
    }

    function senderProtected(bytes32 roleId) public onlyRole(roleId) {}

    function crossChainRoleAlias(bytes32 role) public pure returns (bytes32) {
        return _crossChainRoleAlias(role);
    }
}
