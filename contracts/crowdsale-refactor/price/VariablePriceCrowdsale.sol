pragma solidity ^0.4.18;

import "../validation/TimedCrowdsale.sol";
import "../../math/SafeMath.sol";

contract VariablePriceCrowdsale is TimedCrowdsale {
  using SafeMath for uint256;

  function _getTokenAmount(uint256 weiAmount) internal view returns (uint256) {
    return now.mul(rate).div(startTime);
  }
}
