pragma solidity ^0.4.18;

import "../token/ERC20/ERC20.sol";
import "../crowdsale/distribution/PostDeliveryCrowdsale.sol";


contract PostDeliveryCrowdsaleImpl is PostDeliveryCrowdsale {

  function PostDeliveryCrowdsaleImpl (
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _rate,
    address _wallet,
    ERC20 _token
  ) 
    public
    TimedCrowdsale(_openingTime, _closingTime)
    Crowdsale(_rate, _wallet, _token)
  {
  }

}
