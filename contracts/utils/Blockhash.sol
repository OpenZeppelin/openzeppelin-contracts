// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/Blockhash.sol)

pragma solidity ^0.8.20;

import {Memory} from "./Memory.sol";
import {RLP} from "./RLP.sol";

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
    /// @dev The RLP-encoded block header does not contain the block number field.
    error BlockhashInvalidBlockHeader();

    /// @dev Address of the EIP-2935 history storage contract.
    address internal constant HISTORY_STORAGE_ADDRESS = 0x0000F90827F1C53a10cb7A02335B175320002935;

    /**
     * @dev Retrieves the block hash for any historical block within the supported range.
     *
     * NOTE: The function gracefully handles future blocks and blocks beyond the history window
     * by returning zero, consistent with the EVM's native `BLOCKHASH` behavior.
     */
    function blockHash(uint256 targetBlockNumber) internal view returns (bytes32) {
        uint256 current = block.number;
        uint256 distance;

        unchecked {
            // Can only wrap around to `current + 1` given `block.number - (2**256 - 1) = block.number + 1`
            distance = current - targetBlockNumber;
        }

        return distance < 257 ? blockhash(targetBlockNumber) : _historyStorageCall(targetBlockNumber);
    }

    /**
     * @dev Extracts the block number from an RLP-encoded Ethereum block header.
     *
     * The block number is the ninth field in the header, and later protocol upgrades append
     * fields at the end, so this position is stable across header extensions.
     */
    function blockNumber(bytes memory blockHeader) internal pure returns (uint256) {
        Memory.Slice[] memory fields = RLP.decodeList(blockHeader);
        require(fields.length > 8, BlockhashInvalidBlockHeader());
        return RLP.readUint256(fields[8]);
    }

    /**
     * @dev Verifies that an RLP-encoded block header matches the canonical hash recorded for its block number.
     */
    function verifyBlockHeader(bytes memory blockHeader) internal view returns (bool) {
        return keccak256(blockHeader) == blockHash(blockNumber(blockHeader));
    }

    /// @dev Internal function to query the EIP-2935 history storage contract.
    function _historyStorageCall(uint256 targetBlockNumber) private view returns (bytes32 hash) {
        assembly ("memory-safe") {
            // Store the block number in scratch space
            mstore(0x00, targetBlockNumber)
            mstore(0x20, 0)

            // call history storage address
            pop(staticcall(gas(), HISTORY_STORAGE_ADDRESS, 0x00, 0x20, 0x20, 0x20))

            // load result
            hash := mload(0x20)
        }
    }
}
