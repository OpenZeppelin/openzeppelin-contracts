// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Library for managing uint256 to bool mapping in a compact and efficient way, providing the keys are sequential.
 * Largelly inspired by Uniswap's https://github.com/Uniswap/merkle-distributor/blob/master/contracts/MerkleDistributor.sol[merkle-distributor].
 */
library BitMaps {
    struct BitMap {
        mapping(uint256 => uint256) _data;
    }

    function get(BitMap storage bitmap, uint256 index) internal view returns (bool) {
        uint256 bucket = index / 256;
        uint256 pos = index % 256;
        uint256 word = bitmap._data[bucket];
        uint256 mask = (1 << pos);
        return word & mask != 0;
    }

    function set(BitMap storage bitmap, uint256 index) internal {
        uint256 bucket = index / 256;
        uint256 pos = index % 256;
        bitmap._data[bucket] |= (1 << pos);
    }

    function unset(BitMap storage bitmap, uint256 index) internal {
        uint256 bucket = index / 256;
        uint256 pos = index % 256;
        bitmap._data[bucket] &= ~(1 << pos);
    }
}
