pragma solidity ^0.4.18;


import "../crowdsale/CappedCrowdsale.sol";


contract CappedCrowdsaleImpl is CappedCrowdsale {

  function CappedCrowdsaleImpl (
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    uint256 _cap,
    MintableToken _token
  ) public
    Crowdsale(_startTime, _endTime, _rate, _wallet, _token)
    CappedCrowdsale(_cap)
  {
  }

}
