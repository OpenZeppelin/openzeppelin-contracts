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
     * The simulator REVERTs on success and RETURNs on failure, preserving the return data in both cases.
     *
     * * A failed target call returns the return data and succeeds in our context (no state changes).
     * * A successful target call causes a revert in our context (undoing all state changes) while still
     * capturing the return data.
     */
    function getSimulator() internal returns (address instance) {
        // Bytecode compiled from scripts/yul/CallSimulator.yul.
        // deployment prefix: 0x603080600a5f395ff3fe
        // deployed bytecode: 0x60343610602c575f803660331901806034833781601435813560601c5af13d90815f803e6029575ff35b5ffd5b5f80fd
        assembly ("memory-safe") {
            let fmp := mload(0x40)
            // build initcode at FMP
            mstore(add(fmp, 0x20), 0x34833781601435813560601c5af13d90815f803e6029575ff35b5ffd5b5f80fd)
            mstore(fmp, 0x603080600a5f395ff3fe60343610602c575f8036603319018060)
            let initcodehash := keccak256(add(fmp, 0x06), 0x3a)

            // compute create2 address
            mstore(0x40, initcodehash)
            mstore(0x20, 0)
            mstore(0x00, address())
            mstore8(0x0b, 0xff)
            instance := and(keccak256(0x0b, 0x55), shr(96, not(0)))

            // if simulator not yet deployed, deploy it
            if iszero(extcodesize(instance)) {
                if iszero(create2(0, add(fmp, 0x06), 0x3a, 0)) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
            }

            // cleanup fmp space used as scratch
            mstore(0x40, fmp)
        }
    }
}
