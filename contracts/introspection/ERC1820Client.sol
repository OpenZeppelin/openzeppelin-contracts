pragma solidity ^0.5.2;

import "./IERC1820.sol";

/**
 * @title ERC1820 client implementation
 * @dev https://eips.ethereum.org/EIPS/eip-1820
 * @author Bertrand Masius <github@catageeks.tk>
 */
contract ERC1820Client {

    IERC1820 private _erc1820 = IERC1820(
        0x1820b744B33945482C17Dc37218C01D858EBc714
    );

    function getERC1820Registry() external view returns(address) {
        return address(_erc1820);
    }

    function getInterfaceImplementer(
        address addr,
        bytes32 hash
    ) internal view returns(address) {
        return _erc1820.getInterfaceImplementer(addr, hash);
    }

    function setInterfaceImplementer(
        address addr,
        bytes32 hash,
        address implementer
    ) internal {
        _erc1820.setInterfaceImplementer(addr, hash, implementer);
    }

    function updateERC165Cache(
        address _contract,
        bytes4 _interfaceId
    ) internal {
        _erc1820.updateERC165Cache(_contract, _interfaceId);
    }

    function implementsERC165Interface(
        address _contract,
        bytes4 _interfaceId
    ) internal view returns (bool) {
        return _erc1820.implementsERC165Interface(_contract, _interfaceId);
    }
}
