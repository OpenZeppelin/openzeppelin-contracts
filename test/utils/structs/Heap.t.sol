// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {Test} from "forge-std/Test.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";
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

// Without fail-on-revert, failing handler asserts and unexpected Heap reverts are discarded and the run passes.
/// forge-config: default.invariant.runs = 256
/// forge-config: default.invariant.fail-on-revert = true
contract Uint256HeapInvariantTest is Test {
    using Heap for Heap.Uint256Heap;

    Heap.Uint256Heap internal heap;
    uint256[] internal values;

    function setUp() public {
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = this.insert.selector;
        selectors[1] = this.pop.selector;
        selectors[2] = this.replace.selector;
        selectors[3] = this.clear.selector;

        targetContract(address(this));
        targetSelector(FuzzSelector(address(this), selectors));
    }

    function insert(uint256 value) external {
        heap.insert(value, _comp);
        values.push(value);
    }

    function pop() external {
        if (values.length == 0) return;
        assertEq(heap.pop(_comp), _removeTop());
    }

    function replace(uint256 value) external {
        if (values.length == 0) return;
        assertEq(heap.replace(value, _comp), _removeTop());
        values.push(value);
    }

    function clear(uint256 seed) external {
        // Clear on 1 in 16 calls only, so the heap grows deep enough to exercise sifts across a few levels. The seed
        // is hashed because the fuzzer favours edge values (0, powers of 2) that would make `seed % 16 == 0` common.
        if (uint256(keccak256(abi.encode(seed))) % 16 != 0) return;
        heap.clear();
        delete values;
    }

    // solhint-disable-next-line func-name-mixedcase
    function invariant_heapProperty() external view {
        for (uint32 i = 1; i < heap.length(); ++i) {
            assertFalse(_comp(heap.tree[i], heap.tree[(i - 1) / 2]));
        }
    }

    // solhint-disable-next-line func-name-mixedcase
    function invariant_matchesModel() external view {
        assertEq(heap.length(), values.length);
        if (values.length > 0) assertEq(heap.peek(), values[_topIndex()]);
        assertEq(Arrays.sort(heap.tree), Arrays.sort(values));
    }

    function _comp(uint256 a, uint256 b) internal pure virtual returns (bool) {
        return Comparators.lt(a, b);
    }

    function _topIndex() private view returns (uint256 index) {
        for (uint256 i = 1; i < values.length; ++i) {
            if (_comp(values[i], values[index])) index = i;
        }
    }

    function _removeTop() private returns (uint256 top) {
        uint256 index = _topIndex();
        top = values[index];
        values[index] = values[values.length - 1];
        values.pop();
    }
}

// Without fail-on-revert, failing handler asserts and unexpected Heap reverts are discarded and the run passes.
/// forge-config: default.invariant.runs = 256
/// forge-config: default.invariant.fail-on-revert = true
contract Uint256HeapGtInvariantTest is Uint256HeapInvariantTest {
    function _comp(uint256 a, uint256 b) internal pure override returns (bool) {
        return Comparators.gt(a, b);
    }
}
