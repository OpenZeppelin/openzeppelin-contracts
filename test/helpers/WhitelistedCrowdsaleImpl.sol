pragma solidity ^0.4.11;


import '../../contracts/crowdsale/WhitelistedCrowdsale.sol';


contract WhitelistedCrowdsaleImpl is WhitelistedCrowdsale {

  function WhitelistedCrowdsaleImpl (
    uint256 _startBlock,
    uint256 _endBlock,
    uint256 _rate,
    address _wallet
  )
    Crowdsale(_startBlock, _endBlock, _rate, _wallet)
    WhitelistedCrowdsale() 
  {
  }

}
