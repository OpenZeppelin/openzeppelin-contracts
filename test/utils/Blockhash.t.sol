// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Blockhash} from "../../contracts/utils/Blockhash.sol";

contract BlockhashTest is Test {
    uint256 internal startingBlock;

    address internal constant SYSTEM_ADDRESS = 0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE;

    // See https://eips.ethereum.org/EIPS/eip-2935#bytecode
    // Generated using https://www.evm.codes/playground
    bytes private constant HISTORY_STORAGE_BYTECODE =
        hex"3373fffffffffffffffffffffffffffffffffffffffe14604657602036036042575f35600143038111604257611fff81430311604257611fff9006545f5260205ff35b5f5ffd5b5f35611fff60014303065500";

    function setUp() public {
        vm.roll(block.number + 100);

        startingBlock = block.number;
        vm.etch(Blockhash.HISTORY_STORAGE_ADDRESS, HISTORY_STORAGE_BYTECODE);
    }

    function testFuzzRecentBlocks(uint8 offset, uint64 currentBlock, bytes32 expectedHash) public {
        // Recent blocks (1-256 blocks old)
        uint256 boundedOffset = uint256(offset) + 1;
        vm.assume(currentBlock > boundedOffset);
        vm.roll(currentBlock);

        uint256 targetBlock = currentBlock - boundedOffset;
        vm.setBlockhash(targetBlock, expectedHash);

        bytes32 result = Blockhash.blockHash(targetBlock);
        assertEq(result, blockhash(targetBlock));
        assertEq(result, expectedHash);
    }

    function testFuzzHistoryBlocks(uint16 offset, uint256 currentBlock, bytes32 expectedHash) public {
        // History blocks (257-8191 blocks old)
        offset = uint16(bound(offset, 257, 8191));
        vm.assume(currentBlock > offset);
        vm.roll(currentBlock);

        uint256 targetBlock = currentBlock - offset;
        _setHistoryBlockhash(targetBlock, expectedHash);

        bytes32 result = Blockhash.blockHash(targetBlock);
        (bool success, bytes memory returndata) = Blockhash.HISTORY_STORAGE_ADDRESS.staticcall(
            abi.encodePacked(bytes32(targetBlock))
        );
        assertTrue(success);
        assertEq(result, abi.decode(returndata, (bytes32)));
        assertEq(result, expectedHash);
    }

    function testFuzzVeryOldBlocks(uint256 offset, uint256 currentBlock) public {
        // Very old blocks (>8191 blocks old)
        offset = bound(offset, 8192, type(uint256).max);
        vm.assume(currentBlock > offset);
        vm.roll(currentBlock);

        uint256 targetBlock = currentBlock - offset;
        bytes32 result = Blockhash.blockHash(targetBlock);
        assertEq(result, bytes32(0));
    }

    function testFuzzFutureBlocks(uint256 offset, uint256 currentBlock) public {
        // Future blocks
        offset = bound(offset, 1, type(uint256).max);
        vm.roll(currentBlock);

        unchecked {
            uint256 targetBlock = currentBlock + offset;
            bytes32 result = Blockhash.blockHash(targetBlock);
            assertEq(result, blockhash(targetBlock));
        }
    }

    function testUnsupportedChainsReturnZeroWhenOutOfRange() public {
        vm.etch(Blockhash.HISTORY_STORAGE_ADDRESS, hex"");

        vm.roll(block.number + 1000);
        assertEq(Blockhash.blockHash(block.number - 1000), bytes32(0));
    }

    function _setHistoryBlockhash(bytes32 blockHash) internal {
        _setHistoryBlockhash(block.number, blockHash);
    }

    function _setHistoryBlockhash(uint256 blockNumber, bytes32 blockHash) internal {
        // Subtracting 1 due to bug encountered during coverage
        uint256 currentBlock = block.number - 1;
        vm.assume(blockNumber < type(uint256).max);
        vm.roll(blockNumber + 1); // roll to the next block so the storage contract sets the parent's blockhash
        vm.prank(SYSTEM_ADDRESS);
        (bool success, ) = Blockhash.HISTORY_STORAGE_ADDRESS.call(abi.encode(blockHash)); // set parent's blockhash
        assertTrue(success);
        vm.roll(currentBlock + 1);
    }
}
