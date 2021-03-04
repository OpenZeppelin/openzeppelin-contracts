// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IERC20.sol";

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the tokens.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the tokens.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the tokens.
     */
    function decimals() external view returns (uint8);
}
