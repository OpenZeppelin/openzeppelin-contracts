pragma solidity ^0.4.11;

import '../../contracts/crowdsale/Crowdsale.sol';
import '../../contracts/crowdsale/FixedRate.sol';

contract CrowdsaleImpl is Crowdsale, FixedRate {

  function CrowdsaleImpl (
    uint256 _startBlock,
    uint256 _endBlock,
    uint256 _rate,
    address _wallet
  )
    Crowdsale(_startBlock, _endBlock, _wallet)
    FixedRate(_rate)
  {
  }

}
