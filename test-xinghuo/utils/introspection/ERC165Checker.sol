pragma solidity ^0.8.20;

import {ERC165} from "../../../openzeppelin-contracts/contracts/utils/introspection/ERC165.sol";
import {ERC165Checker} from "../../../openzeppelin-contracts/contracts/utils/introspection/ERC165Checker.sol";
import {IERC165} from "../../../openzeppelin-contracts/contracts/utils/introspection/IERC165.sol";

interface AA {
    function aa(bool) external view returns (bool);
    function bb(address) external view returns (bool);
}

interface BB {
    function cc(bytes32) external view returns (address);
    function dd(address) external view returns (uint256);
}

contract MyERC165 is ERC165, AA {

    function aa(bool) external view returns (bool) {
        return true;
    }

    function bb(address) external view returns (bool) {
        return true;
    }

    //检测当前合约是否实现了ERC165标准
    function supportsERC165() public returns(bool) {
        return ERC165Checker.supportsERC165(address(this));
    }

    function getSupportedInterfaces() public returns(bool[] memory) {
        bytes4[] memory interfaceIdsSupported = new bytes4[](3);
        interfaceIdsSupported[0] = type(AA).interfaceId;
        interfaceIdsSupported[1] = type(BB).interfaceId;
        interfaceIdsSupported[2] = type(IERC165).interfaceId;

        return ERC165Checker.getSupportedInterfaces(address(this), interfaceIdsSupported);
    }

    function supportsAllInterfaces() public returns(bool) {
        bytes4[] memory interfaceIdsSupported = new bytes4[](3);
        interfaceIdsSupported[0] = type(AA).interfaceId;
        interfaceIdsSupported[1] = type(BB).interfaceId;
        interfaceIdsSupported[2] = type(IERC165).interfaceId;

        return ERC165Checker.supportsAllInterfaces(address(this), interfaceIdsSupported);
    }
}