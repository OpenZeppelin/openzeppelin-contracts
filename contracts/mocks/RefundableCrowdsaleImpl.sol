pragma solidity ^0.4.18;

import "../token/ERC20/MintableToken.sol";
import "../crowdsale-refactor/distribution/RefundableCrowdsale.sol";


contract RefundableCrowdsaleImpl is RefundableCrowdsale {

  function RefundableCrowdsaleImpl (
    //uint256 _startTime,
    //uint256 _endTime,
    uint256 _rate,
    address _wallet,
    uint256 _goal,
    MintableToken _token
  ) public
    //Crowdsale(_startTime, _endTime,
    Crowdsale(_rate, _wallet, _token)
    RefundableCrowdsale(_goal)
  {
  }

}
