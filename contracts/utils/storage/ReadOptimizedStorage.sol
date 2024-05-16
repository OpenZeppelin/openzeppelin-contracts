// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "contracts/utils/storage/IStorage.sol";

/*
 * @title ReadOptimizedStorage
 * @dev Library for storing data in a read-optimized storage contract. The idea is to store data in a contract code and when
 * reading the data, copy it to transient storage. This is useful when you need to store data that is not going to
 * change often but you need to read it frequently.
 */
library ReadOptimizedStorage {
    bytes32 private constant _READ_OPTIMIZED_STORAGE = keccak256("src.repository.ReadOptimizedStorage.v1");

    /*
     * @dev Read a uint256 value from the read-optimized storage
     * @param _key The key to read
     * @return value The value stored in the key
     */
    function readUint(IStorage _key) internal returns (uint256 value) {
        assembly {
            value := tload(_key)
        }
        if (value != 0) {
            return value;
        }
        if (copyToTransientStorage()) {
            assembly {
                value := tload(_key)
            }
        }
    }

    /*
     * @dev Read an address value from the read-optimized storage
     * @param _key The key to read
     * @return value The value stored in the key
     */
    function readAddress(IStorage _key) internal returns (address value) {
        assembly {
            value := tload(_key)
        }
        if (value != address(0)) {
            return value;
        }
        if (copyToTransientStorage()) {
            assembly {
                value := tload(_key)
            }
        }
    }

    /*
     * @dev Read a bytes32 value from the read-optimized storage
     * @param _key The key to read
     * @return value The value stored in the key
     */
    function readBytes32(IStorage _key) internal returns (bytes32 value) {
        assembly {
            value := tload(_key)
        }
        if (value != bytes32(0)) {
            return value;
        }
        if (copyToTransientStorage()) {
            assembly {
                value := tload(_key)
            }
        }
    }

    /*
     * @dev Write a uint256 value to the read-optimized storage
     * @param _key The key to write
     * @param _value The value to write
     */
    function writeUint(IStorage _key, uint256 _value) internal {
        writeBytes32(_key, bytes32(_value));
    }

    /*
     * @dev Write an address value to the read-optimized storage
     * @param _key The key to write
     * @param _value The value to write
     */
    function writeAddress(IStorage _key, address _value) internal {
        writeBytes32(_key, bytes32(uint256(uint160(_value))));
    }

    /*
     * @dev Write a bytes32 value to the read-optimized storage
     * @param _key The key to write
     * @param _value The value to write
     */
    function writeBytes32(IStorage _key, bytes32 _value) internal {
        store(_key, _value);
    }

    /*
     * @dev Copy the data from the read-optimized storage to the transient storage
     * @return true if the data was copied, false otherwise
     */
    function copyToTransientStorage() private returns (bool) {
        bytes32 location = _READ_OPTIMIZED_STORAGE;
        address storageContract;
        assembly {
            storageContract := tload(location)
        }

        if (storageContract != address(0)) {
            return false;
        }

        assembly {
            storageContract := sload(location)
            tstore(location, storageContract)
        }

        uint256 size;
        assembly {
            size := extcodesize(storageContract)
        }

        bytes memory code = new bytes(size);
        assembly {
            extcodecopy(storageContract, add(code, 0x20), 0, size)
        }

        (bytes32[] memory keys, bytes32[] memory values) = abi.decode(code, (bytes32[], bytes32[]));

        assembly {
            let keysLength := mload(keys)
            let keysPtr := add(keys, 0x20)
            let valuesPtr := add(values, 0x20)
            let end := add(keysPtr, mul(keysLength, 0x20))

            for {} lt(keysPtr, end) {
                keysPtr := add(keysPtr, 0x20)
                valuesPtr := add(valuesPtr, 0x20)
            } {
                let key := mload(keysPtr)
                let value := mload(valuesPtr)
                tstore(key, value)
            }
        }

        return true;
    }

    /*
     * @dev Store a key-value pair in the other storage contract
     * @param _key The key to store
     * @param _value The value to store
     */
    function store(IStorage _key, bytes32 _value) private {
        address storageContract;
        bytes32[] memory keys;
        bytes32[] memory values;
        bytes memory newCode;
        bool found = false;

        uint256 size;
        bytes32 location = _READ_OPTIMIZED_STORAGE;
        assembly {
            storageContract := sload(location)
            size := extcodesize(storageContract)
        }

        if (size > 0) {
            bytes memory code = new bytes(size);
            assembly {
                extcodecopy(storageContract, add(code, 0x20), 0, size)
            }
            (keys, values) = abi.decode(code, (bytes32[], bytes32[]));
        }

        for (uint256 i = 0; i < keys.length; i++) {
            if (keys[i] == IStorage.unwrap(_key)) {
                values[i] = _value;
                found = true;
                break;
            }
        }

        if (!found) {
            keys = copyBytes32Array(keys);
            values = copyBytes32Array(values);

            keys[keys.length - 1] = IStorage.unwrap(_key);
            values[values.length - 1] = _value;
        }

        newCode = createContractCreationCode(abi.encode(keys, values));
        assembly {
        // Create new storage contract
            storageContract := create(0, add(newCode, 0x20), mload(newCode))
            sstore(location, storageContract)

        // Copy the new storage to transient storage
            let keysLength := mload(keys)
            let keysPtr := add(keys, 0x20)
            let valuesPtr := add(values, 0x20)
            let end := add(keysPtr, mul(keysLength, 0x20))

            for {} lt(keysPtr, end) {
                keysPtr := add(keysPtr, 0x20)
                valuesPtr := add(valuesPtr, 0x20)
            } {
                let key := mload(keysPtr)
                let value := mload(valuesPtr)
                tstore(key, value)
            }
        }
    }

    /*
     * @dev Create the contract creation code for the new storage contract
     * @param _code The code to store in the new storage contract
     * @return result The contract creation code
     */
    function createContractCreationCode(bytes memory _code) private pure returns (bytes memory) {
        return abi.encodePacked(
            hex"63",
            uint32(_code.length),
            hex"80_60_0E_60_00_39_60_00_F3",
            _code
        );
    }


    /*
     * @dev Copy a bytes32 array
     * @param source The source array to copy
     * @return destination The copied array
     */
    function copyBytes32Array(bytes32[] memory source) private pure returns (bytes32[] memory) {
        bytes32[] memory destination = new bytes32[](source.length + 1);
        assembly {
            let length := mload(source)
            let src := add(source, 0x20)
            let dest := add(destination, 0x20)
            for { let end := add(src, mul(length, 0x20)) } lt(src, end) {
                src := add(src, 0x20)
                dest := add(dest, 0x20)
            } { mstore(dest, mload(src)) }
        }
        return destination;
    }
}
