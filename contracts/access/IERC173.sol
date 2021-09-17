// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC173 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-173[EIP].
 *
 * For an implementation, see {Ownable}.
 */
interface IERC173 {
    /**
     * @dev Emitted when ownership of a contract changes.
     */
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @notice Returns the address of the owner.
     * @return The address of the owner.
     */
    function owner() external view returns (address);

    /**
     * @notice Set the address of the new owner of the contract.
     * @dev Set newOwner to address(0) to renounce any ownership.
     * @param newOwner The address of the new owner of the contract.
     */
    function transferOwnership(address newOwner) external;
}
