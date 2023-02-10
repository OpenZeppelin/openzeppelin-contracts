// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Provides emulation of static delegatecalls for implementing view-only
 * functions that execute another contract's code with the calling contract's
 * context.
 */
abstract contract StaticDelegateCall {
    /**
     * @dev Perform a static delegate call to the specified `target` with
     * calldata `data`. Returns success boolean and return data.
     */
    function _staticDelegateCall(address target, bytes memory data) internal view returns (bool, bytes memory) {
        /* This staticcall always reverts, so we can ignore the success boolean */
        (, bytes memory returndata) = address(this).staticcall(
            abi.encodeCall(this.delegateCallAndRevert, (target, data))
        );
        return abi.decode(returndata, (bool, bytes));
    }

    /**
     * @dev Simulate a delegatecall to the specified `target` with calldata
     * `data` by reverting with the results. The resulting success boolean and
     * return data are ABI-encoded in the revert data.
     *
     * Inspired by simulateAndRevert() from Gnosis' StorageSimulation contract.
     */
    function delegateCallAndRevert(address target, bytes memory data) external {
        require(msg.sender == address(this), "StaticDelegateCall: caller must be self");
        (bool success, bytes memory returndata) = target.delegatecall(data);
        bytes memory result = abi.encode(success, returndata);
        assembly {
            revert(add(result, 0x20), mload(result))
        }
    }
}
