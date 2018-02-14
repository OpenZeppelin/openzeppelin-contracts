pragma solidity ^0.4.18;

import "../token/ERC20/MintableToken.sol";
import "../crowdsale-refactor/distribution/FinalizableCrowdsale.sol";


contract FinalizableCrowdsaleImpl is FinalizableCrowdsale {

  function FinalizableCrowdsaleImpl (
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    MintableToken _token
  ) public
    TimedCrowdsale(_startTime, _endTime)
    Crowdsale(_rate, _wallet, _token)
  {
  }

}
