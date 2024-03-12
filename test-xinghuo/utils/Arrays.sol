pragma solidity ^0.8.20;

import {Arrays} from "../../openzeppelin-contracts/contracts/utils/Arrays.sol";

contract MyArrays {
    uint256[] uint256_array = [1,2,3,4,5];
    bytes32[] bytes32_array;
    address[] address_array = [did:bid:ef22ceNHdxTGMKfthBEjMaqHPj2TXT3VN, did:bid:ef22ceNHdxTGMKfthBEjMaqHPj2TXT3VN];

    constructor() {
        bytes32_array.push("0x1");
        bytes32_array.push("0x2");
        bytes32_array.push("0x3");
        bytes32_array.push("0x4");
    }

    //遍历地址数组到指定pos
    function unsafeMemoryAccess(address[] memory array, uint256 pos) public returns(address) {
        return Arrays.unsafeMemoryAccess(array, pos);
    }
    //遍历uint256数组到指定pos
    function unsafeMemoryAccess(uint256[] memory array, uint256 pos) public returns(uint256) {
        return Arrays.unsafeMemoryAccess(array, pos);
    }
    //遍历uint256数组到指定pos，返回元素
    function unsafeAccessuint256(uint256 pos) public returns(uint256) {
        return Arrays.unsafeAccess(uint256_array, pos).value;
    }
    //遍历bytes32数组到指定pos，返回元素
    function unsafeAccessbytes32(uint256 pos) public returns(bytes32) {
        return Arrays.unsafeAccess(bytes32_array, pos).value;
    }
    //遍历address数组到指定pos，返回元素
    function unsafeAccessaddress(uint256 pos) public returns(address) {
        return Arrays.unsafeAccess(address_array, pos).value;
    }

    function findUpperBound() public returns(uint256) {
        return Arrays.findUpperBound(uint256_array, 2);
    }
}