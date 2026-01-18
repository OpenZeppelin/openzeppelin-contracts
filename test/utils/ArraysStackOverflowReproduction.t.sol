// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";

/**
 * @title Arrays Stack Overflow Reproduction Test
 * @notice This test file demonstrates the stack overflow issue with _quickSort()
 * @dev Based on GitHub issue #6289: https://github.com/OpenZeppelin/openzeppelin-contracts/issues/6289
 * 
 * The issue: _quickSort() is limited to ~169 items due to Solidity's 1024-word stack depth limit.
 * With worst-case input (reverse-sorted arrays), the recursion depth can reach O(n), causing stack overflow.
 * 
 * This file reproduces the issue and can be used to verify the fix.
 */
contract ArraysStackOverflowReproductionTest is Test {
    /**
     * @notice Test that demonstrates the current limitation
     * @dev This test should PASS with current implementation (169 items)
     *      but would FAIL with 170 items due to stack overflow
     */
    function test_CurrentImplementationLimitation() public pure {
        uint256 N = 169; // Current limit before stack overflow
        
        // Create a reverse-sorted array (worst case for quicksort)
        uint256[] memory array = new uint256[](N);
        for (uint256 i = 0; i < N; i++) {
            array[i] = 1000 - i; // Reverse sorted: [1000, 999, 998, ...]
        }
        
        // This should work with current implementation
        Arrays.sort(array);
        
        // Verify it's sorted correctly
        for (uint256 i = 1; i < N; i++) {
            assertLe(array[i - 1], array[i], "Array should be sorted");
        }
    }

    /**
     * @notice Test that demonstrates the stack overflow issue
     * @dev This test PASSES with the optimized implementation (after fix)
     *      With the OLD recursive implementation, this would FAIL with: EvmError: StackOverflow
     *      The fact that it passes proves the fix works!
     */
    function test_StackOverflowAt170() public pure {
        uint256 N = 170; // This would cause stack overflow with old implementation
        
        // Create a reverse-sorted array (worst case)
        uint256[] memory array = new uint256[](N);
        for (uint256 i = 0; i < N; i++) {
            array[i] = 1000 - i;
        }
        
        // With old implementation: This would fail with: EvmError: StackOverflow
        // With optimized implementation: This passes successfully!
        Arrays.sort(array);
        
        // Verify it's sorted correctly
        for (uint256 i = 1; i < N; i++) {
            assertLe(array[i - 1], array[i], "Array should be sorted");
        }
    }

    /**
     * @notice Test with larger array to show the fix works
     * @dev This test PASSES with the optimized implementation (after fix)
     *      With the OLD recursive implementation, this would FAIL with stack overflow
     */
    function test_LargerArrayShouldWorkAfterFix() public pure {
        uint256 N = 200; // Should work after optimization
        
        // Create a reverse-sorted array (worst case)
        uint256[] memory array = new uint256[](N);
        for (uint256 i = 0; i < N; i++) {
            array[i] = 10000 - i;
        }
        
        // After fix, this should work
        Arrays.sort(array);
        
        // Verify it's sorted correctly
        for (uint256 i = 1; i < N; i++) {
            assertLe(array[i - 1], array[i], "Array should be sorted");
        }
    }

    /**
     * @notice Test with even larger array to demonstrate the fix
     * @dev This test PASSES with the optimized implementation (after fix)
     *      With the OLD recursive implementation, this would FAIL with stack overflow
     */
    function test_VeryLargeArrayShouldWorkAfterFix() public pure {
        uint256 N = 1000; // Should work after optimization
        
        // Create a reverse-sorted array (worst case)
        uint256[] memory array = new uint256[](N);
        for (uint256 i = 0; i < N; i++) {
            array[i] = 100000 - i;
        }
        
        // After fix, this should work
        Arrays.sort(array);
        
        // Verify it's sorted correctly
        for (uint256 i = 1; i < N; i++) {
            assertLe(array[i - 1], array[i], "Array should be sorted");
        }
    }

    /**
     * @notice Test with already sorted array (best case, but still tests recursion)
     */
    function test_AlreadySortedArray() public pure {
        uint256 N = 200;
        
        // Create an already sorted array
        uint256[] memory array = new uint256[](N);
        for (uint256 i = 0; i < N; i++) {
            array[i] = i;
        }
        
        Arrays.sort(array);
        
        // Verify it's still sorted
        for (uint256 i = 1; i < N; i++) {
            assertLe(array[i - 1], array[i], "Array should be sorted");
        }
    }

    /**
     * @notice Test with random order array
     */
    function test_RandomOrderArray() public pure {
        uint256 N = 200;
        
        // Create an array with values in random order
        uint256[] memory array = new uint256[](N);
        for (uint256 i = 0; i < N; i++) {
            array[i] = (i * 7 + 13) % 1000; // Pseudo-random pattern
        }
        
        Arrays.sort(array);
        
        // Verify it's sorted correctly
        for (uint256 i = 1; i < N; i++) {
            assertLe(array[i - 1], array[i], "Array should be sorted");
        }
    }

    /**
     * @notice Gas comparison test (for benchmarking after fix)
     * @dev This test can be used to compare gas usage before/after optimization
     */
    function test_GasUsageComparison() public view {
        uint256 N = 169; // Current safe limit
        
        uint256[] memory array = new uint256[](N);
        for (uint256 i = 0; i < N; i++) {
            array[i] = 1000 - i; // Reverse sorted (worst case)
        }
        
        uint256 gasBefore = gasleft();
        Arrays.sort(array);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for sorting %d elements (reverse sorted):", N);
        console.log(gasUsed);
        
        // This test mainly serves as a benchmark
        // The actual gas usage will be logged
    }
}
