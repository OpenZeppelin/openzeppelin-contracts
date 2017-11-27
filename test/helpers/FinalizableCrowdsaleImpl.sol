pragma solidity ^0.4.18;


import '../../contracts/crowdsale/FinalizableCrowdsale.sol';


contract FinalizableCrowdsaleImpl is FinalizableCrowdsale {

  function FinalizableCrowdsaleImpl (
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet
  ) public
    Crowdsale(_startTime, _endTime, _rate, _wallet)
    FinalizableCrowdsale()
  {
  }

}
