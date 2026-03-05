// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {SafeCast} from "./math/SafeCast.sol";
import {Blockhash} from "./Blockhash.sol";
import {Memory} from "./Memory.sol";
import {RLP} from "./RLP.sol";

/// @dev Library for parsing and verifying RLP-encoded block headers.
library BlockHeader {
    using SafeCast for *;
    using RLP for *;

    /// @dev List of evm versions.
    enum Hardforks {
        Frontier,
        Homestead,
        DAO,
        TangerineWhistle,
        SpuriousDragon,
        Byzantium,
        Constantinople,
        Petersburg,
        Istanbul,
        Berlin,
        London,
        Paris,
        Shanghai,
        Cancun,
        Prague,
        Osaka,
        Amsterdam
    }

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

    /// @dev Thrown when the provided block header RLP does not have the expected number of fields for the given hardfork version.
    error InvalidBlockHeader(Hardforks expectedVersion);

    /// @dev Verifies that the given block header RLP corresponds to a valid block header for the current chain.
    function verifyBlockHeader(bytes memory headerRLP) internal view returns (bool) {
        return Blockhash.blockHash(getNumber(headerRLP)) == keccak256(headerRLP);
    }

    /// @dev Extract the parent hash from the block header RLP.
    function getParentHash(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseHeader(headerRLP, HeaderField.ParentHash, Hardforks.Frontier).readBytes32();
    }

    /// @dev Extract the ommers hash from the block header RLP. This is constant to keccak256(rlp([])) since EIP-3675 (Paris)
    function getOmmersHash(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseHeader(headerRLP, HeaderField.OmmersHash, Hardforks.Frontier).readBytes32();
    }

    /// @dev Extract the coinbase (a.k.a. beneficiary or miner) address from the block header RLP.
    function getCoinbase(bytes memory headerRLP) internal pure returns (address) {
        return _parseHeader(headerRLP, HeaderField.Coinbase, Hardforks.Frontier).readAddress();
    }

    /// @dev Extract the state root from the block header RLP.
    function getStateRoot(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseHeader(headerRLP, HeaderField.StateRoot, Hardforks.Frontier).readBytes32();
    }

    /// @dev Extract the transactions root from the block header RLP.
    function getTransactionsRoot(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseHeader(headerRLP, HeaderField.TransactionsRoot, Hardforks.Frontier).readBytes32();
    }

    /// @dev Extract the receipts root from the block header RLP.
    function getReceiptsRoot(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseHeader(headerRLP, HeaderField.ReceiptsRoot, Hardforks.Frontier).readBytes32();
    }

    /// @dev Extract the logs bloom from the block header RLP.
    function getLogsBloom(bytes memory headerRLP) internal pure returns (bytes memory) {
        return _parseHeader(headerRLP, HeaderField.LogsBloom, Hardforks.Frontier).readBytes();
    }

    /// @dev Extract the difficulty from the block header RLP. This is constant to 0 since EIP-3675 (Paris)
    function getDifficulty(bytes memory headerRLP) internal pure returns (uint256) {
        return _parseHeader(headerRLP, HeaderField.Difficulty, Hardforks.Frontier).readUint256();
    }

    /// @dev Extract the block number from the block header RLP.
    function getNumber(bytes memory headerRLP) internal pure returns (uint256) {
        return _parseHeader(headerRLP, HeaderField.Number, Hardforks.Frontier).readUint256();
    }

    /// @dev Extract the gas used from the block header RLP.
    function getGasUsed(bytes memory headerRLP) internal pure returns (uint256) {
        return _parseHeader(headerRLP, HeaderField.GasUsed, Hardforks.Frontier).readUint256();
    }

    /// @dev Extract the gas limit from the block header RLP.
    function getGasLimit(bytes memory headerRLP) internal pure returns (uint256) {
        return _parseHeader(headerRLP, HeaderField.GasLimit, Hardforks.Frontier).readUint256();
    }

    /// @dev Extract the timestamp from the block header RLP.
    function getTimestamp(bytes memory headerRLP) internal pure returns (uint256) {
        return _parseHeader(headerRLP, HeaderField.Timestamp, Hardforks.Frontier).readUint256();
    }

    /// @dev Extract the extra data from the block header RLP.
    function getExtraData(bytes memory headerRLP) internal pure returns (bytes memory) {
        return _parseHeader(headerRLP, HeaderField.ExtraData, Hardforks.Frontier).readBytes();
    }

    /// @dev Extract the prevRandao (a.k.a. mixHash before Paris) from the block header RLP.
    function getPrevRandao(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseHeader(headerRLP, HeaderField.PrevRandao, Hardforks.Frontier).readBytes32();
    }

    /// @dev Extract the nonce from the block header RLP. This is constant to 0 since EIP-3675 (Paris)
    function getNonce(bytes memory headerRLP) internal pure returns (bytes8) {
        return bytes8(_parseHeader(headerRLP, HeaderField.Nonce, Hardforks.Frontier).readUint256().toUint64());
    }

    /// @dev Extract the base fee per gas from the block header RLP. This was introduced in London.
    function getBaseFeePerGas(bytes memory headerRLP) internal pure returns (uint256) {
        return _parseHeader(headerRLP, HeaderField.BaseFeePerGas, Hardforks.London).readUint256();
    }

    /// @dev Extract the withdrawals root from the block header RLP. This was introduced in Shanghai.
    function getWithdrawalsRoot(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseHeader(headerRLP, HeaderField.WithdrawalsRoot, Hardforks.Shanghai).readBytes32();
    }

    /// @dev Extract the blob gas used from the block header RLP. This was introduced in Cancun.
    function getBlobGasUsed(bytes memory headerRLP) internal pure returns (uint64) {
        return _parseHeader(headerRLP, HeaderField.BlobGasUsed, Hardforks.Cancun).readUint256().toUint64();
    }

    /// @dev Extract the excess blob gas from the block header RLP. This was introduced in Cancun.
    function getExcessBlobGas(bytes memory headerRLP) internal pure returns (uint64) {
        return _parseHeader(headerRLP, HeaderField.ExcessBlobGas, Hardforks.Cancun).readUint256().toUint64();
    }

    /// @dev Extract the parent beacon block root from the block header RLP. This was introduced in Cancun.
    function getParentBeaconBlockRoot(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseHeader(headerRLP, HeaderField.ParentBeaconBlockRoot, Hardforks.Cancun).readBytes32();
    }

    /// @dev Extract the requests hash from the block header RLP. This was introduced in Prague.
    function getRequestsHash(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseHeader(headerRLP, HeaderField.RequestsHash, Hardforks.Prague).readBytes32();
    }

    /// @dev Extract the block access list hash from the block header RLP. This will be introduced in Amsterdam.
    function getBlockAccessListHash(bytes memory headerRLP) internal pure returns (bytes32) {
        return _parseHeader(headerRLP, HeaderField.BlockAccessListHash, Hardforks.Amsterdam).readBytes32();
    }

    /// @dev Internal function to parse the block header RLP and return the list of fields as memory slices.
    /// It also checks that the number of fields is at least the expected number for the given hardfork version.
    function _parseHeader(
        bytes memory headerRLP,
        HeaderField field,
        Hardforks version
    ) private pure returns (Memory.Slice) {
        Memory.Slice[] memory fields = RLP.decodeList(headerRLP);
        require(uint8(field) < fields.length, InvalidBlockHeader(version));
        return fields[uint8(field)];
    }
}
