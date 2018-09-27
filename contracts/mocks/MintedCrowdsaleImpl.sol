pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../token/ERC20/ERC20Mintable.sol";
import "../crowdsale/emission/MintedCrowdsale.sol";


contract MintedCrowdsaleImpl is Initializable, MintedCrowdsale {

  constructor (
    uint256 rate,
    address wallet,
    ERC20Mintable token
  )
    public
    Crowdsale(rate, wallet, token)
  {
    Crowdsale.initialize(rate, wallet, token);
  }

}
