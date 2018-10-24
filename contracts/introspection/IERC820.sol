pragma solidity ^0.4.24;

/**
 * @title IERC820
 * @dev https://eips.ethereum.org/EIPS/eip-820
 */
interface IERC820 {
    function setInterfaceImplementer(address _addr, bytes32 _interfaceHash, address _implementer) external;
    function getInterfaceImplementer(address _addr, bytes32 _interfaceHash) external view returns (address);
    function setManager(address _addr, address _newManager) external;
    function getManager(address _addr) external view returns(address);
}
