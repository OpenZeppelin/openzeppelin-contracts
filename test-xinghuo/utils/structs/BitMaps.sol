pragma solidity ^0.8.20;

import {BitMaps} from "../../../openzeppelin-contracts/contracts/utils/structs/BitMaps.sol";

contract MyBitMaps {
    BitMaps.BitMap bmap;
    
    function setTo(uint256 index, bool value) public {
        BitMaps.setTo(bmap, index, value);
    }

    function get(uint256 index) public returns(bool) {
        return BitMaps.get(bmap, index);
    }
}