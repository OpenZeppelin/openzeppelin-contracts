// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (utils/SimulateCall.sol)

pragma solidity ^0.8.20;

/**
 * @dev Library for simulating external calls and inspecting the result of the call while reverting any state changes
 * of events the call may have produced.
 *
 * This pattern is useful when you need to simulate the result of a call without actually executing it on-chain. Since
 * the address of the sender is preserved, this supports simulating calls that perform token swap that use the caller's
 * balance, or any operation that is restricted to the caller.
 *
 * WARNING: On a reverting call, only the first 2048 bytes of the revert data are returned (successful-call data is not
 * truncated).
 */
library SimulateCall {
    /// @dev Simulates a call to the target contract through a dynamically deployed simulator.
    function simulateCall(address target, bytes memory data) internal returns (bool success, bytes memory retData) {
        return simulateCall(target, 0, data);
    }

    /// @dev Same as {simulateCall-address-bytes} but with a value.
    function simulateCall(
        address target,
        uint256 value,
        bytes memory data
    ) internal returns (bool success, bytes memory retData) {
        (success, retData) = getSimulator().delegatecall(abi.encodePacked(target, value, data));
        success = !success; // getSimulator() returns the success value inverted
    }

    /**
     * @dev Returns the simulator address.
     *
     * The simulator REVERTs on success and RETURNs on failure, preserving the return data in both cases. The
     * failure branch copies at most 2048 bytes, so a target cannot emit oversized returndata to run the copy out
     * of gas, which {simulateCall} would otherwise report as a success.
     *
     * * A failed target call returns the return data and succeeds in our context (no state changes).
     * * A successful target call causes a revert in our context (undoing all state changes) while still
     * capturing the return data.
     */
    function getSimulator() internal returns (address instance) {
        // [Simulator details]
        // deployment prefix: 60475f8160095f39f3
        // deployed bytecode: 60333611600a575f5ffd5b6034360360345f375f5f603436035f6014355f3560601c5af1603f573d610800818110603557506038565b90505b805f5f3e5ff35b3d5f5f3e3d5ffd
        //
        // offset | bytecode    | opcode         | stack
        // -------|-------------|----------------|--------
        // 0x0000 | 6033        | push1 0x33     | 0x33
        // 0x0002 | 36          | calldatasize   | cds 0x33
        // 0x0003 | 11          | gt             | (cds>0x33)
        // 0x0004 | 600a        | push1 0x0a     | 0x0a (cds>0x33)
        // 0x0006 | 57          | jumpi          |
        // 0x0007 | 5f          | push0          | 0
        // 0x0008 | 5f          | push0          | 0 0
        // 0x0009 | fd          | revert         |
        // 0x000a | 5b          | jumpdest       |
        // 0x000b | 6034        | push1 0x34     | 0x34
        // 0x000d | 36          | calldatasize   | cds 0x34
        // 0x000e | 03          | sub            | (cds-0x34)
        // 0x000f | 6034        | push1 0x34     | 0x34 (cds-0x34)
        // 0x0011 | 5f          | push0          | 0 0x34 (cds-0x34)
        // 0x0012 | 37          | calldatacopy   |
        // 0x0013 | 5f          | push0          | 0
        // 0x0014 | 5f          | push0          | 0 0
        // 0x0015 | 6034        | push1 0x34     | 0x34 0 0
        // 0x0017 | 36          | calldatasize   | cds 0x34 0 0
        // 0x0018 | 03          | sub            | (cds-0x34) 0 0
        // 0x0019 | 5f          | push0          | 0 (cds-0x34) 0 0
        // 0x001a | 6014        | push1 0x14     | 0x14 0 (cds-0x34) 0 0
        // 0x001c | 35          | calldataload   | cd[0x14] 0 (cds-0x34) 0 0
        // 0x001d | 5f          | push0          | 0 cd[0x14] 0 (cds-0x34) 0 0
        // 0x001e | 35          | calldataload   | cd[0] cd[0x14] 0 (cds-0x34) 0 0
        // 0x001f | 6060        | push1 0x60     | 0x60 cd[0] cd[0x14] 0 (cds-0x34) 0 0
        // 0x0021 | 1c          | shr            | target cd[0x14] 0 (cds-0x34) 0 0
        // 0x0022 | 5a          | gas            | gas target cd[0x14] 0 (cds-0x34) 0 0
        // 0x0023 | f1          | call           | suc
        // 0x0024 | 603f        | push1 0x3f     | 0x3f suc        ; if suc -> success handler (0x3f)
        // 0x0026 | 57          | jumpi          | suc
        // 0x0027 | 3d          | returndatasize | rds             ; FAILURE: len = min(0x800, rds)
        // 0x0028 | 610800      | push2 0x0800   | 0x800 rds
        // 0x002b | 81          | dup2           | rds 0x800 rds
        // 0x002c | 81          | dup2           | 0x800 rds 0x800 rds
        // 0x002d | 10          | lt             | (0x800<rds) 0x800 rds
        // 0x002e | 6035        | push1 0x35     | 0x35 (0x800<rds) 0x800 rds
        // 0x0030 | 57          | jumpi          | 0x800 rds
        // 0x0031 | 50          | pop            | rds             ; rds<=0x800: len = rds
        // 0x0032 | 6038        | push1 0x38     | 0x38 rds
        // 0x0034 | 56          | jump           | rds
        // 0x0035 | 5b          | jumpdest       | 0x800 rds       ; rds>0x800: len = 0x800
        // 0x0036 | 90          | swap1          | rds 0x800
        // 0x0037 | 50          | pop            | 0x800
        // 0x0038 | 5b          | jumpdest       | len
        // 0x0039 | 80          | dup1           | len len
        // 0x003a | 5f          | push0          | 0 len len
        // 0x003b | 5f          | push0          | 0 0 len len
        // 0x003c | 3e          | returndatacopy | len             ; copy min(0x800,rds) bytes
        // 0x003d | 5f          | push0          | 0 len
        // 0x003e | f3          | return         |                 ; return(0, len)
        // 0x003f | 5b          | jumpdest       |                 ; success handler
        // 0x0040 | 3d          | returndatasize | rds
        // 0x0041 | 5f          | push0          | 0 rds
        // 0x0042 | 5f          | push0          | 0 0 rds
        // 0x0043 | 3e          | returndatacopy |                 ; copy FULL returndata (OOG here still -> success)
        // 0x0044 | 3d          | returndatasize | rds
        // 0x0045 | 5f          | push0          | 0 rds
        // 0x0046 | fd          | revert         |                 ; revert(0, rds) -> undoes state
        assembly ("memory-safe") {
            let fmp := mload(0x40)

            // build initcode at FMP
            mstore(add(fmp, 0x40), 0x506038565b90505b805f5f3e5ff35b3d5f5f3e3d5ffd00000000000000000000)
            mstore(add(fmp, 0x20), 0x5f375f5f603436035f6014355f3560601c5af1603f573d610800818110603557)
            mstore(fmp, 0x60475f8160095f39f360333611600a575f5ffd5b603436036034)
            let initcodehash := keccak256(add(fmp, 0x06), 0x50)

            // compute create2 address
            mstore(0x40, initcodehash)
            mstore(0x20, 0)
            mstore(0x00, address())
            mstore8(0x0b, 0xff)
            instance := and(keccak256(0x0b, 0x55), shr(96, not(0)))

            // if simulator not yet deployed, deploy it
            if iszero(extcodesize(instance)) {
                if iszero(create2(0, add(fmp, 0x06), 0x50, 0)) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
            }

            // cleanup fmp space used as scratch
            mstore(0x40, fmp)
        }
    }
}
