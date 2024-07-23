const format = require('../format-lines');
const { TYPES } = require('./Heap.opts');

/* eslint-disable max-len */
const header = `\
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Heap} from "@openzeppelin/contracts/utils/structs/Heap.sol";
import {Comparators} from "@openzeppelin/contracts/utils/Comparators.sol";
`;

const generate = ({ struct, valueType }) => `\
contract ${struct}Test is Test {
    using Heap for Heap.${struct};

    Heap.${struct} internal heap;

    function _validateHeap(function(uint256, uint256) view returns (bool) comp) internal {
        for (uint32 i = 0; i < heap.length(); ++i) {
            // lookups
            assertEq(i, heap.data[heap.data[i].index].lookup);
            assertEq(i, heap.data[heap.data[i].lookup].index);

            // ordering: each node has a value bigger then its parent
            if (i > 0)
                assertFalse(comp(heap.data[heap.data[i].index].value, heap.data[heap.data[(i - 1) / 2].index].value));
        }
    }

    function testFuzz(${valueType}[] calldata input) public {
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
            ${valueType} top = heap.peek();
            ${valueType} pop = heap.pop();
            assertEq(heap.length(), input.length - i - 1);
            _validateHeap(Comparators.lt);

            assertEq(pop, top);
            assertGe(pop, max);
            max = pop;
        }
    }

    function testFuzzGt(${valueType}[] calldata input) public {
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
            ${valueType} top = heap.peek();
            ${valueType} pop = heap.pop(Comparators.gt);
            assertEq(heap.length(), input.length - i - 1);
            _validateHeap(Comparators.gt);

            assertEq(pop, top);
            assertLe(pop, min);
            min = pop;
        }
    }
}
`;

// GENERATE
module.exports = format(header, ...TYPES.map(type => generate(type)));
