pragma solidity ^0.4.23;

import "../token/ERC20/MintableToken.sol";
import "../crowdsale/emission/MintedCrowdsale.sol";


contract MintedCrowdsaleImpl is MintedCrowdsale {

  constructor (
    uint256 _rate,
    address _wallet,
    MintableToken _token
  )
    public
    Crowdsale(_rate, _wallet, _token)
  {
  }

}
