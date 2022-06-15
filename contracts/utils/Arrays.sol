// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Arrays.sol)

pragma solidity ^0.8.0;

import "./math/Math.sol";

/**
 * @dev Collection of functions related to array types.
 */
library Arrays {
    /**
     * @dev Searches a sorted `array` and returns the first index that contains
     * a value greater or equal to `element`. If no such index exists (i.e. all
     * values in the array are strictly less than `element`), the array length is
     * returned. Time complexity O(log n).
     *
     * `array` is expected to be sorted in ascending order, and to contain no
     * repeated elements.
     */
    function findUpperBound(uint256[] storage array, uint256 element) internal view returns (uint256) {
        if (array.length == 0) {
            return 0;
        }

        uint256 low = 0;
        uint256 high = array.length;

        while (low < high) {
            uint256 mid = Math.average(low, high);

            // Note that mid will always be strictly less than high (i.e. it will be a valid array index)
            // because Math.average rounds down (it does integer division with truncation).
            if (array[mid] > element) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        // At this point `low` is the exclusive upper bound. We will return the inclusive upper bound.
        if (low > 0 && array[low - 1] == element) {
            return low - 1;
        } else {
            return low;
        }
    }
    
    
    /*
    * @title: Array Sorter.
    * @author: Anthony (fps) https://github.com/fps8k.
    * @dev:
    * This library has two main functions that take an array [unordered, mostly] as an argument.
    * It sorts the array in ascending or descending order, depending on the user's choice.
    * Then returns the new array created from the old array.
    *
    * [GAS USAGE]
    * This gas test was done with a constant unordered array of 8 elements.
    * Ascending: ~ 152696 gas.
    * Descending: ~ 125730 gas.
    *
    * Function sortAsc (Sort Ascending).
    * It takes in an array of numbers, runs some checks and passes it as an argumant to the function _sortAsc().
    * The called function [_sortAsc()] arranges the array elements from lowest to highest.
    * This returns the ordered array returned by the _sortAsc() function.
    * This uses ~ 152696 gas.
    *
    * @param:
    * uint256[] _array -> Array to be sorted.
    *
    * @return
    * uint256[] -> Array (memory) to be assigned to the desired storage array variable.
    */
    function sortAsc(uint256[] storage _array) internal returns(uint256[] memory)
    {
        // Makes sure that the length of the array is > 0.
        require (_array.length > 0, "0 Length Array!");

        // If array length > 1, it calls the sorting function.
        if (_array.length > 1)
            // This function sorts the array and returns the ordered array.
            return _sortAsc(_array);

        // If array length == 1, it should return the array and stop executing [There is nothing to sort].
        return _array;
    }


    /*
    * @dev
    * [Ref line 24] :: Arranges the function from lowest to highest.
    *
    * @param:
    * uint256[] _array -> Array to be sorted, passed from sortAsc().
    *
    * @return
    * uint256[] -> ordered arrray.
    */
    function _sortAsc(uint256[] storage _array) private returns(uint256[] memory)
    {
        // In this function block, the length of the array is >= 2 [ref line 40].
        /*
        * @notice
        * The first element of the array is taken and assigned to the min variable.
        * The min variable is compared with each subsequent individual element in the array.
        * If min is >= the element, the element becomes the new min variable value and the index of the element is recorded.
        * At the end of the comparison, the min variable is recorded, and replaced by the last element, and the array is popped [_array.pop()].
        * The current min value is pushed to a new array which has already been created to memory.
        * The length of the new array is such to ensure that:
        *
        * uint256[] memory new_array = new uint256[](len);
        *
        * Where len is the length of the array we want to sort.
        * At the end of the loop, (when the length of the array to be sorted is == 1), the last element is pushed to the last index of the new array.
        * The new array is returned.
        */

        // Length of the array to be sorted.
        uint256 len = _array.length;
        // New array to be returned.
        uint256[] memory new_array = new uint256[](len);
        // Index for the new array.
        uint256 index;
        // Loop until the length of the array to be sorted becomes 1.
        while (len > 0)
        {
            // This holds the current minimum value in the array; whenever the array is popped and the loop is to repeat.
            uint256 min = _array[0];
            // Counter that resets on each loop to hold the index of the current min value.
            uint256 counter = 0;   
            
            // If the length of the array is now one, it should simply copy the only element to the new array.
            if (len == 1)
            {
                // Set the last index of the new array to the only element in the current lone array.
                new_array[index] = min;
            }
            else
            {
                // This should compare the current min value to all the elements in the array to ascertain the minimum value.
                for (uint j = 1; j < len; j++)
                {
                    // If the current minimum value is greater than any element in the array, then a new minimum value is found.
                    if (min >= _array[j])
                    {
                        // Reassign the minimum value.
                        min = _array[j];
                        // Grab the index of the current minimum value.
                        counter = j;
                    }
                }

                // Append the minimum value to the current index of the new array.
                new_array[index] = min;
                // Replace the element at that index in the array that is being sorted with the last element.
                // This will remove that element, because it has been recorded.
                // This is done so that the length of the array will reduce.
                _array[counter] = _array[len - 1];
                // Pop the array that is being sorted.
                // Because the last element was used to replace the current minimum value element, nothing is lost.
                _array.pop();
            }

            // Increment the index.
            index++;
            // Reduce the length because the array length has reduced by one.
            len--;
        }

        // Return the new array formed.
        return new_array;
    }


    /*
    * @dev
    * Function sortDesc (Sort Descending).
    * It takes in an array of numbers, runs some checks and passes it as an argumant to the function _sortDesc().
    * The called function [_sortDesc()] arranges the array elements from highest to lowest.
    * This returns the ordered array returned by the _sortDesc() function.
    * This uses ~ 125730 gas.
    *
    * @param:
    * uint256[] _array -> Array to be sorted.
    *
    * @return
    * uint256[] -> Array (memory) to be assigned to the desired storage array variable.
    */
    function sortDesc(uint256[] storage _array) internal returns(uint256[] memory)
    {
        // Makes sure that the length of the array is > 0.
        require (_array.length > 0, "0 Length Array!");

        // If array length > 1, it calls the sorting function.
        if (_array.length > 1)
            // This function sorts the array and returns the ordered array.
            return _sortDesc(_array);

        // If array length == 1, it should return the array and stop executing [There is nothing to sort].
        return _array;
    }


    /*
    * @dev
    * [Ref line 139] :: Arranges the function from highest to lowest.
    *
    * @param:
    * uint256[] _array -> Array to be sorted, passed from sortDesc().
    *
    * @return
    * uint256[] -> ordered arrray.
    */
    function _sortDesc(uint256[] storage _array) private returns(uint256[] memory)
    {
        // In this function block, the length of the array is >= 2 [ref line 155].
        /*
        * @notice
        * The first element of the array is taken and assigned to the max variable.
        * The max variable is compared with each subsequent individual element in the array.
        * If max is <= the element, the element becomes the new max variable value and the index of the element is recorded.
        * At the end of the comparison, the max variable is recorded, and replaced by the last element, and the array is popped [_array.pop()].
        * The current max value is pushed to a new array which has already been created to memory.
        * The length of the new array is such to ensure that:
        *
        * uint256[] memory new_array = new uint256[](len);
        *
        * Where len is the length of the array we want to sort.
        * At the end of the loop, (when the length of the array to be sorted is == 1), the last element is pushed to the last index of the new array.
        * The new array is returned.
        */

        // Length of the array to be sorted.
        uint256 len = _array.length;
        // New array to be returned.
        uint256[] memory new_array = new uint256[](len);
        // Index for the new array.
        uint256 index;
        // Loop until the length of the array to be sorted becomes 1.
        while (len > 0)
        {
            // This holds the current maximum value in the array; whenever the array is popped and the loop is to repeat.
            uint256 max = _array[0];
            // Counter that resets on each loop to hold the index of the current max value.
            uint256 counter = 0;   
            
            // If the length of the array is now one, it should simply copy the only element to the new array.
            if (len == 1)
            {
                // Set the last index of the new array to the only element in the current lone array.
                new_array[index] = max;
            }
            else
            {
                // This should compare the current max value to all the elements in the array to ascertain the maximum value.
                for (uint j = 1; j < len; j++)
                {
                    // If the current maximum value is greater than any element in the array, then a new maximum value is found.
                    if (max <= _array[j])
                    {
                        // Reassign the maximum value.
                        max = _array[j];
                        // Grab the index of the maximum value.
                        counter = j;
                    }
                }

                // Append the maximum value to the current index of the new array.
                new_array[index] = max;
                // Replace the element at that index in the array that is being sorted with the last element.
                // This will remove that element, because it has been recorded.
                // This is done so that the length of the array will reduce.
                _array[counter] = _array[len - 1];
                // Pop the array that is being sorted.
                // Because the last element was used to replace the current maximum value element, nothing is lost.
                _array.pop();
            }

            // Increment the index.
            index++;
            // Reduce the length because the array length has reduced by one.
            len--;
        }

        // Return the array formed.
        return new_array;
    }
}
