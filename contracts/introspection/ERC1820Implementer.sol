pragma solidity ^0.5.0;

import "./IERC1820Implementer.sol";

/**
 * @dev ERC1820Implementer allows your contract to implement an interface for another account in the sense of ERC1820.
 * That account or one of its ERC1820 managers can register the implementer in the ERC1820 registry, but the registry
 * will first check with the implementer if it agrees to it, and only allow it if it does. Using the internal
 * function _registerInterfaceForAddress provided by this contract, you are expressing this agreement,
 * and you will be able to register the contract as an implementer in the registry for that account.
 */
contract ERC1820Implementer is IERC1820Implementer {
    bytes32 constant private ERC1820_ACCEPT_MAGIC = keccak256(abi.encodePacked("ERC1820_ACCEPT_MAGIC"));

    mapping(bytes32 => mapping(address => bool)) private _supportedInterfaces;

    function canImplementInterfaceForAddress(bytes32 interfaceHash, address account) external view returns (bytes32) {
        return _supportedInterfaces[interfaceHash][account] ? ERC1820_ACCEPT_MAGIC : bytes32(0x00);
    }

    function _registerInterfaceForAddress(bytes32 interfaceHash, address account) internal {
        _supportedInterfaces[interfaceHash][account] = true;
    }
}
