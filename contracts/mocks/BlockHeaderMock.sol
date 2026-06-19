// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {BlockHeader} from "../utils/BlockHeader.sol";
import {Memory} from "../utils/Memory.sol";

/// @dev Exercises the pre-parsed (`Memory.Slice[]`) overloads of {BlockHeader} in a single call.
/// `Memory.Slice` carries a call-frame-local memory pointer, so the parse and the reads must
/// happen within the same external call.
contract BlockHeaderMultiReadMock {
    struct MultiRead {
        bytes32 parentHash;
        bytes32 ommersHash;
        address coinbase;
        bytes32 stateRoot;
        bytes32 transactionsRoot;
        bytes32 receiptsRoot;
        bytes logsBloom;
        uint256 difficulty;
        uint256 number;
        uint256 gasLimit;
        uint256 gasUsed;
        uint256 timestamp;
        bytes extraData;
        bytes32 prevRandao;
        bytes8 nonce;
        uint256 baseFeePerGas;
        bytes32 withdrawalsRoot;
        uint64 blobGasUsed;
        uint64 excessBlobGas;
        bytes32 parentBeaconBlockRoot;
        bytes32 requestsHash;
        bool verified;
    }

    function multiRead(bytes memory headerRLP) external view returns (MultiRead memory result) {
        Memory.Slice[] memory fields = BlockHeader.parseHeader(headerRLP);
        result.parentHash = BlockHeader.getParentHash(fields);
        result.ommersHash = BlockHeader.getOmmersHash(fields);
        result.coinbase = BlockHeader.getCoinbase(fields);
        result.stateRoot = BlockHeader.getStateRoot(fields);
        result.transactionsRoot = BlockHeader.getTransactionsRoot(fields);
        result.receiptsRoot = BlockHeader.getReceiptsRoot(fields);
        result.logsBloom = BlockHeader.getLogsBloom(fields);
        result.difficulty = BlockHeader.getDifficulty(fields);
        result.number = BlockHeader.getNumber(fields);
        result.gasLimit = BlockHeader.getGasLimit(fields);
        result.gasUsed = BlockHeader.getGasUsed(fields);
        result.timestamp = BlockHeader.getTimestamp(fields);
        result.extraData = BlockHeader.getExtraData(fields);
        result.prevRandao = BlockHeader.getPrevRandao(fields);
        result.nonce = BlockHeader.getNonce(fields);
        result.baseFeePerGas = BlockHeader.getBaseFeePerGas(fields);
        result.withdrawalsRoot = BlockHeader.getWithdrawalsRoot(fields);
        result.blobGasUsed = BlockHeader.getBlobGasUsed(fields);
        result.excessBlobGas = BlockHeader.getExcessBlobGas(fields);
        result.parentBeaconBlockRoot = BlockHeader.getParentBeaconBlockRoot(fields);
        result.requestsHash = BlockHeader.getRequestsHash(fields);
        result.verified = BlockHeader.verifyBlockHeader(fields, headerRLP);
    }
}
