pragma solidity ^0.4.23;

import { Math } from "../math/Math.sol";


library ArrayUtils {
  function findUpperBound(uint256[] storage _array, uint256 _element) internal view returns (uint256) {
    uint256 low = 0;
    uint256 high = _array.length;

    while (low < high) {
      uint256 mid = Math.average(low, high);

      if (_array[mid] > _element) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }

    // At this point at `low` is the exclusive upper bound. We will return the inclusive upper bound.

    if (low > 0 && _array[low - 1] == _element) {
      return low - 1;
    } else {
      return low;
    }
  }
}
