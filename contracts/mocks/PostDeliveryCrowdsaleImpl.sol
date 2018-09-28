pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../token/ERC20/IERC20.sol";
import "../crowdsale/distribution/PostDeliveryCrowdsale.sol";


contract PostDeliveryCrowdsaleImpl is Initializable, Crowdsale, TimedCrowdsale, PostDeliveryCrowdsale {

  constructor (
    uint256 openingTime,
    uint256 closingTime,
    uint256 rate,
    address wallet,
    IERC20 token
  )
    public
    TimedCrowdsale(openingTime, closingTime)
    Crowdsale(rate, wallet, token)
  {
    Crowdsale.initialize(rate, wallet, token);
    TimedCrowdsale.initialize(openingTime, closingTime);
  }

}
