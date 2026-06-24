// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {SafeCast} from "./math/SafeCast.sol";
import {Blockhash} from "./Blockhash.sol";
import {Memory} from "./Memory.sol";
import {RLP} from "./RLP.sol";

/// @dev Library for parsing and verifying RLP-encoded block headers.
library BlockHeader {
    using RLP for *;
    using SafeCast for *;

    /// @dev List of block header fields, in the order they are encoded in the block header RLP.
    enum HeaderField {
        ParentHash, // Since Frontier
        OmmersHash, // Since Frontier
        Coinbase, // Since Frontier
        StateRoot, // Since Frontier
        TransactionsRoot, // Since Frontier
        ReceiptsRoot, // Since Frontier
        LogsBloom, // Since Frontier
        Difficulty, // Since Frontier
        Number, // Since Frontier
        GasLimit, // Since Frontier
        GasUsed, // Since Frontier
        Timestamp, // Since Frontier
        ExtraData, // Since Frontier
        PrevRandao, // Since Frontier (called MixHash before Paris)
        Nonce, // Since Frontier
        BaseFeePerGas, // Since London
        WithdrawalsRoot, // Since Shanghai
        BlobGasUsed, // Since Cancun
        ExcessBlobGas, // Since Cancun
        ParentBeaconBlockRoot, // Since Cancun
        RequestsHash, // Since Prague
        BlockAccessListHash // Since Amsterdam
    }

    /// @dev Thrown when the provided block header RLP does not have the expected number of fields.
    /// Happens if it corresponds to an older version of the EVM that doesn't include the field.
    error FieldNotPresentInBlockHeader(HeaderField);

    /**
    * @dev Verifies that the given block header RLP corresponds to a valid block header for the current chain.
    *
    * NOTE: Blocks older than 8191 blocks ago are not available through {Blockhash.blockHash}
    */
    function verifyBlockHeader(bytes memory headerRLP) internal view returns (bool) {
        return verifyBlockHeader(parseHeader(headerRLP), headerRLP);
    }

    /**
     * @dev Decode the block header RLP into a list of field slices. Use this when reading multiple fields to avoid
     * decoding the RLP list more than once. The returned slices reference the input buffer, so it must not be mutated.
     */
    function parseHeader(bytes memory headerRLP) internal pure returns (Memory.Slice[] memory) {
        return RLP.decodeList(headerRLP);
    }

    /// @dev Extract the parent hash from the block header RLP.
    function getParentHash(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseSingle(headerRLP, HeaderField.ParentHash).readBytes32();
    }

    /// @dev Extract the ommers hash from the block header RLP. This is constant to keccak256(rlp([])) since EIP-3675 (Paris)
    function getOmmersHash(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseSingle(headerRLP, HeaderField.OmmersHash).readBytes32();
    }

    /// @dev Extract the coinbase (a.k.a. beneficiary or miner) address from the block header RLP.
    function getCoinbase(bytes memory headerRLP) internal pure returns (address) {
        return _parseSingle(headerRLP, HeaderField.Coinbase).readAddress();
    }

    /// @dev Extract the state root from the block header RLP.
    function getStateRoot(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseSingle(headerRLP, HeaderField.StateRoot).readBytes32();
    }

    /// @dev Extract the transactions root from the block header RLP.
    function getTransactionsRoot(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseSingle(headerRLP, HeaderField.TransactionsRoot).readBytes32();
    }

    /// @dev Extract the receipts root from the block header RLP.
    function getReceiptsRoot(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseSingle(headerRLP, HeaderField.ReceiptsRoot).readBytes32();
    }

    /// @dev Extract the logs bloom from the block header RLP.
    function getLogsBloom(bytes memory headerRLP) internal pure returns (bytes memory) {
        return _parseSingle(headerRLP, HeaderField.LogsBloom).readBytes();
    }

    /// @dev Extract the difficulty from the block header RLP. This is constant to 0 since EIP-3675 (Paris)
    function getDifficulty(bytes memory headerRLP) internal pure returns (uint256) {
        return _parseSingle(headerRLP, HeaderField.Difficulty).readUint256();
    }

    /// @dev Extract the block number from the block header RLP.
    function getNumber(bytes memory headerRLP) internal pure returns (uint256) {
        return _parseSingle(headerRLP, HeaderField.Number).readUint256();
    }

    /// @dev Extract the gas used from the block header RLP.
    function getGasUsed(bytes memory headerRLP) internal pure returns (uint256) {
        return _parseSingle(headerRLP, HeaderField.GasUsed).readUint256();
    }

    /// @dev Extract the gas limit from the block header RLP.
    function getGasLimit(bytes memory headerRLP) internal pure returns (uint256) {
        return _parseSingle(headerRLP, HeaderField.GasLimit).readUint256();
    }

    /// @dev Extract the timestamp from the block header RLP.
    function getTimestamp(bytes memory headerRLP) internal pure returns (uint256) {
        return _parseSingle(headerRLP, HeaderField.Timestamp).readUint256();
    }

    /// @dev Extract the extra data from the block header RLP.
    function getExtraData(bytes memory headerRLP) internal pure returns (bytes memory) {
        return _parseSingle(headerRLP, HeaderField.ExtraData).readBytes();
    }

    /// @dev Extract the prevRandao (a.k.a. mixHash before Paris) from the block header RLP.
    function getPrevRandao(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseSingle(headerRLP, HeaderField.PrevRandao).readBytes32();
    }

    /// @dev Extract the nonce from the block header RLP. This is constant to 0 since EIP-3675 (Paris)
    function getNonce(bytes memory headerRLP) internal pure returns (bytes8) {
        return bytes8(_parseSingle(headerRLP, HeaderField.Nonce).readUint256().toUint64());
    }

    /// @dev Extract the base fee per gas from the block header RLP. This was introduced in London.
    function getBaseFeePerGas(bytes memory headerRLP) internal pure returns (uint256) {
        return _parseSingle(headerRLP, HeaderField.BaseFeePerGas).readUint256();
    }

    /// @dev Extract the withdrawals root from the block header RLP. This was introduced in Shanghai.
    function getWithdrawalsRoot(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseSingle(headerRLP, HeaderField.WithdrawalsRoot).readBytes32();
    }

    /// @dev Extract the blob gas used from the block header RLP. This was introduced in Cancun.
    function getBlobGasUsed(bytes memory headerRLP) internal pure returns (uint64) {
        return _parseSingle(headerRLP, HeaderField.BlobGasUsed).readUint256().toUint64();
    }

    /// @dev Extract the excess blob gas from the block header RLP. This was introduced in Cancun.
    function getExcessBlobGas(bytes memory headerRLP) internal pure returns (uint64) {
        return _parseSingle(headerRLP, HeaderField.ExcessBlobGas).readUint256().toUint64();
    }

    /// @dev Extract the parent beacon block root from the block header RLP. This was introduced in Cancun.
    function getParentBeaconBlockRoot(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseSingle(headerRLP, HeaderField.ParentBeaconBlockRoot).readBytes32();
    }

    /// @dev Extract the requests hash from the block header RLP. This was introduced in Prague.
    function getRequestsHash(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseSingle(headerRLP, HeaderField.RequestsHash).readBytes32();
    }

    /// @dev Extract the block access list hash from the block header RLP. This will be introduced in Amsterdam.
    function getBlockAccessListHash(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseSingle(headerRLP, HeaderField.BlockAccessListHash).readBytes32();
    }

    /// @dev Variant of {verifyBlockHeader} that takes a pre-parsed list of fields.
    function verifyBlockHeader(Memory.Slice[] memory fields, bytes memory headerRLP) internal view returns (bool) {
        return Blockhash.blockHash(getNumber(fields)) == keccak256(headerRLP);
    }

    /// @dev Extract the parent hash from pre-parsed header fields.
    function getParentHash(Memory.Slice[] memory fields) internal pure returns (bytes32) {
        return _getField(fields, HeaderField.ParentHash).readBytes32();
    }

    /// @dev Extract the ommers hash from pre-parsed header fields.
    function getOmmersHash(Memory.Slice[] memory fields) internal pure returns (bytes32) {
        return _getField(fields, HeaderField.OmmersHash).readBytes32();
    }

    /// @dev Extract the coinbase from pre-parsed header fields.
    function getCoinbase(Memory.Slice[] memory fields) internal pure returns (address) {
        return _getField(fields, HeaderField.Coinbase).readAddress();
    }

    /// @dev Extract the state root from pre-parsed header fields.
    function getStateRoot(Memory.Slice[] memory fields) internal pure returns (bytes32) {
        return _getField(fields, HeaderField.StateRoot).readBytes32();
    }

    /// @dev Extract the transactions root from pre-parsed header fields.
    function getTransactionsRoot(Memory.Slice[] memory fields) internal pure returns (bytes32) {
        return _getField(fields, HeaderField.TransactionsRoot).readBytes32();
    }

    /// @dev Extract the receipts root from pre-parsed header fields.
    function getReceiptsRoot(Memory.Slice[] memory fields) internal pure returns (bytes32) {
        return _getField(fields, HeaderField.ReceiptsRoot).readBytes32();
    }

    /// @dev Extract the logs bloom from pre-parsed header fields.
    function getLogsBloom(Memory.Slice[] memory fields) internal pure returns (bytes memory) {
        return _getField(fields, HeaderField.LogsBloom).readBytes();
    }

    /// @dev Extract the difficulty from pre-parsed header fields.
    function getDifficulty(Memory.Slice[] memory fields) internal pure returns (uint256) {
        return _getField(fields, HeaderField.Difficulty).readUint256();
    }

    /// @dev Extract the block number from pre-parsed header fields.
    function getNumber(Memory.Slice[] memory fields) internal pure returns (uint256) {
        return _getField(fields, HeaderField.Number).readUint256();
    }

    /// @dev Extract the gas used from pre-parsed header fields.
    function getGasUsed(Memory.Slice[] memory fields) internal pure returns (uint256) {
        return _getField(fields, HeaderField.GasUsed).readUint256();
    }

    /// @dev Extract the gas limit from pre-parsed header fields.
    function getGasLimit(Memory.Slice[] memory fields) internal pure returns (uint256) {
        return _getField(fields, HeaderField.GasLimit).readUint256();
    }

    /// @dev Extract the timestamp from pre-parsed header fields.
    function getTimestamp(Memory.Slice[] memory fields) internal pure returns (uint256) {
        return _getField(fields, HeaderField.Timestamp).readUint256();
    }

    /// @dev Extract the extra data from pre-parsed header fields.
    function getExtraData(Memory.Slice[] memory fields) internal pure returns (bytes memory) {
        return _getField(fields, HeaderField.ExtraData).readBytes();
    }

    /// @dev Extract the prevRandao from pre-parsed header fields.
    function getPrevRandao(Memory.Slice[] memory fields) internal pure returns (bytes32) {
        return _getField(fields, HeaderField.PrevRandao).readBytes32();
    }

    /// @dev Extract the nonce from pre-parsed header fields.
    function getNonce(Memory.Slice[] memory fields) internal pure returns (bytes8) {
        return bytes8(_getField(fields, HeaderField.Nonce).readUint256().toUint64());
    }

    /// @dev Extract the base fee per gas from pre-parsed header fields.
    function getBaseFeePerGas(Memory.Slice[] memory fields) internal pure returns (uint256) {
        return _getField(fields, HeaderField.BaseFeePerGas).readUint256();
    }

    /// @dev Extract the withdrawals root from pre-parsed header fields.
    function getWithdrawalsRoot(Memory.Slice[] memory fields) internal pure returns (bytes32) {
        return _getField(fields, HeaderField.WithdrawalsRoot).readBytes32();
    }

    /// @dev Extract the blob gas used from pre-parsed header fields.
    function getBlobGasUsed(Memory.Slice[] memory fields) internal pure returns (uint64) {
        return _getField(fields, HeaderField.BlobGasUsed).readUint256().toUint64();
    }

    /// @dev Extract the excess blob gas from pre-parsed header fields.
    function getExcessBlobGas(Memory.Slice[] memory fields) internal pure returns (uint64) {
        return _getField(fields, HeaderField.ExcessBlobGas).readUint256().toUint64();
    }

    /// @dev Extract the parent beacon block root from pre-parsed header fields.
    function getParentBeaconBlockRoot(Memory.Slice[] memory fields) internal pure returns (bytes32) {
        return _getField(fields, HeaderField.ParentBeaconBlockRoot).readBytes32();
    }

    /// @dev Extract the requests hash from pre-parsed header fields.
    function getRequestsHash(Memory.Slice[] memory fields) internal pure returns (bytes32) {
        return _getField(fields, HeaderField.RequestsHash).readBytes32();
    }

    /// @dev Extract the block access list hash from pre-parsed header fields.
    function getBlockAccessListHash(Memory.Slice[] memory fields) internal pure returns (bytes32) {
        return _getField(fields, HeaderField.BlockAccessListHash).readBytes32();
    }

    /**
     * @dev Parse the header, extract a single field slice, then release the array memory. The returned slice still
     * references the original `headerRLP` buffer, so it remains valid after the FMP reset. Callers that read multiple
     * fields should use {parseHeader} once and call the {Memory-Slice} overloads instead.
     */
    function _parseSingle(bytes memory headerRLP, HeaderField field) private pure returns (Memory.Slice result) {
        Memory.Pointer fmp = Memory.getFreeMemoryPointer();
        result = _getField(parseHeader(headerRLP), field);
        Memory.unsafeSetFreeMemoryPointer(fmp);
    }

    /// @dev Look up a field slice by its position, reverting if the header is too old to include it.
    function _getField(Memory.Slice[] memory fields, HeaderField field) private pure returns (Memory.Slice) {
        require(uint8(field) < fields.length, FieldNotPresentInBlockHeader(field));
        return fields[uint8(field)];
    }
}
