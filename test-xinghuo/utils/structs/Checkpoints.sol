pragma solidity ^0.8.20;

import {Checkpoints} from "../../../openzeppelin-contracts/contracts/utils/structs/Checkpoints.sol";

contract MyCheckpoints {

    Checkpoints.Trace224 trace;

    function push(uint32 key, uint224 value) public returns(uint224, uint224) {
        return Checkpoints.push(trace, key, value);
    }

    function lowerLookup(uint32 key) public returns(uint224) {
        return Checkpoints.lowerLookup(trace, key);
    }

    function upperLookup(uint32 key) public returns(uint224) {
        return Checkpoints.upperLookup(trace, key);
    }

    function upperLookupRecent(uint32 key) public returns(uint224) {
        return Checkpoints.upperLookupRecent(trace, key);
    }

    function latest(uint32 key) public returns(uint224) {
        return Checkpoints.latest(trace);
    }

    function latestCheckpoint() public returns(bool, uint32, uint224) {
        return Checkpoints.latestCheckpoint(trace);
    }

    function length() public returns(uint256) {
        return Checkpoints.length(trace);
    }
    
    function at(uint32 pos) public returns(uint32, uint224) {
        return (Checkpoints.at(trace, pos)._key, Checkpoints.at(trace, pos)._value);
    }
}