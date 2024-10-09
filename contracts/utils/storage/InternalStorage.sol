// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "contracts/utils/storage/IStorage.sol";

library InternalStorage {
    function writeUint(IStorage _key, uint256 _value) internal {
        assembly {
            sstore(_key, _value)
        }
    }

    function readUint(IStorage _key) internal view returns (uint256 value) {
        assembly {
            value := sload(_key)
        }
    }

    function writeAddress(IStorage _key, address _value) internal {
        assembly {
            sstore(_key, _value)
        }
    }

    function readAddress(IStorage _key) internal view returns (address value) {
        assembly {
            value := sload(_key)
        }
    }

    function writeBytes32(IStorage _key, bytes32 _value) internal {
        assembly {
            sstore(_key, _value)
        }
    }

    function readBytes32(IStorage _key) internal view returns (bytes32 value) {
        assembly {
            value := sload(_key)
        }
    }
}
