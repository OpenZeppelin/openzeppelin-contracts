pragma solidity ^0.8.20;

import {Base64} from "../../openzeppelin-contracts/contracts/utils/Base64.sol";

contract MyBase64 {
    function encodetest() public returns(string memory) {
        bytes memory str = bytes("0x40c0d99bb87fb8fe451506144e7baf97ff1f7d4bb6ec");
        return Base64.encode(str);
    }
}