// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (interfaces/draft-IERC7572.sol)

pragma solidity ^0.8.20;

/// @title ERC-7572 Contract Level Metadata
/// @dev Required interface of an ERC-7572 compliant contract, as defined in the
/// https://eips.ethereum.org/EIPS/eip-7572[ERC].
interface IERC7572 {
    /// @dev This event should be emitted on updates to the contract metadata
    /// to indicate to offchain indexers that they should query the contract
    /// for the latest URI.
    event ContractURIUpdated();

    /// @dev Returns an offchain resource for contract metadata or onchain JSON
    /// data string (data:application/json;utf8,{}).
    function contractURI() external view returns (string memory);
}
