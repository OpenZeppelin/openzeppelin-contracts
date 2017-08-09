pragma solidity ^0.4.11;


import '../../contracts/crowdsale/FinalizableCrowdsale.sol';
import '../../contracts/crowdsale/FixedRate.sol';


contract FinalizableCrowdsaleImpl is FinalizableCrowdsale, FixedRate {

  function FinalizableCrowdsaleImpl (
    uint256 _startBlock,
    uint256 _endBlock,
    uint256 _rate,
    address _wallet
  )
    Crowdsale(_startBlock, _endBlock, _wallet)
    FinalizableCrowdsale() 
    FixedRate(_rate)
  {
  }

}
