// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC5805.sol)

pragma solidity >=0.8.4;

import {IVotes} from "../governance/utils/IVotes.sol";
import {IERC6372} from "./IERC6372.sol";

/**
 * @dev Interface for the ERC-5805 voting-with-delegation standard.
 *
 * Combines the {IVotes} delegation and vote-tracking interface with an {IERC6372} clock, so vote checkpoints work
 * with either block numbers or timestamps as reported by {IERC6372-CLOCK_MODE}.
 */
interface IERC5805 is IERC6372, IVotes {}
