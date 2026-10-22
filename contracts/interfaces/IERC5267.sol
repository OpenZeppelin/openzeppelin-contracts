// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC5267.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface for the EIP-712 domain retrieval standard.
 *
 * A standardized way for a contract to publish the fields and values of the EIP-712 domain it uses, so that an
 * external party can reconstruct the domain separator without prior knowledge of the contract's configuration.
 */
interface IERC5267 {
    /**
     * @dev MAY be emitted to signal that the domain could have changed.
     */
    event EIP712DomainChanged();

    /**
     * @dev Returns the fields and values that describe the EIP-712 domain separator used by this contract.
     *
     * `fields` is a bit map where bit `i` (counting from the least significant bit) is set when the `i`-th domain
     * field is present, ordered as `name`, `version`, `chainId`, `verifyingContract`, `salt`. `extensions` lists the
     * EIP numbers of any additional domain fields, each of which defines its own field name and type.
     */
    function eip712Domain()
        external
        view
        returns (
            bytes1 fields,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        );
}
