pragma solidity ^0.4.18;

import "../token/ERC20/MintableToken.sol";
import "../crowdsale/emission/MintedCrowdsale.sol";


contract MintedCrowdsaleImpl is MintedCrowdsale {

  function MintedCrowdsaleImpl (
    uint256 _rate,
    address _wallet,
    MintableToken _token
  ) 
    public
    Crowdsale(_rate, _wallet, _token)
  {
  }

}
