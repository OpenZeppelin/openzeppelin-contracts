// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Checkpoints.sol";

contract CheckpointsImpl {
    using Checkpoints for Checkpoints.History;

    Checkpoints.History private _totalCheckpoints;

    function length() public view returns (uint256) {
        return _totalCheckpoints.length();
    }

    function at(uint256 pos) public view returns (Checkpoints.Checkpoint memory) {
        return _totalCheckpoints.at(pos);
    }

    function latest() public view returns (uint256) {
        return _totalCheckpoints.latest();
    }

    function past(uint256 index) public view returns (uint256) {
        return _totalCheckpoints.past(index);
    }

    function push(uint256 value) public returns (uint256, uint256) {
       return _totalCheckpoints.push(value);
    }
}
