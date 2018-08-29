pragma solidity ^0.4.24;

import "../token/ERC20/ERC20Mintable.sol";
import "../crowdsale/emission/MintedCrowdsale.sol";


contract MintedCrowdsaleImpl is MintedCrowdsale {

  constructor (
    uint256 _rate,
    address _wallet,
    ERC20Mintable _token
  )
    public
    Crowdsale(_rate, _wallet, _token)
  {
  }

}
