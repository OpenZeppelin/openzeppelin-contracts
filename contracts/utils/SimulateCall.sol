// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Library for simulating external calls through dynamically deployed simulator contracts that revert with
 * the return data, allowing inspection of call results without state changes.
 *
 * This pattern is useful when you need to simulate the result of a call without actually executing it on-chain,
 * or when you need to isolate the caller's address from the target contract.
 */
library SimulateCall {
    /// @dev Simulates a call to the target contract through a dynamically deployed simulator.
    function simulateCall(address target, bytes memory data) internal returns (bool success, bytes memory retData) {
        return simulateCall(target, 0, data, bytes32(0));
    }

    /// @dev Same as {simulateCall-address-bytes} but with a value.
    function simulateCall(
        address target,
        uint256 value,
        bytes memory data
    ) internal returns (bool success, bytes memory retData) {
        return simulateCall(target, value, data, bytes32(0));
    }

    /// @dev Same as {simulateCall-address-bytes} but with a salt for deterministic simulator address.
    function simulateCall(
        address target,
        bytes memory data,
        bytes32 salt
    ) internal returns (bool success, bytes memory retData) {
        return simulateCall(target, 0, data, salt);
    }

    /// @dev Same as {simulateCall-address-bytes} but with a salt and a value.
    function simulateCall(
        address target,
        uint256 value,
        bytes memory data,
        bytes32 salt
    ) internal returns (bool success, bytes memory retData) {
        // Calls to a simulator always revert. No need to check the success flag.
        (, retData) = getSimulator(salt).call{value: value}(abi.encodePacked(target, data));

        assembly ("memory-safe") {
            // length of the returned buffer (result/reason + success byte)
            let length := mload(retData)

            // extract the success byte (last byte of the returned buffer)
            success := and(mload(add(retData, length)), 0xff)

            // shrink retData to exclude the success byte
            mstore(retData, sub(length, 1))
        }
    }

    /// @dev Same as {getSimulator} but with a `bytes32(0)` default salt.
    function getSimulator() internal returns (address) {
        return getSimulator(bytes32(0));
    }

    /// @dev Returns the simulator address for a given salt.
    function getSimulator(bytes32 salt) internal returns (address simulator) {
        // [Simulator details]
        //
        // deployment prefix: 602e5f8160095f39f3
        // deployed bytecode: 60133611600a575f5ffd5b6014360360145f375f5f601436035f345f3560601c5af13d5f5f3e3d533d6001015ffd
        //
        // offset | bytecode    | opcode         | stack
        // -------|-------------|----------------|--------
        // 0x0000 | 6013        | push1 0x13     | 0x13
        // 0x0002 | 36          | calldatasize   | cds 0x13
        // 0x0003 | 11          | gt             | (cds>0x13)
        // 0x0004 | 600a        | push1 0x0a     | 0x0a (cds>0x13)
        // 0x0006 | 57          | jumpi          |
        // 0x0007 | 5f          | push0          | 0
        // 0x0008 | 5f          | push0          | 0 0
        // 0x0009 | fd          | revert         |
        // 0x000a | 5b          | jumpdest       |
        // 0x000b | 6014        | push1 0x14     | 0x14
        // 0x000d | 36          | calldatasize   | cds 0x14
        // 0x000e | 03          | sub            | (cds-0x14)
        // 0x000f | 6014        | push1 0x14     | 0x14 (cds-0x14)
        // 0x0011 | 5f          | push0          | 0 0x14 (cds-0x14)
        // 0x0012 | 37          | calldatacopy   |
        // 0x0013 | 5f          | push0          | 0
        // 0x0014 | 5f          | push0          | 0 0
        // 0x0015 | 6014        | push1 0x14     | 0x14 0 0
        // 0x0017 | 36          | calldatasize   | cds 0x14 0 0
        // 0x0018 | 03          | sub            | (cds-0x14) 0 0
        // 0x0019 | 5f          | push0          | 0 (cds-0x14) 0 0
        // 0x001a | 34          | callvalue      | value 0 (cds-0x14) 0 0
        // 0x001b | 5f          | push0          | 0 value 0 (cds-0x14) 0 0
        // 0x001c | 35          | calldataload   | cd[0] value 0 (cds-0x14) 0 0
        // 0x001d | 6060        | push1 0x60     | 0x60 cd[0] value 0 (cds-0x14) 0 0
        // 0x001f | 1c          | shr            | target value 0 (cds-0x14) 0 0
        // 0x0020 | 5a          | gas            | gas target value 0 (cds-0x14) 0 0
        // 0x0021 | f1          | call           | suc
        // 0x0022 | 3d          | returndatasize | rds suc
        // 0x0023 | 5f          | push0          | 0 rds suc
        // 0x0024 | 5f          | push0          | 0 0 rds suc
        // 0x0025 | 3e          | returndatacopy | suc
        // 0x0026 | 3d          | returndatasize | rds suc
        // 0x0027 | 53          | mstore8        |
        // 0x0028 | 3d          | returndatasize | rds
        // 0x0029 | 6001        | push1 0x01     | 0x01 rds
        // 0x002b | 01          | add            | (rds+0x01)
        // 0x002c | 5f          | push0          | 0 (rds+0x01)
        // 0x002d | fd          | revert         |

        assembly ("memory-safe") {
            // build initcode at scratch space
            mstore(0x20, 0x0360145f375f5f601436035f345f3560601c5af13d5f5f3e3d533d6001015ffd)
            mstore(0x00, 0x602e5f8160095f39f360133611600a575f5ffd5b601436)
            let initcodehash := keccak256(0x09, 0x37)

            let fmp := mload(0x40) // cache free memory pointer

            // compute create2 address
            mstore(add(fmp, 0x40), initcodehash)
            mstore(add(fmp, 0x20), salt)
            mstore(add(fmp, 0x00), address())
            mstore8(add(fmp, 0x0b), 0xff)
            simulator := and(keccak256(add(fmp, 0x0b), 0x55), shr(96, not(0)))

            // if simulator not yet deployed, deploy it
            if iszero(extcodesize(simulator)) {
                if iszero(create2(0, 0x09, 0x37, salt)) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
            }

            // cleanup fmp space used as scratch
            mstore(0x40, fmp)
        }
    }
}
