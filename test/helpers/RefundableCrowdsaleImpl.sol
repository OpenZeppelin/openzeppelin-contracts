pragma solidity ^0.4.11;


import '../../contracts/crowdsale/RefundableCrowdsale.sol';
import '../../contracts/crowdsale/FixedRate.sol';


contract RefundableCrowdsaleImpl is RefundableCrowdsale, FixedRate {

  function RefundableCrowdsaleImpl (
    uint256 _startBlock,
    uint256 _endBlock,
    uint256 _rate,
    address _wallet,
    uint256 _goal
  )
    Crowdsale(_startBlock, _endBlock, _wallet)
    RefundableCrowdsale(_goal) 
    FixedRate(_rate)
  {
  }

}
