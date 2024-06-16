// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Heaps} from "@openzeppelin/contracts/utils/structs/Heaps.sol";
import {Comparators} from "@openzeppelin/contracts/utils/Comparators.sol";

contract HeapTest is Test {
    using Heaps for *;

    Heaps.Heap internal heap;

    function _validateHeap(function(uint256, uint256) view returns (bool) comp) internal {
        for (uint32 i = 0; i < heap.size(); ++i) {
            // lookups
            assertEq(i, heap.data[heap.data[i].index].lookup);

            // ordering: each node has a value bigger then its parent
            if (i > 0)
                assertFalse(comp(heap.data[heap.data[i].index].value, heap.data[heap.data[(i - 1) / 2].index].value));
        }
    }

    function testUnit() public {
        // <empty>
        assertEq(heap.size(), 0);
        _validateHeap(Comparators.lt);

        heap.insert(712); // 712
        assertEq(heap.size(), 1);
        _validateHeap(Comparators.lt);

        heap.insert(20); // 20, 712
        assertEq(heap.size(), 2);
        _validateHeap(Comparators.lt);

        heap.insert(4337); // 20, 712, 4337
        assertEq(heap.size(), 3);
        _validateHeap(Comparators.lt);

        assertEq(heap.pop(), 20); // 712, 4337
        assertEq(heap.size(), 2);
        _validateHeap(Comparators.lt);

        heap.insert(1559); // 712, 1559, 4337
        assertEq(heap.size(), 3);
        _validateHeap(Comparators.lt);

        heap.insert(155); // 155, 712, 1559, 4337
        assertEq(heap.size(), 4);
        _validateHeap(Comparators.lt);

        heap.insert(7702); // 155, 712, 1559, 4337, 7702
        assertEq(heap.size(), 5);
        _validateHeap(Comparators.lt);

        assertEq(heap.pop(), 155); // 712, 1559, 4337, 7702
        assertEq(heap.size(), 4);
        _validateHeap(Comparators.lt);

        heap.insert(721); // 712, 721, 1559, 4337, 7702
        assertEq(heap.size(), 5);
        _validateHeap(Comparators.lt);

        assertEq(heap.pop(), 712); // 721, 1559, 4337, 7702
        assertEq(heap.size(), 4);
        _validateHeap(Comparators.lt);

        assertEq(heap.pop(), 721); // 1559, 4337, 7702
        assertEq(heap.size(), 3);
        _validateHeap(Comparators.lt);

        assertEq(heap.pop(), 1559); // 4337, 7702
        assertEq(heap.size(), 2);
        _validateHeap(Comparators.lt);

        assertEq(heap.pop(), 4337); // 7702
        assertEq(heap.size(), 1);
        _validateHeap(Comparators.lt);

        assertEq(heap.pop(), 7702); // <empty>
        assertEq(heap.size(), 0);
        _validateHeap(Comparators.lt);
    }

    function testFuzz(uint256[] calldata input) public {
        vm.assume(input.length < 0x20);

        uint256 min = type(uint256).max;
        for (uint256 i; i < input.length; ++i) {
            heap.insert(input[i]);
            _validateHeap(Comparators.lt);

            min = Math.min(min, input[i]);
            assertEq(heap.top(), min);
        }

        uint256 max = 0;
        for (uint256 i; i < input.length; ++i) {
            uint256 top = heap.top();
            uint256 pop = heap.pop();
            _validateHeap(Comparators.lt);

            assertEq(pop, top);
            assertGe(pop, max);
            max = pop;
        }
    }

    function testFuzzGt(uint256[] calldata input) public {
        vm.assume(input.length < 0x20);

        uint256 max = 0;
        for (uint256 i; i < input.length; ++i) {
            heap.insert(input[i], Comparators.gt);
            _validateHeap(Comparators.gt);

            max = Math.max(max, input[i]);
            assertEq(heap.top(), max);
        }

        uint256 min = type(uint256).max;
        for (uint256 i; i < input.length; ++i) {
            uint256 top = heap.top();
            uint256 pop = heap.pop(Comparators.gt);
            _validateHeap(Comparators.gt);

            assertEq(pop, top);
            assertLe(pop, min);
            min = pop;
        }
    }
}
