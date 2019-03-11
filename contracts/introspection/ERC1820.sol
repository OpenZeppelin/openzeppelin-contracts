pragma solidity ^0.5.2;

import "./IERC1820.sol";

contract ERC1820 is IERC1820 {
    bytes32 constant private ERC1820_ACCEPT_MAGIC = keccak256(abi.encodePacked("ERC1820_ACCEPT_MAGIC"));

    mapping(bytes32 => mapping(address => bool)) private _supportedInterfaces;

    function canImplementInterfaceForAddress(bytes32 interfaceHash, address account) external view returns (bytes32) {
        _implementsInterfaceForAddress(interfaceHash, account) ? ERC1820_ACCEPT_MAGIC : bytes32(0x00);
    }

    function _implementsInterfaceForAddress(bytes32 interfaceHash, address account) internal view returns (bool) {
        return _supportedInterfaces[interfaceHash][account];
    }

    function _registerInterfaceForAddress(bytes32 interfaceHash, address account) internal {
        _supportedInterfaces[interfaceHash][account] = true;
    }
}
