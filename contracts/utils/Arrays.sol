pragma solidity ^0.4.23;

import "../math/Math.sol";


/**
 * @title Arrays
 * @dev Utility library of inline array functions
 */
library Arrays {

  /**
   * @dev Find upper bound for searching element. Utilize binary search function with O(log(n)) cost.
   */
  function findUpperBound(
    uint256[] storage array,
    uint256 element
  ) 
    internal
    view
    returns (uint256)
  {
    uint256 low = 0;
    uint256 high = array.length;

    while (low < high) {
      uint256 mid = Math.average(low, high);

      if (array[mid] > element) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }

    // At this point at `low` is the exclusive upper bound. We will return the inclusive upper bound.
    if (low > 0 && array[low - 1] == element) {
      return low - 1;
    } else {
      return low;
    }
  }
}
