pragma solidity ^0.4.24;

import "../token/ERC20/IERC20.sol";
import "../crowdsale/validation/IndividuallyCappedCrowdsale.sol";


contract IndividuallyCappedCrowdsaleImpl is IndividuallyCappedCrowdsale {

  constructor (
    uint256 _rate,
    address _wallet,
    IERC20 _token
  )
    public
    Crowdsale(_rate, _wallet, _token)
  {
  }

}
