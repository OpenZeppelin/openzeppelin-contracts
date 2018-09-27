pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../token/ERC20/IERC20.sol";
import "../crowdsale/validation/CappedCrowdsale.sol";


contract CappedCrowdsaleImpl is Initializable, Crowdsale, CappedCrowdsale {

  constructor (
    uint256 rate,
    address wallet,
    IERC20 token,
    uint256 cap
  )
    public
    Crowdsale(rate, wallet, token)
    CappedCrowdsale(cap)
  {
    Crowdsale.initialize(rate, wallet, token);
    CappedCrowdsale.initialize(cap);
  }

}
