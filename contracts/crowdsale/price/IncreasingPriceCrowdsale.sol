pragma solidity ^0.4.18;

import "../validation/TimedCrowdsale.sol";
import "../../math/SafeMath.sol";

contract IncreasingPriceCrowdsale is TimedCrowdsale {
  using SafeMath for uint256;

  uint256 public initialRate;
  uint256 public finalRate;

  function IncreasingPriceCrowdsale(uint256 _initialRate, uint256 _finalRate) public {
    require(_initialRate >= _finalRate);
    require(_finalRate > 0);

    initialRate = _initialRate;
    finalRate = _finalRate;
  }

  function getCurrentRate() public view returns (uint256) {
    uint256 elapsedTime = now - startTime;
    uint256 timeRange = endTime - startTime;
    uint256 rateRange = initialRate - finalRate;
    return initialRate.sub(elapsedTime.mul(rateRange).div(timeRange));
  }

  function _getTokenAmount(uint256 weiAmount) internal view returns (uint256) {
    uint256 currentRate = getCurrentRate();
    return currentRate.mul(weiAmount);
  }

}
