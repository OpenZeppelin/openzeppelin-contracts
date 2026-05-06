// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "../ERC20.sol";

/**
 * @dev Extension of ERC20 that adds a configurable approval cap
 * and per-approval expiration timestamps.
 */
abstract contract ERC20SafeApproval is ERC20 {
    // TODO: approval cap storage
    // TODO: expiry storage
    // TODO: override approve()
    // TODO: override transferFrom()
}