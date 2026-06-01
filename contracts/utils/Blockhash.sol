// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/Blockhash.sol)

pragma solidity ^0.8.20;

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
        (uint256 listOffset, uint256 listLength, bool isList) = _decodeLength(blockHeader, 0);
        if (!(isList && blockHeader.length == listOffset + listLength)) {
            revert BlockhashInvalidBlockHeader();
        }

        uint256 currentOffset = listOffset;
        uint256 listEnd = listOffset + listLength;

        for (uint256 i = 0; i < 8; ++i) {
            if (!(currentOffset < listEnd)) {
                revert BlockhashInvalidBlockHeader();
            }
            currentOffset += _itemLength(blockHeader, currentOffset);
        }

        if (!(currentOffset < listEnd)) {
            revert BlockhashInvalidBlockHeader();
        }

        (uint256 itemOffset, uint256 itemLength, bool itemIsList) = _decodeLength(blockHeader, currentOffset);
        if (itemIsList) {
            revert BlockhashInvalidBlockHeader();
        }

        return _readUint256(blockHeader, currentOffset + itemOffset, itemLength);
    }

    /**
     * @dev Verifies that an RLP-encoded block header matches the canonical hash recorded for its block number.
     */
    function verifyBlockHeader(bytes memory blockHeader) internal view returns (bool) {
        return keccak256(blockHeader) == blockHash(blockNumber(blockHeader));
    }

    function _decodeLength(bytes memory data, uint256 offset) private pure returns (uint256, uint256, bool) {
        if (!(offset < data.length)) {
            revert BlockhashInvalidBlockHeader();
        }

        uint8 prefix = uint8(data[offset]);

        if (prefix < 0x80) {
            return (0, 1, false);
        }
        if (prefix <= 0xb7) {
            return (1, prefix - 0x80, false);
        }
        if (prefix <= 0xbf) {
            uint256 dataLengthBytes = prefix - 0xb7;
            uint256 dataItemLength = _readUint256(data, offset + 1, dataLengthBytes);
            if (!(offset + 1 + dataLengthBytes + dataItemLength <= data.length)) {
                revert BlockhashInvalidBlockHeader();
            }
            return (1 + dataLengthBytes, dataItemLength, false);
        }
        if (prefix <= 0xf7) {
            return (1, prefix - 0xc0, true);
        }

        uint256 listLengthBytes = prefix - 0xf7;
        uint256 listItemLength = _readUint256(data, offset + 1, listLengthBytes);
        if (!(offset + 1 + listLengthBytes + listItemLength <= data.length)) {
            revert BlockhashInvalidBlockHeader();
        }
        return (1 + listLengthBytes, listItemLength, true);
    }

    function _itemLength(bytes memory data, uint256 offset) private pure returns (uint256) {
        (uint256 itemOffset, uint256 itemLength, ) = _decodeLength(data, offset);
        return itemOffset + itemLength;
    }

    function _readUint256(bytes memory data, uint256 offset, uint256 length) private pure returns (uint256 result) {
        if (!(length <= 32 && offset + length <= data.length)) {
            revert BlockhashInvalidBlockHeader();
        }

        for (uint256 i = 0; i < length; ++i) {
            result = (result << 8) | uint8(data[offset + i]);
        }
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
