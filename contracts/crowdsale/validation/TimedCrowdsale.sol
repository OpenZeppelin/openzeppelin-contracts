pragma solidity ^0.4.18;

import "../../math/SafeMath.sol";
import "../Crowdsale.sol";


/**
 * @title TimedCrowdsale
 * @dev Crowdsale accepting contributions only within a time frame.
 */
contract TimedCrowdsale is Crowdsale {
  using SafeMath for uint256;

  uint256 public startTime;
  uint256 public endTime;

  /**
   * @dev Constructor, takes crowdsale opening and closing times.
   * @param _startTime Crowdsale opening time
   * @param _endTime Crowdsale closing time
   */
  function TimedCrowdsale(uint256 _startTime, uint256 _endTime) public {
    require(_startTime >= now);
    require(_endTime >= _startTime);

    startTime = _startTime;
    endTime = _endTime;
  }

  /**
   * @dev Checks whether the period in which the crowdsale is open has already elapsed.
   * @return Whether crowdsale period has elapsed
   */
  function hasExpired() public view returns (bool) {
    return now > endTime;
  }
  
  /**
   * @dev Extend parent behavior requiring to be within contributing period
   * @param _beneficiary Token purchaser
   * @param _weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal inTimeRange {
    super._preValidatePurchase(_beneficiary, _weiAmount);
  }

  /**
   * @dev Reverts if not in crowdsale time range. 
   */
  modifier inTimeRange {
    require(now >= startTime && now <= endTime);
    _;
  }

}
