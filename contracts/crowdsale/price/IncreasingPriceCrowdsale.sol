pragma solidity ^0.4.18;

import "../validation/TimedCrowdsale.sol";
import "../../math/SafeMath.sol";


contract IncreasingPriceCrowdsale is TimedCrowdsale {
  using SafeMath for uint256;

  uint256 public initialRate;
  uint256 public finalRate;

  /**
   * @param _initialRate Number of tokens a buyer gets per wei at the start of the crowdsale
   * @param _finalRate Number of tokens a buyer gets per wei at the end of the crowdsale
   */
  function IncreasingPriceCrowdsale(uint256 _initialRate, uint256 _finalRate) public {
    require(_initialRate >= _finalRate);
    require(_finalRate > 0);
    initialRate = _initialRate;
    finalRate = _finalRate;
  }

  /**
   * @return The number of tokens a buyer gets per wei at a given time
   */
  function getCurrentRate() public view returns (uint256) {
    uint256 elapsedTime = now - startTime;
    uint256 timeRange = endTime - startTime;
    uint256 rateRange = initialRate - finalRate;
    return initialRate.sub(elapsedTime.mul(rateRange).div(timeRange));
  }

  function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
    uint256 currentRate = getCurrentRate();
    return currentRate.mul(_weiAmount);
  }

}
