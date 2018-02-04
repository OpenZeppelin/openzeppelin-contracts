pragma solidity ^0.4.18;

import "../../math/SafeMath.sol";
import "../CrowdsaleBase.sol";

contract CappedCrowdsale is CrowdsaleBase {
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

  function postValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    super.postValidatePurchase(_beneficiary, _weiAmount);
    require(weiRaised <= cap);
  }

}
