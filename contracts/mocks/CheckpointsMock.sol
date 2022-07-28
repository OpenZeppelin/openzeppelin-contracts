// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Checkpoints.sol";

contract CheckpointsMock {
    using Checkpoints for Checkpoints.History;

    Checkpoints.History private _totalCheckpoints;

    function latest() public view returns (uint256) {
        return _totalCheckpoints.latest();
    }

    function push(uint256 value) public returns (uint256, uint256) {
        return _totalCheckpoints.push(value);
    }

    function getAtBlock(uint256 blockNumber) public view returns (uint256) {
        return _totalCheckpoints.getAtBlock(blockNumber);
    }

    function length() public view returns (uint256) {
        return _totalCheckpoints._checkpoints.length;
    }
}

contract Checkpoints224Mock {
    using Checkpoints for Checkpoints.Checkpoint224[];

    Checkpoints.Checkpoint224[] private _totalCheckpoints;

    function latest() public view returns (uint224) {
        return _totalCheckpoints.latest();
    }

    function push(uint32 key, uint224 value) public returns (uint224, uint224) {
        return _totalCheckpoints.push(key, value);
    }

    function lowerLookup(uint32 key) public view returns (uint224) {
        return _totalCheckpoints.lowerLookup(key);
    }

    function upperLookup(uint32 key) public view returns (uint224) {
        return _totalCheckpoints.upperLookup(key);
    }

    function upperLookupExpEnd(uint32 key) public view returns (uint224) {
        return _totalCheckpoints.upperLookupExpEnd(key);
    }

    function length() public view returns (uint256) {
        return _totalCheckpoints.length;
    }
}

contract Checkpoints160Mock {
    using Checkpoints for Checkpoints.Checkpoint160[];

    Checkpoints.Checkpoint160[] private _totalCheckpoints;

    function latest() public view returns (uint160) {
        return _totalCheckpoints.latest();
    }

    function push(uint96 key, uint160 value) public returns (uint160, uint160) {
        return _totalCheckpoints.push(key, value);
    }

    function lowerLookup(uint96 key) public view returns (uint160) {
        return _totalCheckpoints.lowerLookup(key);
    }

    function upperLookup(uint96 key) public view returns (uint160) {
        return _totalCheckpoints.upperLookup(key);
    }

    function upperLookupExpEnd(uint96 key) public view returns (uint224) {
        return _totalCheckpoints.upperLookupExpEnd(key);
    }

    function length() public view returns (uint256) {
        return _totalCheckpoints.length;
    }
}
