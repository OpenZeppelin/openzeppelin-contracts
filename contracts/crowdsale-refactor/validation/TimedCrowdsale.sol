pragma solidity ^0.4.18;

import "../Crowdsale.sol";

contract TimedCrowdsale is Crowdsale {

  uint256 public startTime;
  uint256 public endTime;

  function Crowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, ERC20 _token) public {
    require(_startTime >= now);
    require(_endTime >= _startTime);

    startTime = _startTime;
    endTime = _endTime;
  }

  function hasEnded() public view returns (bool) {
    return now > endTime;
  }

  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    super._preValidatePurchase(_beneficiary, _weiAmount);
    require(now >= startTime && now <= endTime);
  }
}
