pragma solidity ^0.4.18;

import "../token/ERC20/ERC20.sol";
import "../crowdsale/validation/IndividuallyCappedCrowdsale.sol";


contract IndividuallyCappedCrowdsaleImpl is IndividuallyCappedCrowdsale {
  
  function IndividuallyCappedCrowdsaleImpl (
    uint256 _rate,
    address _wallet,
    ERC20 _token
  ) 
    public
    Crowdsale(_rate, _wallet, _token)
  {
  }

}
