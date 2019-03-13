pragma solidity ^0.5.2;

import "./IERC1820Implementer.sol";

/**
 * Inherit from this contract and call _registerInterfaceForAddress to allow for contracts to be registered in the
 * ERC1820 registry.
 */
contract ERC1820Implementer is IERC1820Implementer {
    bytes32 constant private ERC1820_ACCEPT_MAGIC = keccak256(abi.encodePacked("ERC1820_ACCEPT_MAGIC"));

    mapping(bytes32 => mapping(address => bool)) private _supportedInterfaces;

    function canImplementInterfaceForAddress(bytes32 interfaceHash, address account) external view returns (bytes32) {
        return _implementsInterfaceForAddress(interfaceHash, account) ? ERC1820_ACCEPT_MAGIC : bytes32(0x00);
    }

    function _implementsInterfaceForAddress(bytes32 interfaceHash, address account) internal view returns (bool) {
        return _supportedInterfaces[interfaceHash][account];
    }

    function _registerInterfaceForAddress(bytes32 interfaceHash, address account) internal {
        _supportedInterfaces[interfaceHash][account] = true;
    }
}
