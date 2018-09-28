pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../token/ERC20/IERC20.sol";
import "../crowdsale/distribution/FinalizableCrowdsale.sol";


contract FinalizableCrowdsaleImpl is Initializable, Crowdsale, TimedCrowdsale, FinalizableCrowdsale {

  constructor (
    uint256 openingTime,
    uint256 closingTime,
    uint256 rate,
    address wallet,
    IERC20 token
  )
    public
    Crowdsale(rate, wallet, token)
    TimedCrowdsale(openingTime, closingTime)
  {
    Crowdsale.initialize(rate, wallet, token);
    TimedCrowdsale.initialize(openingTime, closingTime);
  }

}
