pragma solidity ^0.4.18;

import "../../math/SafeMath.sol";
import "../Crowdsale.sol";

contract TimedCrowdsale is Crowdsale {
  using SafeMath for uint256; //adding this for safety, inherited? CHECK

  uint256 public startTime;
  uint256 public endTime;

  function TimedCrowdsale(uint256 _startTime, uint256 _endTime) public {
    //require(_startTime >= now);
    //require(_endTime >= _startTime);

    startTime = _startTime;
    endTime = _endTime;
  }

  function hasExpired() public view returns (bool) {
    return now > endTime;
  }

  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    super._preValidatePurchase(_beneficiary, _weiAmount);
    require(now >= startTime && now <= endTime);
  }
}
