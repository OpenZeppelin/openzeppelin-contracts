// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC2612.sol)

pragma solidity >=0.6.2;

import {IERC20Permit} from "../token/ERC20/extensions/IERC20Permit.sol";

/**
 * @dev Interface for the ERC-2612 permit extension, allowing approvals to be made via signatures.
 *
 * ERC-2612 is the name given to the {IERC20Permit} interface; this alias is provided for discoverability.
 */
interface IERC2612 is IERC20Permit {}
