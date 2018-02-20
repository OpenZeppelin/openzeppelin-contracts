pragma solidity ^0.4.18;

import "../token/ERC20/ERC20.sol";
import "../crowdsale/validation/TimedCrowdsale.sol";

contract TimedCrowdsaleImpl is TimedCrowdsale {

  function TimedCrowdsaleImpl (
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    ERC20 _token
  ) 
    public
    Crowdsale(_rate, _wallet, _token)
    TimedCrowdsale(_startTime, _endTime)
  {
  }

}
