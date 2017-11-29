pragma solidity ^0.4.18;


import '../../contracts/crowdsale/CappedCrowdsale.sol';


contract CappedCrowdsaleImpl is CappedCrowdsale {

  function CappedCrowdsaleImpl (
    uint64 _startTime,
    uint64 _endTime,
    uint256 _rate,
    address _wallet,
    uint256 _cap
  ) public
    Crowdsale(_startTime, _endTime, _rate, _wallet)
    CappedCrowdsale(_cap)
  {
  }

}
