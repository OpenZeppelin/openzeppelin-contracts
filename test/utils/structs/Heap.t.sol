// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Heap} from "@openzeppelin/contracts/utils/structs/Heap.sol";
import {Comparators} from "@openzeppelin/contracts/utils/Comparators.sol";

contract Uint256HeapTest is Test {
    using Heap for Heap.Uint256Heap;

    Heap.Uint256Heap internal heap;

    function _validateHeap(function(uint256, uint256) view returns (bool) comp) internal view {
        for (uint32 i = 1; i < heap.length(); ++i) {
            assertFalse(comp(heap.tree[i], heap.tree[(i - 1) / 2]));
        }
    }

    function testFuzz(uint256[] calldata input) public {
        vm.assume(input.length < 0x20);
        assertEq(heap.length(), 0);

        uint256 min = type(uint256).max;
        for (uint256 i = 0; i < input.length; ++i) {
            heap.insert(input[i]);
            assertEq(heap.length(), i + 1);
            _validateHeap(Comparators.lt);

            min = Math.min(min, input[i]);
            assertEq(heap.peek(), min);
        }

        uint256 max = 0;
        for (uint256 i = 0; i < input.length; ++i) {
            uint256 top = heap.peek();
            uint256 pop = heap.pop();
            assertEq(heap.length(), input.length - i - 1);
            _validateHeap(Comparators.lt);

            assertEq(pop, top);
            assertGe(pop, max);
            max = pop;
        }
    }

    function testFuzzGt(uint256[] calldata input) public {
        vm.assume(input.length < 0x20);
        assertEq(heap.length(), 0);

        uint256 max = 0;
        for (uint256 i = 0; i < input.length; ++i) {
            heap.insert(input[i], Comparators.gt);
            assertEq(heap.length(), i + 1);
            _validateHeap(Comparators.gt);

            max = Math.max(max, input[i]);
            assertEq(heap.peek(), max);
        }

        uint256 min = type(uint256).max;
        for (uint256 i = 0; i < input.length; ++i) {
            uint256 top = heap.peek();
            uint256 pop = heap.pop(Comparators.gt);
            assertEq(heap.length(), input.length - i - 1);
            _validateHeap(Comparators.gt);

            assertEq(pop, top);
            assertLe(pop, min);
            min = pop;
        }
    }
}
