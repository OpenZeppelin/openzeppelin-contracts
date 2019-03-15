pragma solidity ^0.4.24;

/**
 * @title IERC1820
 * @dev https://eips.ethereum.org/EIPS/eip-1820
 */
interface IERC1820 {
    function setInterfaceImplementer(
        address _addr,
        bytes32 _interfaceHash,
        address _implementer
    ) external;

    function getInterfaceImplementer(
        address _addr,
        bytes32 _interfaceHash
    ) external view returns (address);

    function setManager(
        address _addr,
        address _newManager
    ) external;

    function getManager(address _addr) external view returns(address);

    function interfaceHash(
        string _interfaceName
    ) external pure returns(bytes32);

    function updateERC165Cache(
        address _contract,
        bytes4 _interfaceId
    ) external;

    function implementsERC165Interface(
        address _contract,
        bytes4 _interfaceId
    ) public view returns (bool);
}
