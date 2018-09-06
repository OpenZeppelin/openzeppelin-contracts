pragma solidity ^0.4.24;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/validation/IndividuallyCappedCrowdsale.sol";


contract IndividuallyCappedCrowdsaleImpl is IndividuallyCappedCrowdsale {

  constructor (
    uint256 rate,
    address wallet,
    IERC20 token
  )
    public
    Crowdsale(rate, wallet, token)
  {
  }

}
