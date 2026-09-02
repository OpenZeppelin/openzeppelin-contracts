// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC20} from "./IERC20.sol";
import {IPausable} from "../utils/Pausable.sol";

/**
 * @title IAgentRole
 * @dev Interface for managing agent roles in the ERC-3643 ecosystem.
 *
 * The Agent Role interface provides a standardized access control mechanism for
 * ERC-3643 contracts. Agents are authorized addresses that can perform operational
 * functions on behalf of the contract owner, enabling delegation of administrative
 * tasks while maintaining security.
 *
 * Key concepts:
 *
 * * Owner: The contract owner who can add/remove agents (typically ERC-173 owner)
 * * Agent: Authorized addresses that can perform specific operational functions
 * * Delegation: Agents can perform actions without requiring owner intervention
 *
 * Common agent responsibilities in ERC-3643:
 *
 * * Token minting and burning operations
 * * Address and token freezing/unfreezing
 * * Forced transfers for compliance or recovery
 * * Identity registry management
 * * Compliance rule enforcement
 *
 * Security model:
 *
 * * Only the owner can manage the agent list
 * * Agents have limited, function-specific permissions
 * * Agent permissions are defined by the implementing contract
 * * Multi-agent support enables operational scalability
 *
 * Integration:
 * Any contract in the ERC-3643 ecosystem that requires agent-based access control
 * must implement this interface to ensure consistent authorization patterns.
 */
interface IAgentRole {
    /**
     * @dev Emitted when a new agent is added to the contract.
     *
     * @param _agent The address of the agent that was added
     */
    event AgentAdded(address indexed _agent);

    /**
     * @dev Emitted when an agent is removed from the contract.
     *
     * @param _agent The address of the agent that was removed
     */
    event AgentRemoved(address indexed _agent);

    /**
     * @dev Adds a new agent to the contract.
     *
     * Agents are authorized addresses that can perform specific operational
     * functions defined by the implementing contract. The exact permissions
     * granted to agents depend on the contract's implementation.
     *
     * @param _agent The address to be granted agent role
     *
     * Requirements:
     *
     * * Only the contract owner can call this function
     * * `_agent` must not be the zero address
     * * `_agent` must not already be an agent
     *
     * Emits an {AgentAdded} event.
     */
    function addAgent(address _agent) external;

    /**
     * @dev Removes an existing agent from the contract.
     *
     * After removal, the address will no longer have agent permissions
     * and cannot perform agent-restricted functions.
     *
     * @param _agent The address to have its agent role revoked
     *
     * Requirements:
     *
     * * Only the contract owner can call this function
     * * `_agent` must currently be an agent
     *
     * Emits an {AgentRemoved} event.
     */
    function removeAgent(address _agent) external;

    /**
     * @dev Checks if an address has agent role.
     *
     * This function is used by other contract functions to verify
     * whether an address is authorized to perform agent-restricted operations.
     *
     * @param _agent The address to check for agent role
     * @return True if the address is an agent, false otherwise
     */
    function isAgent(address _agent) external view returns (bool);
}

/**
 * @title IERC3643
 * @dev Interface of ERC-3643.
 *
 * The T-REX token is an institutional grade security token standard that provides
 * a comprehensive framework for managing compliant transfer of security tokens using
 * an automated onchain validator system leveraging onchain identities for eligibility checks.
 *
 * This interface extends ERC-20 with additional functionality for:
 *
 * * Identity-based compliance checking
 * * Token and address freezing capabilities
 * * Batch operations for gas efficiency
 * * Recovery mechanisms for lost private keys
 * * Administrative controls for token management
 *
 * See https://eips.ethereum.org/EIPS/eip-3643
 */
interface IERC3643 is IERC20, IPausable {
    /**
     * @dev Emitted when token information is updated.
     *
     * @param _newName The new name of the token
     * @param _newSymbol The new symbol of the token
     * @param _newDecimals The new number of decimals for the token
     * @param _newVersion The new version string of the token
     * @param _newOnchainID The new address of the onchain identity contract
     */
    event UpdatedTokenInformation(
        string indexed _newName,
        string indexed _newSymbol,
        uint8 _newDecimals,
        string _newVersion,
        address indexed _newOnchainID
    );

    /**
     * @dev Emitted when a new identity registry is set for the token.
     *
     * @param _identityRegistry The address of the new identity registry contract
     */
    event IdentityRegistryAdded(IIdentityRegistry indexed _identityRegistry);

    /**
     * @dev Emitted when a new compliance contract is set for the token.
     *
     * @param _compliance The address of the new compliance contract
     */
    event ComplianceAdded(ICompliance indexed _compliance);

    /**
     * @dev Emitted when a successful wallet recovery is performed.
     *
     * @param _lostWallet The address of the wallet that was lost/compromised
     * @param _newWallet The address of the new wallet receiving the tokens
     * @param _investorOnchainID The address of the investor's onchain identity contract
     */
    event RecoverySuccess(address indexed _lostWallet, address indexed _newWallet, address indexed _investorOnchainID);

    /**
     * @dev Emitted when an address is frozen or unfrozen.
     *
     * @param _userAddress The address that was frozen/unfrozen
     * @param _isFrozen True if the address was frozen, false if unfrozen
     * @param _owner The address of the owner/agent who performed the action
     */
    event AddressFrozen(address indexed _userAddress, bool indexed _isFrozen, address indexed _owner);

    /**
     * @dev Emitted when a partial amount of tokens is frozen for a specific address.
     *
     * @param _userAddress The address whose tokens were frozen
     * @param _amount The amount of tokens that were frozen
     */
    event TokensFrozen(address indexed _userAddress, uint256 _amount);

    /**
     * @dev Emitted when a partial amount of tokens is unfrozen for a specific address.
     *
     * @param _userAddress The address whose tokens were unfrozen
     * @param _amount The amount of tokens that were unfrozen
     */
    event TokensUnfrozen(address indexed _userAddress, uint256 _amount);

    /**
     * @dev Returns the address of the onchain identity contract.
     *
     * @return The address of the onchain identity contract
     */
    function onchainID() external view returns (address);

    /**
     * @dev Returns the version string of the token implementation.
     *
     * @return The version string
     */
    function version() external view returns (string memory);

    /**
     * @dev Returns the identity registry contract associated with this token.
     *
     * @return The identity registry contract interface
     */
    function identityRegistry() external view returns (IIdentityRegistry);

    /**
     * @dev Returns the compliance contract associated with this token.
     *
     * @return The compliance contract interface
     */
    function compliance() external view returns (ICompliance);

    /**
     * @dev Returns whether a specific address is frozen.
     *
     * @param _userAddress The address to check
     * @return True if the address is frozen, false otherwise
     */
    function isFrozen(address _userAddress) external view returns (bool);

    /**
     * @dev Returns the amount of frozen tokens for a specific address.
     *
     * @param _userAddress The address to check
     * @return The amount of frozen tokens
     */
    function getFrozenTokens(address _userAddress) external view returns (uint256);

    /**
     * @dev Sets the name of the token.
     *
     * @param _name The new name to be set
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     */
    function setName(string calldata _name) external;

    /**
     * @dev Sets the symbol of the token.
     *
     * @param _symbol The new symbol to be set
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     */
    function setSymbol(string calldata _symbol) external;

    /**
     * @dev Sets the onchain identity contract address for the token.
     *
     * @param _onchainID The address of the new onchain identity contract
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * `_onchainID` must be a valid contract address
     */
    function setOnchainID(address _onchainID) external;

    /**
     * @dev Pauses all token transfers and operations.
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * The contract must not already be paused
     *
     * Emits a {Paused} event.
     */
    function pause() external;

    /**
     * @dev Unpauses all token transfers and operations.
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * The contract must be paused
     *
     * Emits an {Unpaused} event.
     */
    function unpause() external;

    /**
     * @dev Freezes or unfreezes a specific address, preventing or allowing all token operations.
     *
     * @param _userAddress The address to freeze or unfreeze
     * @param _freeze True to freeze the address, false to unfreeze
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     *
     * Emits an {AddressFrozen} event.
     */
    function setAddressFrozen(address _userAddress, bool _freeze) external;

    /**
     * @dev Freezes a partial amount of tokens for a specific address.
     *
     * @param _userAddress The address whose tokens will be frozen
     * @param _amount The amount of tokens to freeze
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * `_userAddress` must have sufficient unfrozen token balance
     *
     * Emits a {TokensFrozen} event.
     */
    function freezePartialTokens(address _userAddress, uint256 _amount) external;

    /**
     * @dev Unfreezes a partial amount of tokens for a specific address.
     *
     * @param _userAddress The address whose tokens will be unfrozen
     * @param _amount The amount of tokens to unfreeze
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * `_userAddress` must have sufficient frozen tokens to unfreeze
     *
     * Emits a {TokensUnfrozen} event.
     */
    function unfreezePartialTokens(address _userAddress, uint256 _amount) external;

    /**
     * @dev Sets the identity registry contract for the token.
     *
     * @param _identityRegistry The address of the new identity registry contract
     *
     * Requirements:
     *
     * * Only the owner can call this function
     *
     * Emits an {IdentityRegistryAdded} event.
     */
    function setIdentityRegistry(IIdentityRegistry _identityRegistry) external;

    /**
     * @dev Sets the compliance contract for the token.
     *
     * @param _compliance The address of the new compliance contract
     *
     * Requirements:
     *
     * * Only the owner can call this function
     *
     * Emits a {ComplianceAdded} event.
     */
    function setCompliance(ICompliance _compliance) external;

    /**
     * @dev Forces a transfer between two addresses, bypassing compliance checks.
     *
     * @param _from The address to transfer tokens from
     * @param _to The address to transfer tokens to
     * @param _amount The amount of tokens to transfer
     * @return success True if the transfer was successful
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * The contract must not be paused
     * * `_from` and `_to` addresses must not be frozen
     * * `_from` must have sufficient unfrozen balance
     * * `_to` must be verified in the identity registry
     *
     * NOTE: This function bypasses compliance rules but still requires identity verification.
     */
    function forcedTransfer(address _from, address _to, uint256 _amount) external returns (bool);

    /**
     * @dev Mints new tokens to a specified address.
     *
     * @param _to The address to mint tokens to
     * @param _amount The amount of tokens to mint
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * The contract must not be paused
     * * `_to` must be verified in the identity registry
     * * `_to` address must not be frozen
     */
    function mint(address _to, uint256 _amount) external;

    /**
     * @dev Burns tokens from a specified address.
     *
     * @param _userAddress The address to burn tokens from
     * @param _amount The amount of tokens to burn
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * `_userAddress` must have sufficient total balance (including frozen tokens)
     *
     * NOTE: This function can burn both frozen and unfrozen tokens.
     */
    function burn(address _userAddress, uint256 _amount) external;

    /**
     * @dev Recovers tokens from a lost wallet to a new wallet address.
     *
     * @param _lostWallet The address of the lost/compromised wallet
     * @param _newWallet The address of the new wallet to receive the tokens
     * @param _investorOnchainID The address of the investor's onchain identity contract
     * @return success True if the recovery was successful
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * `_lostWallet` must be registered in the identity registry
     * * `_newWallet` must be verified in the identity registry
     * * `_investorOnchainID` must match the identity associated with both wallets
     *
     * Emits a {RecoverySuccess} event.
     */
    function recoveryAddress(
        address _lostWallet,
        address _newWallet,
        address _investorOnchainID
    ) external returns (bool);

    /**
     * @dev Performs batch transfers to multiple addresses.
     *
     * @param _toList Array of recipient addresses
     * @param _amounts Array of amounts to transfer to each recipient
     *
     * Requirements:
     *
     * * Only verified addresses can call this function (standard transfer rules apply)
     * * Arrays must have the same length
     * * Each individual transfer must meet all compliance requirements
     * * Sender must have sufficient unfrozen balance for the total amount
     */
    function batchTransfer(address[] calldata _toList, uint256[] calldata _amounts) external;

    /**
     * @dev Performs batch forced transfers from multiple addresses to multiple addresses.
     *
     * @param _fromList Array of sender addresses
     * @param _toList Array of recipient addresses
     * @param _amounts Array of amounts to transfer
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * All arrays must have the same length
     * * Each recipient must be verified in the identity registry
     * * Each sender must have sufficient unfrozen balance
     */
    function batchForcedTransfer(
        address[] calldata _fromList,
        address[] calldata _toList,
        uint256[] calldata _amounts
    ) external;

    /**
     * @dev Mints tokens to multiple addresses in a single transaction.
     *
     * @param _toList Array of recipient addresses
     * @param _amounts Array of amounts to mint to each recipient
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * Arrays must have the same length
     * * Each recipient must be verified in the identity registry
     * * Each recipient address must not be frozen
     */
    function batchMint(address[] calldata _toList, uint256[] calldata _amounts) external;

    /**
     * @dev Burns tokens from multiple addresses in a single transaction.
     *
     * @param _userAddresses Array of addresses to burn tokens from
     * @param _amounts Array of amounts to burn from each address
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * Arrays must have the same length
     * * Each address must have sufficient total balance
     */
    function batchBurn(address[] calldata _userAddresses, uint256[] calldata _amounts) external;

    /**
     * @dev Freezes or unfreezes multiple addresses in a single transaction.
     *
     * @param _userAddresses Array of addresses to freeze or unfreeze
     * @param _freeze Array of boolean values indicating freeze (true) or unfreeze (false)
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * Arrays must have the same length
     */
    function batchSetAddressFrozen(address[] calldata _userAddresses, bool[] calldata _freeze) external;

    /**
     * @dev Freezes partial token amounts for multiple addresses in a single transaction.
     *
     * @param _userAddresses Array of addresses whose tokens will be frozen
     * @param _amounts Array of amounts to freeze for each address
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * Arrays must have the same length
     * * Each address must have sufficient unfrozen balance
     */
    function batchFreezePartialTokens(address[] calldata _userAddresses, uint256[] calldata _amounts) external;

    /**
     * @dev Unfreezes partial token amounts for multiple addresses in a single transaction.
     *
     * @param _userAddresses Array of addresses whose tokens will be unfrozen
     * @param _amounts Array of amounts to unfreeze for each address
     *
     * Requirements:
     *
     * * Only the owner or authorized agents can call this function
     * * Arrays must have the same length
     * * Each address must have sufficient frozen tokens
     */
    function batchUnfreezePartialTokens(address[] calldata _userAddresses, uint256[] calldata _amounts) external;
}

/**
 * @title IIdentityRegistry
 * @dev Interface for the Identity Registry contract in the ERC-3643 ecosystem.
 *
 * The Identity Registry is a crucial component that maintains a dynamic whitelist of verified
 * identities for security token holders. It establishes the link between wallet addresses,
 * Identity smart contracts, and country codes corresponding to investors' countries of residence.
 *
 * Key responsibilities:
 *
 * * Manage investor identity verification and registration
 * * Link wallet addresses to onchain Identity contracts
 * * Store investor country codes (ISO-3166 standard)
 * * Integrate with Trusted Issuers Registry and Claim Topics Registry
 * * Provide verification status for token transfer eligibility
 *
 * The registry works in conjunction with:
 *
 * * Identity Registry Storage: For storing identity data
 * * Trusted Issuers Registry: For managing authorized claim issuers
 * * Claim Topics Registry: For defining required claim topics
 * * Individual Identity contracts: For storing investor claims and credentials
 */
interface IIdentityRegistry {
    /**
     * @dev Emitted when the Claim Topics Registry is set for the Identity Registry.
     *
     * @param claimTopicsRegistry The address of the Claim Topics Registry contract
     */
    event ClaimTopicsRegistrySet(address indexed claimTopicsRegistry);

    /**
     * @dev Emitted when the Identity Registry Storage is set for the Identity Registry.
     *
     * @param identityStorage The address of the Identity Registry Storage contract
     */
    event IdentityStorageSet(address indexed identityStorage);

    /**
     * @dev Emitted when the Trusted Issuers Registry is set for the Identity Registry.
     *
     * @param trustedIssuersRegistry The address of the Trusted Issuers Registry contract
     */
    event TrustedIssuersRegistrySet(address indexed trustedIssuersRegistry);

    /**
     * @dev Emitted when a new investor identity is registered.
     *
     * @param investorAddress The wallet address of the investor
     * @param identity The address of the investor's Identity contract
     */
    event IdentityRegistered(address indexed investorAddress, IIdentity indexed identity);

    /**
     * @dev Emitted when an investor identity is removed from the registry.
     *
     * @param investorAddress The wallet address of the investor
     * @param identity The address of the investor's Identity contract that was removed
     */
    event IdentityRemoved(address indexed investorAddress, IIdentity indexed identity);

    /**
     * @dev Emitted when an investor's identity contract is updated.
     *
     * @param oldIdentity The address of the previous Identity contract
     * @param newIdentity The address of the new Identity contract
     */
    event IdentityUpdated(IIdentity indexed oldIdentity, IIdentity indexed newIdentity);

    /**
     * @dev Emitted when an investor's country code is updated.
     *
     * @param investorAddress The wallet address of the investor
     * @param country The new country code (ISO-3166 standard)
     */
    event CountryUpdated(address indexed investorAddress, uint16 indexed country);

    /**
     * @dev Returns the Identity Registry Storage contract.
     *
     * @return The Identity Registry Storage contract interface
     */
    function identityStorage() external view returns (IIdentityRegistryStorage);

    /**
     * @dev Returns the Trusted Issuers Registry contract.
     *
     * @return The Trusted Issuers Registry contract interface
     */
    function issuersRegistry() external view returns (ITrustedIssuersRegistry);

    /**
     * @dev Returns the Claim Topics Registry contract.
     *
     * @return The Claim Topics Registry contract interface
     */
    function topicsRegistry() external view returns (IClaimTopicsRegistry);

    /**
     * @dev Sets the Identity Registry Storage contract address.
     *
     * @param _identityRegistryStorage The address of the new Identity Registry Storage contract
     *
     * Requirements:
     *
     * * Only the owner can call this function
     * * `_identityRegistryStorage` must be a valid contract address
     *
     * Emits an {IdentityStorageSet} event.
     */
    function setIdentityRegistryStorage(address _identityRegistryStorage) external;

    /**
     * @dev Sets the Claim Topics Registry contract address.
     *
     * @param _claimTopicsRegistry The address of the new Claim Topics Registry contract
     *
     * Requirements:
     *
     * * Only the owner can call this function
     * * `_claimTopicsRegistry` must be a valid contract address
     *
     * Emits a {ClaimTopicsRegistrySet} event.
     */
    function setClaimTopicsRegistry(address _claimTopicsRegistry) external;

    /**
     * @dev Sets the Trusted Issuers Registry contract address.
     *
     * @param _trustedIssuersRegistry The address of the new Trusted Issuers Registry contract
     *
     * Requirements:
     *
     * * Only the owner can call this function
     * * `_trustedIssuersRegistry` must be a valid contract address
     *
     * Emits a {TrustedIssuersRegistrySet} event.
     */
    function setTrustedIssuersRegistry(address _trustedIssuersRegistry) external;

    /**
     * @dev Registers a new investor identity in the registry.
     *
     * @param _userAddress The wallet address of the investor
     * @param _identity The address of the investor's Identity contract
     * @param _country The country code of the investor (ISO-3166 standard)
     *
     * Requirements:
     *
     * * Only authorized agents can call this function
     * * `_userAddress` must not already be registered
     * * `_identity` must be a valid Identity contract
     * * `_country` must be a valid ISO-3166 country code
     *
     * Emits an {IdentityRegistered} event.
     */
    function registerIdentity(address _userAddress, IIdentity _identity, uint16 _country) external;

    /**
     * @dev Removes an investor identity from the registry.
     *
     * @param _userAddress The wallet address of the investor to remove
     *
     * Requirements:
     *
     * * Only authorized agents can call this function
     * * `_userAddress` must be currently registered
     *
     * Emits an {IdentityRemoved} event.
     */
    function deleteIdentity(address _userAddress) external;

    /**
     * @dev Updates the country code for a registered investor.
     *
     * @param _userAddress The wallet address of the investor
     * @param _country The new country code (ISO-3166 standard)
     *
     * Requirements:
     *
     * * Only authorized agents can call this function
     * * `_userAddress` must be currently registered
     * * `_country` must be a valid ISO-3166 country code
     *
     * Emits a {CountryUpdated} event.
     */
    function updateCountry(address _userAddress, uint16 _country) external;

    /**
     * @dev Updates the Identity contract for a registered investor.
     *
     * @param _userAddress The wallet address of the investor
     * @param _identity The address of the new Identity contract
     *
     * Requirements:
     *
     * * Only authorized agents can call this function
     * * `_userAddress` must be currently registered
     * * `_identity` must be a valid Identity contract
     *
     * Emits an {IdentityUpdated} event.
     */
    function updateIdentity(address _userAddress, IIdentity _identity) external;

    /**
     * @dev Registers multiple investor identities in a single transaction.
     *
     * @param _userAddresses Array of wallet addresses of the investors
     * @param _identities Array of Identity contract addresses
     * @param _countries Array of country codes (ISO-3166 standard)
     *
     * Requirements:
     *
     * * Only authorized agents can call this function
     * * All arrays must have the same length
     * * No `_userAddresses` should already be registered
     * * All `_identities` must be valid Identity contracts
     * * All `_countries` must be valid ISO-3166 country codes
     *
     * Emits multiple {IdentityRegistered} events.
     */
    function batchRegisterIdentity(
        address[] calldata _userAddresses,
        IIdentity[] calldata _identities,
        uint16[] calldata _countries
    ) external;

    /**
     * @dev Checks if a wallet address is registered in the identity registry.
     *
     * @param _userAddress The wallet address to check
     * @return True if the address is registered, false otherwise
     */
    function contains(address _userAddress) external view returns (bool);

    /**
     * @dev Checks if a wallet address is verified and eligible for token operations.
     *
     * This function performs comprehensive verification including:
     *
     * * Address is registered in the identity registry
     * * Associated Identity contract contains required claims
     * * Claims are signed by trusted issuers
     * * All claim topics required by the registry are present
     *
     * @param _userAddress The wallet address to verify
     * @return True if the address is fully verified and eligible, false otherwise
     */
    function isVerified(address _userAddress) external view returns (bool);

    /**
     * @dev Returns the Identity contract associated with a wallet address.
     *
     * @param _userAddress The wallet address to query
     * @return The Identity contract interface, or zero address if not registered
     */
    function identity(address _userAddress) external view returns (IIdentity);

    /**
     * @dev Returns the country code for a registered investor.
     *
     * @param _userAddress The wallet address to query
     * @return The country code (ISO-3166 standard), or 0 if not registered
     */
    function investorCountry(address _userAddress) external view returns (uint16);
}

/**
 * @title IIdentityRegistryStorage
 * @dev Interface for the Identity Registry Storage contract in the ERC-3643 ecosystem.
 *
 * The Identity Registry Storage is a specialized storage contract that maintains the identity
 * addresses of all authorized investors for security tokens linked to the storage contract.
 * It serves as a shared storage layer that can be bound to one or several Identity Registry
 * contracts, enabling efficient data sharing and separation of concerns.
 *
 * Key responsibilities:
 *
 * * Store identity addresses for authorized investors
 * * Maintain investor country codes (ISO-3166 standard)
 * * Manage binding relationships with Identity Registry contracts
 * * Provide shared storage for multiple token ecosystems
 * * Enable separation of registry logic from storage implementation
 *
 * Architecture benefits:
 *
 * * Shared Whitelist: Multiple tokens can use the same investor whitelist
 * * Modular Design: Registry logic separated from storage implementation
 * * Scalability: One storage contract can serve multiple registries
 * * Upgradability: Registry contracts can be updated while preserving data
 * * Access Control: Only bound registries can modify stored data
 */
interface IIdentityRegistryStorage {
    /**
     * @dev Emitted when an investor identity is stored in the storage contract.
     *
     * @param investorAddress The wallet address of the investor
     * @param identity The address of the investor's Identity contract
     */
    event IdentityStored(address indexed investorAddress, IIdentity indexed identity);

    /**
     * @dev Emitted when an investor identity is removed from the storage contract.
     *
     * @param investorAddress The wallet address of the investor
     * @param identity The address of the investor's Identity contract that was removed
     */
    event IdentityUnstored(address indexed investorAddress, IIdentity indexed identity);

    /**
     * @dev Emitted when an investor's identity contract is modified in storage.
     *
     * @param oldIdentity The address of the previous Identity contract
     * @param newIdentity The address of the new Identity contract
     */
    event IdentityModified(IIdentity indexed oldIdentity, IIdentity indexed newIdentity);

    /**
     * @dev Emitted when an investor's country code is modified in storage.
     *
     * @param investorAddress The wallet address of the investor
     * @param country The new country code (ISO-3166 standard)
     */
    event CountryModified(address indexed investorAddress, uint16 indexed country);

    /**
     * @dev Emitted when an Identity Registry contract is bound to this storage.
     *
     * @param identityRegistry The address of the Identity Registry contract that was bound
     */
    event IdentityRegistryBound(address indexed identityRegistry);

    /**
     * @dev Emitted when an Identity Registry contract is unbound from this storage.
     *
     * @param identityRegistry The address of the Identity Registry contract that was unbound
     */
    event IdentityRegistryUnbound(address indexed identityRegistry);

    /**
     * @dev Returns the Identity contract stored for a given wallet address.
     *
     * @param _userAddress The wallet address to query
     * @return The Identity contract interface, or zero address if not stored
     */
    function storedIdentity(address _userAddress) external view returns (IIdentity);

    /**
     * @dev Returns the country code stored for a given investor.
     *
     * @param _userAddress The wallet address to query
     * @return The country code (ISO-3166 standard), or 0 if not stored
     */
    function storedInvestorCountry(address _userAddress) external view returns (uint16);

    /**
     * @dev Adds an investor identity to storage.
     *
     * @param _userAddress The wallet address of the investor
     * @param _identity The address of the investor's Identity contract
     * @param _country The country code of the investor (ISO-3166 standard)
     *
     * Requirements:
     *
     * * Only bound Identity Registry contracts can call this function
     * * `_userAddress` must not already be stored
     * * `_identity` must be a valid Identity contract address
     * * `_country` must be a valid ISO-3166 country code
     *
     * Emits an {IdentityStored} event.
     */
    function addIdentityToStorage(address _userAddress, IIdentity _identity, uint16 _country) external;

    /**
     * @dev Removes an investor identity from storage.
     *
     * @param _userAddress The wallet address of the investor to remove
     *
     * Requirements:
     *
     * * Only bound Identity Registry contracts can call this function
     * * `_userAddress` must be currently stored
     *
     * Emits an {IdentityUnstored} event.
     */
    function removeIdentityFromStorage(address _userAddress) external;

    /**
     * @dev Modifies the country code for a stored investor.
     *
     * @param _userAddress The wallet address of the investor
     * @param _country The new country code (ISO-3166 standard)
     *
     * Requirements:
     *
     * * Only bound Identity Registry contracts can call this function
     * * `_userAddress` must be currently stored
     * * `_country` must be a valid ISO-3166 country code
     *
     * Emits a {CountryModified} event.
     */
    function modifyStoredInvestorCountry(address _userAddress, uint16 _country) external;

    /**
     * @dev Modifies the Identity contract for a stored investor.
     *
     * @param _userAddress The wallet address of the investor
     * @param _identity The address of the new Identity contract
     *
     * Requirements:
     *
     * * Only bound Identity Registry contracts can call this function
     * * `_userAddress` must be currently stored
     * * `_identity` must be a valid Identity contract address
     *
     * Emits an {IdentityModified} event.
     */
    function modifyStoredIdentity(address _userAddress, IIdentity _identity) external;

    /**
     * @dev Binds an Identity Registry contract to this storage, granting it write access.
     *
     * @param _identityRegistry The address of the Identity Registry contract to bind
     *
     * Requirements:
     *
     * * Only the owner can call this function
     * * `_identityRegistry` must be a valid contract address
     * * `_identityRegistry` must not already be bound
     *
     * Emits an {IdentityRegistryBound} event.
     */
    function bindIdentityRegistry(address _identityRegistry) external;

    /**
     * @dev Unbinds an Identity Registry contract from this storage, revoking its write access.
     *
     * @param _identityRegistry The address of the Identity Registry contract to unbind
     *
     * Requirements:
     *
     * * Only the owner can call this function
     * * `_identityRegistry` must be currently bound
     *
     * Emits an {IdentityRegistryUnbound} event.
     */
    function unbindIdentityRegistry(address _identityRegistry) external;

    /**
     * @dev Returns an array of all Identity Registry contracts bound to this storage.
     *
     * @return Array of addresses of bound Identity Registry contracts
     */
    function linkedIdentityRegistries() external view returns (address[] memory);
}

/**
 * @title ICompliance
 * @dev Interface for the Compliance contract in the ERC-3643 ecosystem.
 *
 * The Compliance contract is responsible for enforcing the rules and regulations
 * of the security token offering. It ensures that all token transfers and operations
 * comply with the legal requirements set by the token issuer and regulatory authorities.
 *
 * Key responsibilities:
 *
 * * Define and enforce compliance rules for token transfers
 * * Validate transfer eligibility based on offering regulations
 * * Maintain state for compliance-related data (e.g., investor limits, country restrictions)
 * * Provide hooks for compliance state updates during token operations
 * * Enable modular compliance through rule composition
 *
 * Compliance types typically enforced:
 *
 * * Maximum number of token holders (globally or per country)
 * * Maximum token amount per investor
 * * Minimum holding periods and lock-up rules
 * * Geographic restrictions and country-based limits
 * * Investor accreditation requirements
 * * Transfer timing restrictions
 *
 * The compliance contract works in conjunction with:
 *
 * * Token contracts: For transfer validation and state updates
 * * Identity Registry: For investor verification and country data
 * * Trusted Issuers Registry: For claim validation
 * * Compliance modules: For modular rule composition (when using modular design)
 */
interface ICompliance {
    /**
     * @dev Emitted when a token contract is bound to this compliance contract.
     *
     * @param _token The address of the token contract that was bound
     */
    event TokenBound(address _token);

    /**
     * @dev Emitted when a token contract is unbound from this compliance contract.
     *
     * @param _token The address of the token contract that was unbound
     */
    event TokenUnbound(address _token);

    /**
     * @dev Binds a token contract to this compliance contract, enabling compliance enforcement.
     *
     * @param _token The address of the token contract to bind
     *
     * Requirements:
     *
     * * Only the owner can call this function
     * * `_token` must be a valid ERC-3643 token contract
     * * `_token` must not already be bound to another compliance contract
     *
     * Emits a {TokenBound} event.
     */
    function bindToken(address _token) external;

    /**
     * @dev Unbinds a token contract from this compliance contract, disabling compliance enforcement.
     *
     * @param _token The address of the token contract to unbind
     *
     * Requirements:
     *
     * * Only the owner can call this function
     * * `_token` must be currently bound to this compliance contract
     *
     * Emits a {TokenUnbound} event.
     */
    function unbindToken(address _token) external;

    /**
     * @dev Checks if a specific token contract is bound to this compliance contract.
     *
     * @param _token The address of the token contract to check
     * @return True if the token is bound to this compliance contract, false otherwise
     */
    function isTokenBound(address _token) external view returns (bool);

    /**
     * @dev Returns the address of the token contract bound to this compliance contract.
     *
     * @return The address of the bound token contract, or zero address if none is bound
     *
     * NOTE: This function assumes a single token binding. For multi-token compliance contracts,
     * use {isTokenBound} instead.
     */
    function getTokenBound() external view returns (address);

    /**
     * @dev Checks if a transfer is compliant with the rules defined in this compliance contract.
     *
     * This function performs comprehensive compliance validation including:
     * * Investor limits (maximum number of token holders)
     * * Amount restrictions (maximum tokens per investor)
     * * Country-based restrictions and limits
     * * Lock-up periods and transfer timing rules
     * * Any other custom compliance rules implemented
     *
     * @param _from The address sending the tokens (use zero address for minting)
     * @param _to The address receiving the tokens (use zero address for burning)
     * @param _amount The amount of tokens being transferred
     * @return True if the transfer is compliant and allowed, false otherwise
     *
     * NOTE: This function should be called before executing any transfer to ensure compliance.
     * It does not modify state and can be used for pre-validation.
     */
    function canTransfer(address _from, address _to, uint256 _amount) external view returns (bool);

    /**
     * @dev Updates compliance state after a successful transfer.
     *
     * This function is called by the token contract after a transfer has been executed
     * to update any compliance-related state that depends on transfer activity.
     *
     * @param _from The address that sent the tokens (zero address for minting)
     * @param _to The address that received the tokens (zero address for burning)
     * @param _amount The amount of tokens that were transferred
     *
     * Requirements:
     *
     * * Only bound token contracts can call this function
     * * Should only be called after a successful transfer
     *
     * NOTE: This function is for state updates only and should not perform validation.
     */
    function transferred(address _from, address _to, uint256 _amount) external;

    /**
     * @dev Updates compliance state after tokens are created (minted).
     *
     * This function is called by the token contract after tokens have been minted
     * to update compliance state related to token creation.
     *
     * @param _to The address that received the newly created tokens
     * @param _amount The amount of tokens that were created
     *
     * Requirements:
     *
     * * Only bound token contracts can call this function
     * * Should only be called after successful token creation
     */
    function created(address _to, uint256 _amount) external;

    /**
     * @dev Updates compliance state after tokens are destroyed (burned).
     *
     * This function is called by the token contract after tokens have been burned
     * to update compliance state related to token destruction.
     *
     * @param _from The address from which tokens were destroyed
     * @param _amount The amount of tokens that were destroyed
     *
     * Requirements:
     *
     * * Only bound token contracts can call this function
     * * Should only be called after successful token destruction
     */
    function destroyed(address _from, uint256 _amount) external;
}

/**
 * @title ITrustedIssuersRegistry
 * @dev Interface for the Trusted Issuers Registry contract in the ERC-3643 ecosystem.
 *
 * The Trusted Issuers Registry manages a whitelist of authorized claim issuers that are
 * trusted to provide valid claims for identity verification. It defines which claim issuers
 * are authorized and what types of claims (topics) each issuer is allowed to emit.
 *
 * Key responsibilities:
 *
 * * Maintain a registry of trusted claim issuer contracts
 * * Define claim topics that each issuer is authorized to emit
 * * Provide validation for claim issuer authorization
 * * Enable efficient lookup of issuers by claim topic
 *
 * Claim topics are numeric identifiers representing different types of claims:
 *
 * * Example: KYC = 1, AML = 2, Accreditation = 3, etc.
 *
 * The registry works in conjunction with:
 *
 * * Identity Registry: For identity verification processes
 * * Identity contracts: For claim validation
 * * Compliance contracts: For regulatory requirement enforcement
 * * Claim Topics Registry: For defining required claim types
 */
interface ITrustedIssuersRegistry {
    /**
     * @dev Emitted when a trusted issuer is added to the registry.
     *
     * @param trustedIssuer The address of the claim issuer contract that was added
     * @param claimTopics Array of claim topic IDs that the issuer is authorized to emit
     */
    event TrustedIssuerAdded(IClaimIssuer indexed trustedIssuer, uint256[] claimTopics);

    /**
     * @dev Emitted when a trusted issuer is removed from the registry.
     *
     * @param trustedIssuer The address of the claim issuer contract that was removed
     */
    event TrustedIssuerRemoved(IClaimIssuer indexed trustedIssuer);

    /**
     * @dev Emitted when the authorized claim topics for a trusted issuer are updated.
     *
     * @param trustedIssuer The address of the claim issuer contract that was updated
     * @param claimTopics Array of new claim topic IDs that the issuer is authorized to emit
     */
    event ClaimTopicsUpdated(IClaimIssuer indexed trustedIssuer, uint256[] claimTopics);

    /**
     * @dev Adds a claim issuer to the trusted registry with authorized claim topics.
     *
     * @param _trustedIssuer The address of the claim issuer contract to add
     * @param _claimTopics Array of claim topic IDs that the issuer is authorized to emit
     *
     * Requirements:
     *
     * * Only the owner can call this function
     * * `_trustedIssuer` must be a valid claim issuer contract
     * * `_trustedIssuer` must not already be registered
     * * `_claimTopics` array must not be empty
     * * `_claimTopics` array must not exceed 15 topics (gas optimization)
     * * Registry must not exceed 50 trusted issuers (gas optimization)
     *
     * Emits a {TrustedIssuerAdded} event.
     */
    function addTrustedIssuer(IClaimIssuer _trustedIssuer, uint256[] calldata _claimTopics) external;

    /**
     * @dev Removes a claim issuer from the trusted registry.
     *
     * @param _trustedIssuer The address of the claim issuer contract to remove
     *
     * Requirements:
     *
     * * Only the owner can call this function
     * * `_trustedIssuer` must be currently registered as a trusted issuer
     *
     * Emits a {TrustedIssuerRemoved} event.
     */
    function removeTrustedIssuer(IClaimIssuer _trustedIssuer) external;

    /**
     * @dev Updates the authorized claim topics for an existing trusted issuer.
     *
     * @param _trustedIssuer The address of the claim issuer contract to update
     * @param _claimTopics Array of new claim topic IDs that the issuer is authorized to emit
     *
     * Requirements:
     *
     * * Only the owner can call this function
     * * `_trustedIssuer` must be currently registered as a trusted issuer
     * * `_claimTopics` array must not be empty
     * * `_claimTopics` array must not exceed 15 topics (gas optimization)
     *
     * Emits a {ClaimTopicsUpdated} event.
     */
    function updateIssuerClaimTopics(IClaimIssuer _trustedIssuer, uint256[] calldata _claimTopics) external;

    /**
     * @dev Returns an array of all registered trusted claim issuers.
     *
     * @return Array of trusted claim issuer contract addresses
     */
    function getTrustedIssuers() external view returns (IClaimIssuer[] memory);

    /**
     * @dev Checks if a given address is registered as a trusted claim issuer.
     *
     * @param _issuer The address to check
     * @return True if the address is a registered trusted issuer, false otherwise
     */
    function isTrustedIssuer(address _issuer) external view returns (bool);

    /**
     * @dev Returns the claim topics that a trusted issuer is authorized to emit.
     *
     * @param _trustedIssuer The address of the trusted claim issuer
     * @return Array of claim topic IDs that the issuer is authorized to emit
     *
     * Requirements:
     *
     * * `_trustedIssuer` must be registered as a trusted issuer
     */
    function getTrustedIssuerClaimTopics(IClaimIssuer _trustedIssuer) external view returns (uint256[] memory);

    /**
     * @dev Returns all trusted issuers that are authorized to emit a specific claim topic.
     * @param claimTopic The claim topic ID to query
     * @return Array of trusted claim issuer addresses authorized for the given topic
     */
    function getTrustedIssuersForClaimTopic(uint256 claimTopic) external view returns (IClaimIssuer[] memory);

    /**
     * @dev Checks if a trusted issuer is authorized to emit a specific claim topic.
     *
     * @param _issuer The address of the claim issuer to check
     * @param _claimTopic The claim topic ID to check authorization for
     * @return True if the issuer is authorized for the claim topic, false otherwise
     */
    function hasClaimTopic(address _issuer, uint256 _claimTopic) external view returns (bool);
}

/**
 * @title IClaimTopicsRegistry
 * @dev Interface for the Claim Topics Registry contract in the ERC-3643 ecosystem.
 *
 * The Claim Topics Registry defines the types of claims that are required for identity
 * verification in the security token ecosystem. It maintains a registry of trusted claim
 * topics that investors must possess to be eligible for token operations.
 *
 * Key responsibilities:
 *
 * * Define required claim topic IDs for token eligibility
 * * Manage the list of accepted claim types
 * * Provide claim topic validation for identity verification
 * * Enable flexible claim requirement configuration
 *
 * Claim topics are numeric identifiers representing different verification requirements:
 *
 * * Example: KYC = 1, AML = 2, Accreditation = 3, Residency = 4, etc.
 *
 * Architecture considerations:
 *
 * * Maximum 15 topics per token (gas optimization)
 * * Topics are defined at the token ecosystem level
 * * Claims must be issued by trusted issuers for these topics
 * * Claims are validated during identity verification processes
 *
 * The registry works in conjunction with:
 *
 * * Identity Registry: For comprehensive identity verification
 * * Trusted Issuers Registry: For validating claim issuers
 * * Identity contracts: For storing and retrieving claims
 * * Compliance contracts: For enforcing claim requirements
 */
interface IClaimTopicsRegistry {
    /**
     * @dev Emitted when a claim topic is added to the registry.
     *
     * @param claimTopic The numeric ID of the claim topic that was added
     */
    event ClaimTopicAdded(uint256 indexed claimTopic);

    /**
     * @dev Emitted when a claim topic is removed from the registry.
     *
     * @param claimTopic The numeric ID of the claim topic that was removed
     */
    event ClaimTopicRemoved(uint256 indexed claimTopic);

    /**
     * @dev Adds a new claim topic to the registry.
     *
     * Claim topics represent different types of verification requirements
     * that investors must meet. Each topic corresponds to a specific type
     * of claim that must be present in an investor's identity contract.
     *
     * @param _claimTopic The numeric identifier for the claim topic
     *
     * Requirements:
     *
     * * Only the owner can call this function
     * * `_claimTopic` must not already be registered
     * * Registry must not exceed 15 topics (gas optimization)
     * * `_claimTopic` must not be zero
     *
     * Emits a {ClaimTopicAdded} event.
     */
    function addClaimTopic(uint256 _claimTopic) external;

    /**
     * @dev Removes a claim topic from the registry.
     *
     * After removal, claims of this topic will no longer be required
     * for identity verification in this token ecosystem.
     *
     * @param _claimTopic The numeric identifier for the claim topic to remove
     *
     * Requirements:
     *
     * * Only the owner can call this function
     * * `_claimTopic` must be currently registered
     *
     * Emits a {ClaimTopicRemoved} event.
     */
    function removeClaimTopic(uint256 _claimTopic) external;

    /**
     * @dev Returns all registered claim topics for this token ecosystem.
     *
     * This function provides the complete list of claim types that investors
     * must possess to be eligible for token operations.
     *
     * @return Array of claim topic IDs currently registered
     */
    function getClaimTopics() external view returns (uint256[] memory);
}

/**
 * @title IIdentity
 * @dev Minimal interface representing an identity contract address.
 *
 * This interface serves as a type-safe wrapper for identity contract addresses
 * in the ERC-3643 ecosystem. The actual identity functionality is implementation-
 * specific and not defined by ERC-3643.
 *
 * Implementers are free to use any identity system that provides:
 *
 * * Onchain identity verification
 * * Claim management capabilities
 * * Integration with trusted claim issuers
 *
 * NOTE: Not formally defined in ERC-3643. Provided for convenience.
 */
interface IIdentity {
    enum KeyPurpose {
        Management,
        Execution
    }

    /**
     * @dev Checks if a key has a specific purpose.
     */
    function keyHasPurpose(bytes32 key, KeyPurpose purpose) external view returns (bool);
}

/**
 * @title IClaimIssuer
 * @dev Minimal interface representing a claim issuer contract address.
 *
 * This interface serves as a type-safe wrapper for claim issuer contract addresses.
 * Claim issuers are trusted entities that can issue verifiable claims about identities.
 */
// Empty interface serves as a type marker for claim issuer contracts since it's not defined by ERC-3643
interface IClaimIssuer {}
