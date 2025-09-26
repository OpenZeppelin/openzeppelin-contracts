// SPDX-License-Identifier:  MIT
pragma solidity ^0.8.24;

/// @title FixedSizeMemoryStack
/// @notice A gas‑efficient, in‑memory, fixed‑capacity stack (first in, last out) for arbitrary 32‑byte values.
/// @dev
/// * Designed for algorithmic helpers (sorting, DFS/BFS, expression evaluation, etc.).
/// * **Not** suitable for persisting data between external calls – memory is transient.
/// * Functions are `internal`+`pure` so that the optimizer can aggressively inline them.
/// *
/// * The structure is designed to perform the following operations with the corresponding complexities:
/// * * push (insert a value onto the stack): O(1)
/// * * pop (remove the top value from the stack): O(1)
/// * * peek (return the top value from the stack): O(1)
/// * * size (return the number of elements in the stack): O(1)
/// * * capacity (return the maximum number of elements the stack can hold): O(1)
/// * * isEmpty (return whether the stack is empty): O(1)
/// * * isFull (return whether the stack is at full capacity): O(1)
/// * * clear (remove all elements from the stack): O(1)
library FixedSizeMemoryStack {
    /// @notice Pushed more items than the stack’s capacity.
    /// @param capacity  Maximum number of elements the stack can hold.
    error StackOverflow(uint256 capacity);

    /// @notice Popped or peeked when the stack was empty.
    error StackUnderflow();

    /// @notice Attempted to create a stack with zero capacity.
    error ZeroCapacity();

    struct Stack {
        bytes32[] _data; // pre‑allocated fixed‑length array
        uint256 _top; // next insertion index
    }

    /// @notice Initialise a new fixed‑size stack in memory.
    /// @param maxSize  The maximum number of elements the stack can hold (> 0).
    /// @return stack   A fully initialised, empty stack.
    function init(uint256 maxSize) internal pure returns (Stack memory stack) {
        if (maxSize == 0) revert ZeroCapacity();
        stack._data = new bytes32[](maxSize);
        stack._top = 0;
    }

    /// @notice Push a value onto the stack.
    /// @param stack  The stack to mutate (memory reference).
    /// @param value  The value to push.
    function push(Stack memory stack, bytes32 value) internal pure {
        uint256 t = stack._top;
        if (t >= stack._data.length) revert StackOverflow(stack._data.length);
        stack._data[t] = value;
        stack._top = t + 1;
    }

    /// @notice Pop the top value from the stack.
    /// @param stack  The stack to mutate (memory reference).
    /// @return value The element removed from the stack.
    function pop(Stack memory stack) internal pure returns (bytes32 value) {
        uint256 t = stack._top;
        if (t == 0) revert StackUnderflow();
        t -= 1;
        value = stack._data[t];
        stack._top = t;
    }

    /// @notice Return, but do **not** remove, the element on top of the stack.
    function peek(Stack memory stack) internal pure returns (bytes32 value) {
        uint256 t = stack._top;
        if (t == 0) revert StackUnderflow();
        value = stack._data[t - 1];
    }

    /// @notice Current number of stored elements.
    function size(Stack memory stack) internal pure returns (uint256) {
        return stack._top;
    }

    /// @notice Maximum number of elements the stack can hold.
    function capacity(Stack memory stack) internal pure returns (uint256) {
        return stack._data.length;
    }

    /// @notice Whether the stack currently holds zero elements.
    function isEmpty(Stack memory stack) internal pure returns (bool) {
        return stack._top == 0;
    }

    /// @notice Whether the stack is at full capacity.
    function isFull(Stack memory stack) internal pure returns (bool) {
        return stack._top == stack._data.length;
    }

    /// @notice Reset the stack to empty **without** reallocating memory.
    /// @dev Sets the logical size to zero; underlying array remains allocated.
    function clear(Stack memory stack) internal pure {
        stack._top = 0;
    }
}
