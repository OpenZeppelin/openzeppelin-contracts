// contracts/ERC3643Token.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AccessControl} from "../../../../access/AccessControl.sol";
import {ERC20} from "../../../../token/ERC20/ERC20.sol";
import {ERC3643} from "../../../../token/ERC20/extensions/ERC3643/ERC3643.sol";

contract ERC3643Token is ERC3643, AccessControl {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    constructor(
        address identityRegistry,
        address compliance,
        address admin
    ) ERC20("Security Token", "SEC") ERC3643(identityRegistry, compliance, address(0)) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function _checkAdmin() internal view override {
        _checkRole(AGENT_ROLE);
    }
}
