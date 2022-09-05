const format = require('../format-lines');

const VALUE_SIZES = [ 224, 160 ];

const header = `\
pragma solidity ^0.8.0;

import "../utils/Checkpoints.sol";
`;

const legacy = () => `\
contract CheckpointsMock {
    using Checkpoints for Checkpoints.History;

    Checkpoints.History private _totalCheckpoints;

    function latest() public view returns (uint256) {
        return _totalCheckpoints.latest();
    }

    function latestCheckpoint() public view returns (bool, uint256, uint256) {
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
`;

const checkpoint = length => `\
contract Checkpoints${length}Mock {
    using Checkpoints for Checkpoints.Trace${length};

    Checkpoints.Trace${length} private _totalCheckpoints;

    function latest() public view returns (uint${length}) {
        return _totalCheckpoints.latest();
    }

    function latestCheckpoint() public view returns (bool, uint${256 - length}, uint${length}) {
        return _totalCheckpoints.latestCheckpoint();
    }

    function length() public view returns (uint256) {
        return _totalCheckpoints.length();
    }

    function push(uint${256 - length} key, uint${length} value) public returns (uint${length}, uint${length}) {
        return _totalCheckpoints.push(key, value);
    }

    function lowerLookup(uint${256 - length} key) public view returns (uint${length}) {
        return _totalCheckpoints.lowerLookup(key);
    }

    function upperLookup(uint${256 - length} key) public view returns (uint${length}) {
        return _totalCheckpoints.upperLookup(key);
    }
}
`;

// GENERATE
module.exports = format(
  header,
  legacy(),
  ...VALUE_SIZES.map(checkpoint),
);
