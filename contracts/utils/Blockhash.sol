// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @dev Library for accessing historical block hashes beyond the standard 256 block limit.
 * Uses EIP-2935's history storage contract which maintains a ring buffer of the last
 * 8191 block hashes in state.
 *
 * For blocks within the last 256 blocks, it uses the native `BLOCKHASH` opcode.
 * For blocks between 257 and 8191 blocks ago, it queries the EIP-2935 history storage.
 * For blocks older than 8191 or future blocks, it returns zero, matching the `BLOCKHASH` behavior.
 *
 * NOTE: After EIP-2935 activation, it takes 8191 blocks to completely fill the history.
 * Before that, only block hashes since the fork block will be available.
 */
library Blockhash {
    address internal constant HISTORY_STORAGE_ADDRESS = 0x0000F90827F1C53a10cb7A02335B175320002935;

    /**
     * @dev Retrieves the block hash for any historical block within the supported range.
     *
     * NOTE: The function gracefully handles future blocks and blocks beyond the history window
     * by returning zero, consistent with the EVM's native `BLOCKHASH` behavior.
     */
    function blockHash(uint256 blockNumber) internal view returns (bytes32) {
        uint256 current = block.number;
        uint256 distance;

        unchecked {
            // Can only wrap around to `current + 1` given `block.number - (2**256 - 1) = block.number + 1`
            distance = current - blockNumber;
        }

        return distance > 256 && distance <= 8191 ? _historyStorageCall(blockNumber) : blockhash(blockNumber);
    }

    /// @dev Internal function to query the EIP-2935 history storage contract.
    function _historyStorageCall(uint256 blockNumber) private view returns (bytes32 hash) {
        assembly ("memory-safe") {
            // Use scratch space to allocate blockNumber
            mstore(0, 0x20) // Store length and clear potentially dirty scratch space
            mstore(0x20, blockNumber) // Store the blockNumber in scratch space

            // In case the history storage address is not deployed, the call will succeed
            // without returndata, so the hash will be 0 just as querying `blockhash` directly.
            let success := staticcall(gas(), HISTORY_STORAGE_ADDRESS, 0x20, 0, 0, 0x20)
            // In case of failure, the returndata might include the revert reason or custom error
            if success {
                hash := mload(0)
            }
        }
    }
}
