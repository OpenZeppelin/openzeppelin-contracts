// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/CheckpointsUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract CheckpointsImplUpgradeable is Initializable {
    function __CheckpointsImpl_init() internal onlyInitializing {
    }

    function __CheckpointsImpl_init_unchained() internal onlyInitializing {
    }
    using CheckpointsUpgradeable for CheckpointsUpgradeable.History;

    CheckpointsUpgradeable.History private _totalCheckpoints;

    function latest() public view returns (uint256) {
        return _totalCheckpoints.latest();
    }

    function getAtBlock(uint256 blockNumber) public view returns (uint256) {
        return _totalCheckpoints.getAtBlock(blockNumber);
    }

    function push(uint256 value) public returns (uint256, uint256) {
        return _totalCheckpoints.push(value);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
