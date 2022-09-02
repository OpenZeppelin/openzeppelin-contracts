// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (utils/domains/IERC4834Enumerable.sol)

pragma solidity ^0.8.0;

import "./IERC4834.sol";

interface IDomainEnumerable is IDomain {
    /**
     * @notice     Query all subdomains. Must revert if the number of domains is unknown or infinite.
     * @return     The subdomain with the given index.
     */
    function subdomainByIndex(uint256 index) external view returns (string memory);
    
    /**
     * @notice     Get the total number of subdomains. Must revert if the number of domains is unknown or infinite.
     * @return     The total number of subdomains
     */
    function totalSubdomains() external view returns (uint256);
}
