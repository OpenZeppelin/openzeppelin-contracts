pragma solidity ^0.5.0;

/**
 * @title ERC1820 Pseudo-introspection Registry Contract
 * @author Jordi Baylina and Jacques Dafflon
 * @notice For more details, see https://eips.ethereum.org/EIPS/eip-1820
 */
interface IERC1820Registry {
    /**
     * @notice Sets the contract which implements a specific interface for an address.
     * Only the manager defined for that address can set it.
     * (Each address is the manager for itself until it sets a new manager.)
     * @param account Address for which to set the interface.
     * (If 'account' is the zero address then 'msg.sender' is assumed.)
     * @param interfaceHash Keccak256 hash of the name of the interface as a string.
     * E.g., 'web3.utils.keccak256("ERC777TokensRecipient")' for the 'ERC777TokensRecipient' interface.
     * @param implementer Contract address implementing `interfaceHash` for `account.address()`.
     */
    function setInterfaceImplementer(address account, bytes32 interfaceHash, address implementer) external;

    /**
     * @notice Sets `newManager.address()` as manager for `account.address()`.
     * The new manager will be able to call 'setInterfaceImplementer' for `account.address()`.
     * @param account Address for which to set the new manager.
     * @param newManager Address of the new manager for `addr.address()`.
     * (Pass '0x0' to reset the manager to `account.address()`.)
     */
    function setManager(address account, address newManager) external;

    /**
     *  @notice Updates the cache with whether the contract implements an ERC165 interface or not.
     *  @param account Address of the contract for which to update the cache.
     *  @param interfaceId ERC165 interface for which to update the cache.
     */
    function updateERC165Cache(address account, bytes4 interfaceId) external;

    /**
     *  @notice Get the manager of an address.
     *  @param account Address for which to return the manager.
     *  @return Address of the manager for a given address.
     */
    function getManager(address account) external view returns (address);

    /**
     *  @notice Query if an address implements an interface and through which contract.
     *  @param account Address being queried for the implementer of an interface.
     *  (If 'account' is the zero address then 'msg.sender' is assumed.)
     *  @param interfaceHash Keccak256 hash of the name of the interface as a string.
     *  E.g., 'web3.utils.keccak256("ERC777TokensRecipient")' for the 'ERC777TokensRecipient' interface.
     *  @return The address of the contract which implements the interface `interfaceHash` for `account.address()`
     *  or '0' if `account.address()` did not register an implementer for this interface.
     */
    function getInterfaceImplementer(address account, bytes32 interfaceHash) external view returns (address);

    /**
     *  @notice Checks whether a contract implements an ERC165 interface or not.
     *  If the result is not cached a direct lookup on the contract address is performed.
     *  If the result is not cached or the cached value is out-of-date, the cache MUST be updated manually by calling
     *  'updateERC165Cache' with the contract address.
     *  @param account Address of the contract to check.
     *  @param interfaceId ERC165 interface to check.
     *  @return True if `account.address()` implements `interfaceId`, false otherwise.
     */
    function implementsERC165Interface(address account, bytes4 interfaceId) external view returns (bool);

    /**
     *  @notice Checks whether a contract implements an ERC165 interface or not without using nor updating the cache.
     *  @param account Address of the contract to check.
     *  @param interfaceId ERC165 interface to check.
     *  @return True if `account.address()` implements `interfaceId`, false otherwise.
     */
    function implementsERC165InterfaceNoCache(address account, bytes4 interfaceId) external view returns (bool);

    /**
     *  @notice Compute the keccak256 hash of an interface given its name.
     *  @param interfaceName Name of the interface.
     *  @return The keccak256 hash of an interface name.
     */
    function interfaceHash(string calldata interfaceName) external pure returns (bytes32);

    /**
     *  @notice Indicates a contract is the `implementer` of `interfaceHash` for `account`.
     */
    event InterfaceImplementerSet(address indexed account, bytes32 indexed interfaceHash, address indexed implementer);

    /**
     *  @notice Indicates `newManager` is the address of the new manager for `account`.
     */
    event ManagerChanged(address indexed account, address indexed newManager);
}
