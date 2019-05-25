pragma solidity ^0.5.0;

import "./IERC1820Implementer.sol";

/**
 * @dev Implementation of the `IERC1820Implementer` interface.
 *
 * Contracts may inherit from this and call `_registerInterfaceForAddress` to
 * declare their willingness to be implementers.
 * `IERC1820Registry.setInterfaceImplementer` should then be called for the
 * registration to be complete.
 */
contract ERC1820Implementer is IERC1820Implementer {
    bytes32 constant private ERC1820_ACCEPT_MAGIC = keccak256(abi.encodePacked("ERC1820_ACCEPT_MAGIC"));

    mapping(bytes32 => mapping(address => bool)) private _supportedInterfaces;

    /**
     * See `IERC1820Implementer.canImplementInterfaceForAddress`.
     */
    function canImplementInterfaceForAddress(bytes32 interfaceHash, address account) external view returns (bytes32) {
        return _supportedInterfaces[interfaceHash][account] ? ERC1820_ACCEPT_MAGIC : bytes32(0x00);
    }

    /**
     * @dev Declares the contract as willing to be an implementer of
     * `interfaceHash` for `account`.
     *
     * See `IERC1820Registry.setInterfaceImplementer` and
     * `IERC1820Registry.interfaceHash`.
     */
    function _registerInterfaceForAddress(bytes32 interfaceHash, address account) internal {
        _supportedInterfaces[interfaceHash][account] = true;
    }
}
