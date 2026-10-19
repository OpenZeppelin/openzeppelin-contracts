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
 * WARNING: The target controls the size of the data it returns (or reverts with), and the cost of copying that data
 * grows quadratically with its size. This puts the following limits on the simulation:
 *
 * * On a reverting call, only the first 2048 bytes of the revert data are returned. This bounds the cost of handling
 *   a failure, so that a target cannot make a failed call look like a success by reverting with oversized data.
 * * On a successful call, the return data is not truncated: the simulator copies it in full. If the target can afford
 *   to produce its return data, but the simulator cannot afford to copy it with the gas the target did not use, the
 *   simulator runs out of gas and the call is reported as a *success with empty return data*.
 * * If the target cannot afford to produce its return (or revert) data, it runs out of gas. The call is then reported
 *   as a *failure with empty return data*, like any other out-of-gas failure, even if the target would have succeeded
 *   with more gas.
 * * When the simulation completes, the caller still has to pay for receiving the return data, which may cause it to
 *   run out of gas.
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
        // Bytecode compiled from contracts/utils/SimulateCall.yul.
        // deployment prefix: 0x603580600a5f395ff3fe
        // deployed bytecode: 0x5f803660331901806034833781601435813560601c5af1602d576108003d116108003d18023d18805f803e5ff35b3d5f803e3d5ffd
        assembly ("memory-safe") {
            let fmp := mload(0x40)

            // build initcode at FMP
            mstore(add(fmp, 0x20), 0x5af1602d576108003d116108003d18023d18805f803e5ff35b3d5f803e3d5ffd)
            mstore(fmp, 0x603580600a5f395ff3fe5f803660331901806034833781601435813560601c)
            let initcodehash := keccak256(add(fmp, 0x01), 0x3f)

            // compute create2 address
            mstore(0x40, initcodehash)
            mstore(0x20, 0)
            mstore(0x00, address())
            mstore8(0x0b, 0xff)
            instance := and(keccak256(0x0b, 0x55), shr(96, not(0)))

            // if simulator not yet deployed, deploy it
            if iszero(extcodesize(instance)) {
                if iszero(create2(0, add(fmp, 0x01), 0x3f, 0)) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
            }

            // cleanup fmp space used as scratch
            mstore(0x40, fmp)
        }
    }
}
