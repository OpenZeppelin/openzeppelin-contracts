// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.6.1) (interfaces/draft-IERC8255.sol)

pragma solidity >=0.6.2;

import {IERC20} from "./IERC20.sol";

/**
 * @dev Expiring Approval Extension for ERC-20 (https://eips.ethereum.org/EIPS/eip-8255[ERC-8255]).
 *
 * WARNING: This is a draft interface. The corresponding ERC is still subject to changes.
 */
interface IERC8255 is IERC20 {
    /**
     * @dev Returns the maximum approval duration, in seconds.
     */
    function maxApprovalDuration() external view returns (uint32);

    /**
     * @dev Returns the approval expiration timestamp and effective allowance for `spender` over `owner` tokens.
     *
     * If the approval has expired, the returned allowance is 0.
     */
    function allowanceAndExpiration(
        address owner,
        address spender
    ) external view returns (uint64 expiration, uint256 allowance);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the caller's tokens for `duration`
     * seconds.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits an {IERC20-Approval} event.
     */
    function approve(address spender, uint256 value, uint32 duration) external returns (bool);
}
