// SPDX-License-Identifier:  MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SymTest} from "halmos-cheatcodes/SymTest.sol";
import {FixedSizeMemoryStack} from "../../contracts/utils/FixedSizeMemoryStack.sol";

contract FixedSizeMemoryStackTest is Test, SymTest {
    using FixedSizeMemoryStack for FixedSizeMemoryStack.Stack;

    function testFuzzPush(bytes32 item) public pure {
        FixedSizeMemoryStack.Stack memory stack = FixedSizeMemoryStack.init(10);
        stack.push(item);

        assertEq(stack._top, 1);
        assertEq(stack._data[0], item);
    }

    /// forge-config: default.allow_internal_expect_revert = true
    function testPop() public {
        FixedSizeMemoryStack.Stack memory stack = FixedSizeMemoryStack.init(10);

        vm.expectRevert((FixedSizeMemoryStack.StackUnderflow.selector));
        stack.pop();

        bytes32 item1 = svm.createBytes32("item1");
        bytes32 item2 = svm.createBytes32("item2");

        stack.push(item1);
        stack.push(item2);

        assertEq(stack.pop(), item2);
        assertEq(stack._top, 1);
        assertEq(stack.pop(), item1);
        assertEq(stack._top, 0);
    }

    /// forge-config: default.allow_internal_expect_revert = true
    function testPeekStackUnderflow() public {
        FixedSizeMemoryStack.Stack memory stack = FixedSizeMemoryStack.init(10);

        vm.expectRevert(abi.encodeWithSelector(FixedSizeMemoryStack.StackUnderflow.selector));
        stack.peek();
        assertEq(stack._top, 0);
    }

    function testPeek() public {
        FixedSizeMemoryStack.Stack memory stack = FixedSizeMemoryStack.init(10);

        stack.push(bytes32(uint256(1)));
        stack.push(bytes32(uint256(2)));

        assertEq(stack.peek(), bytes32(uint256(2)));
        assertEq(stack._top, 2);
    }

    function testSize() public {
        FixedSizeMemoryStack.Stack memory stack = FixedSizeMemoryStack.init(10);

        assertEq(stack.size(), 0);

        stack.push(bytes32(uint256(1)));
        assertEq(stack.size(), 1);

        stack.push(bytes32(uint256(2)));
        assertEq(stack.size(), 2);

        stack.pop();
        assertEq(stack.size(), 1);

        stack.pop();
        assertEq(stack.size(), 0);
    }

    function testCapacity() public {
        FixedSizeMemoryStack.Stack memory stack = FixedSizeMemoryStack.init(10);

        assertEq(stack.capacity(), 10);
    }

    function testIsEmpty() public {
        FixedSizeMemoryStack.Stack memory stack = FixedSizeMemoryStack.init(10);

        assertEq(stack.isEmpty(), true);

        stack.push(bytes32(uint256(1)));
        assertEq(stack.isEmpty(), false);

        stack.pop();
        assertEq(stack.isEmpty(), true);
    }

    function testIsFull() public {
        FixedSizeMemoryStack.Stack memory stack = FixedSizeMemoryStack.init(10);

        assertEq(stack.isFull(), false);

        stack.push(bytes32(uint256(1)));
        assertEq(stack.isFull(), false);

        for (uint256 i = 0; i < 9; i++) {
            stack.push(bytes32(uint256(i)));
        }

        assertEq(stack.isFull(), true);

        stack.pop();
        assertEq(stack.isFull(), false);
    }

    function testClear() public {
        FixedSizeMemoryStack.Stack memory stack = FixedSizeMemoryStack.init(10);

        stack.push(bytes32(uint256(1)));
        stack.push(bytes32(uint256(2)));

        stack.clear();

        assertEq(stack.size(), 0);
        assertEq(stack.isEmpty(), true);
        assertEq(stack.isFull(), false);
        assertEq(stack._top, 0);
    }
}
