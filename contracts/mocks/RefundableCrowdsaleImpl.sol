pragma solidity ^0.4.18;

import "../token/ERC20/MintableToken.sol";
import "../crowdsale/distribution/RefundableCrowdsale.sol";

contract RefundableCrowdsaleImpl is RefundableCrowdsale {

  function RefundableCrowdsaleImpl (
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    MintableToken _token,
    uint256 _goal
  ) public
    Crowdsale(_rate, _wallet, _token)
    TimedCrowdsale(_startTime, _endTime)
    RefundableCrowdsale(_goal)
  {
  }

}
