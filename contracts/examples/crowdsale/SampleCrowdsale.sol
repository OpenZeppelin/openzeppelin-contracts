pragma solidity ^0.4.11;

import "../../crowdsale/CappedCrowdsale.sol";
import "../../crowdsale/RefundableCrowdsale.sol";
import "./SampleCrowdsaleToken.sol";

/**
 * @title SampleCrowdsale
 * @dev This is an example of a fully fledged crowdsale that incorporates
 * ability to finalize sale and checks for both cap and goal.
 */
contract SampleCrowdsale is CappedCrowdsale, RefundableCrowdsale {

  function SampleCrowdsale(uint256 _startBlock, uint256 _endBlock, uint256 _rate, uint256 _goal, uint256 _cap, address _wallet)
    CappedCrowdsale(_cap)
    FinalizableCrowdsale()
    RefundableCrowdsale(_goal)
    Crowdsale(_startBlock, _endBlock, _rate, _wallet)
  {
    require(_goal <= _cap);
  }

  function createTokenContract() internal returns (MintableToken) {
    return new SampleCrowdsaleToken();
  }

}