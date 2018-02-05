pragma solidity ^0.4.18;

import "../../math/SafeMath.sol";
import "./TimedCrowdsale.sol";

contract CappedCrowdsale is TimedCrowdsale {
  using SafeMath for uint256;

  uint256 public cap;

  function CappedCrowdsale(uint256 _cap) public {
    require(_cap > 0);
    cap = _cap;
  }

  function hasEnded() public view returns (bool) {
    bool capReached = weiRaised >= cap;
    return capReached || super.hasEnded();
  }

  function _postValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    super._postValidatePurchase(_beneficiary, _weiAmount);
    require(weiRaised <= cap);
  }

}
