// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.9.0;

import "./IERC20.sol";

/**
 * @dev Interface of the ERC1404 standard as defined in the EIP.
 */
interface IERC1404 is IERC20 {
    function detectTransferRestriction(address from, address to, uint256 amount) external view returns (uint8);
    function messageForTransferRestriction(uint8 restrictionCode) external view returns (string memory);
}
