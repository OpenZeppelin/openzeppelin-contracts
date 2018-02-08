pragma solidity ^0.4.18;

import "../../math/SafeMath.sol";
import "../Crowdsale.sol";

contract CappedCrowdsale is Crowdsale {
  using SafeMath for uint256;

  uint256 public cap;

  function CappedCrowdsale(uint256 _cap) public {
    require(_cap > 0);
    cap = _cap;
  }

  function capReached() public view returns (bool) {
    return weiRaised >= cap;
  }

  function _postValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    super._postValidatePurchase(_beneficiary, _weiAmount);
    require(weiRaised <= cap);
  }

}
