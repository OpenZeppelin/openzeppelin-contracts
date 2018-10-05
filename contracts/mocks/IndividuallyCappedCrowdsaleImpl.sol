pragma solidity ^0.4.24;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/validation/IndividuallyCappedCrowdsale.sol";
import "./CapperRoleMock.sol";


contract IndividuallyCappedCrowdsaleImpl
  is Crowdsale, IndividuallyCappedCrowdsale, CapperRoleMock {

  constructor(
    uint256 rate,
    address wallet,
    IERC20 token
  )
    public
  {
    Crowdsale.initialize(rate, wallet, token);
    IndividuallyCappedCrowdsale.initialize(msg.sender);
  }
}
