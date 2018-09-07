pragma solidity ^0.4.24;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/distribution/FinalizableCrowdsale.sol";


contract FinalizableCrowdsaleImpl is FinalizableCrowdsale {

  constructor (
    uint256 _openingTime,
    uint256 _closingTime,
    uint256 _rate,
    address _wallet,
    IERC20 _token
  )
    public
    Crowdsale(_rate, _wallet, _token)
    TimedCrowdsale(_openingTime, _closingTime)
  {
  }

}
