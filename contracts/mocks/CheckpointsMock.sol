// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/CheckpointsMock.js.

pragma solidity ^0.8.0;

import "../utils/Checkpoints.sol";

contract CheckpointsMock {
    using Checkpoints for Checkpoints.History;

    Checkpoints.History private _totalCheckpoints;

    function latest() public view returns (uint256) {
        return _totalCheckpoints.latest();
    }

    function latestCheckpoint()
        public
        view
        returns (
            bool,
            uint256,
            uint256
        )
    {
        return _totalCheckpoints.latestCheckpoint();
    }

    function length() public view returns (uint256) {
        return _totalCheckpoints.length();
    }

    function push(uint256 value) public returns (uint256, uint256) {
        return _totalCheckpoints.push(value);
    }

    function getAtBlock(uint256 blockNumber) public view returns (uint256) {
        return _totalCheckpoints.getAtBlock(blockNumber);
    }

    function getAtProbablyRecentBlock(uint256 blockNumber) public view returns (uint256) {
        return _totalCheckpoints.getAtProbablyRecentBlock(blockNumber);
    }
}

contract Checkpoints224Mock {
    using Checkpoints for Checkpoints.Trace224;

    Checkpoints.Trace224 private _totalCheckpoints;

    function latest() public view returns (uint224) {
        return _totalCheckpoints.latest();
    }

    function latestCheckpoint()
        public
        view
        returns (
            bool,
            uint32,
            uint224
        )
    {
        return _totalCheckpoints.latestCheckpoint();
    }

    function length() public view returns (uint256) {
        return _totalCheckpoints.length();
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
}

contract Checkpoints160Mock {
    using Checkpoints for Checkpoints.Trace160;

    Checkpoints.Trace160 private _totalCheckpoints;

    function latest() public view returns (uint160) {
        return _totalCheckpoints.latest();
    }

    function latestCheckpoint()
        public
        view
        returns (
            bool,
            uint96,
            uint160
        )
    {
        return _totalCheckpoints.latestCheckpoint();
    }

    function length() public view returns (uint256) {
        return _totalCheckpoints.length();
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
}
