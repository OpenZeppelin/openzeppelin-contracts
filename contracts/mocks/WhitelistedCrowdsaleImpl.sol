pragma solidity ^0.4.24;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/validation/WhitelistedCrowdsale.sol";
import "../crowdsale/Crowdsale.sol";


contract WhitelistedCrowdsaleImpl is Crowdsale, WhitelistedCrowdsale {

  constructor (
    uint256 rate,
    address wallet,
    IERC20 token
  )
    Crowdsale(rate, wallet, token)
    public
  {
  }
}
