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

contract HeapHandler {
    using Heap for Heap.Uint256Heap;

    uint256 internal constant MAX_SIZE = 32;

    Heap.Uint256Heap internal _heap;
    uint256[] internal _model;
    bool internal immutable _isMaxHeap;

    constructor(bool isMaxHeap_) {
        _isMaxHeap = isMaxHeap_;
    }

    function insert(uint256 value) external {
        if (_model.length >= MAX_SIZE) return;

        if (_isMaxHeap) {
            _heap.insert(value, Comparators.gt);
        } else {
            _heap.insert(value);
        }
        _model.push(value);
    }

    function pop() external {
        if (_model.length == 0) return;

        uint256 expected = root();
        uint256 removed = _isMaxHeap ? _heap.pop(Comparators.gt) : _heap.pop();
        if (removed != expected) revert("unexpected pop");
        _removeFirst(expected);
    }

    function replace(uint256 newValue) external {
        if (_model.length == 0) return;

        uint256 expected = root();
        uint256 replaced = _isMaxHeap ? _heap.replace(newValue, Comparators.gt) : _heap.replace(newValue);
        if (replaced != expected) revert("unexpected replace");
        _removeFirst(expected);
        _model.push(newValue);
    }

    function clear() external {
        _heap.clear();
        delete _model;
    }

    function root() public view returns (uint256 candidate) {
        candidate = _model[0];
        for (uint256 i = 1; i < _model.length; ++i) {
            candidate = _isMaxHeap ? Math.max(candidate, _model[i]) : Math.min(candidate, _model[i]);
        }
    }

    function length() external view returns (uint256) {
        return _heap.length();
    }

    function modelLength() external view returns (uint256) {
        return _model.length;
    }

    function peek() external view returns (uint256) {
        return _heap.peek();
    }

    function treeValue(uint256 index) external view returns (uint256) {
        return _heap.tree[index];
    }

    function validateHeapInvariant() external view returns (bool) {
        for (uint256 i = 1; i < _heap.length(); ++i) {
            uint256 child = _heap.tree[i];
            uint256 parent = _heap.tree[(i - 1) / 2];
            if (_isMaxHeap) {
                if (Comparators.gt(child, parent)) return false;
            } else {
                if (Comparators.lt(child, parent)) return false;
            }
        }
        return true;
    }

    function _removeFirst(uint256 value) internal {
        for (uint256 i = 0; i < _model.length; ++i) {
            if (_model[i] == value) {
                _model[i] = _model[_model.length - 1];
                _model.pop();
                return;
            }
        }
        revert("value not found");
    }
}

contract Uint256HeapInvariantTest is Test {
    HeapHandler private _handler;

    function setUp() external {
        _handler = new HeapHandler(false);

        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = HeapHandler.insert.selector;
        selectors[1] = HeapHandler.pop.selector;
        selectors[2] = HeapHandler.replace.selector;
        selectors[3] = HeapHandler.clear.selector;

        targetContract(address(_handler));
        targetSelector(FuzzSelector(address(_handler), selectors));
    }

    function invariant_heapPropertyHolds() external view {
        assertTrue(_handler.validateHeapInvariant());
    }

    function invariant_lengthMatchesModel() external view {
        assertEq(_handler.length(), _handler.modelLength());
    }

    function invariant_peekMatchesModelMinimum() external view {
        if (_handler.modelLength() == 0) return;
        assertEq(_handler.peek(), _handler.root());
    }
}

contract Uint256HeapInvariantGtTest is Test {
    HeapHandler private _handler;

    function setUp() external {
        _handler = new HeapHandler(true);

        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = HeapHandler.insert.selector;
        selectors[1] = HeapHandler.pop.selector;
        selectors[2] = HeapHandler.replace.selector;
        selectors[3] = HeapHandler.clear.selector;

        targetContract(address(_handler));
        targetSelector(FuzzSelector(address(_handler), selectors));
    }

    function invariant_heapPropertyHoldsGt() external view {
        assertTrue(_handler.validateHeapInvariant());
    }

    function invariant_lengthMatchesModelGt() external view {
        assertEq(_handler.length(), _handler.modelLength());
    }

    function invariant_peekMatchesModelMaximum() external view {
        if (_handler.modelLength() == 0) return;
        assertEq(_handler.peek(), _handler.root());
    }
}
