pragma solidity ^0.4.18;

import "../token/ERC20/ERC20.sol";
import "../crowdsale/validation/WhitelistedCrowdsale.sol";


contract WhitelistedCrowdsaleImpl is WhitelistedCrowdsale {

  function WhitelistedCrowdsaleImpl (
    uint256 _rate,
    address _wallet,
    ERC20 _token
  ) 
    public
    Crowdsale(_rate, _wallet, _token)
  {
  }

}
