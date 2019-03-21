pragma solidity ^0.5.2;

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

    function setManager(
        address _addr,
        address _newManager
    ) external;

    function updateERC165Cache(
        address _contract,
        bytes4 _interfaceId
    ) external;

    function getInterfaceImplementer(
        address _addr,
        bytes32 _interfaceHash
    ) external view returns (address);

    function implementsERC165Interface(
        address _contract,
        bytes4 _interfaceId
    ) external view returns (bool);

    function getManager(address _addr) external view returns(address);

    function interfaceHash(
        string calldata _interfaceName
    ) external pure returns(bytes32);

}
