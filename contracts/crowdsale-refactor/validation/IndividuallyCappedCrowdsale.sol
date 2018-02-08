pragma solidity ^ 0.4.18;

import "../Crowdsale.sol";
import "../../ownership/Ownable.sol";

contract IndividuallyCappedCrowdsale is Crowdsale, Ownable {

  mapping(address => uint256) public contributions;
  mapping(address => uint256) public caps;

  function setUserCap(address _beneficiary, uint256 _cap) external onlyOwner {
    caps[_beneficiary] = _cap;
  }

  function getUserCap(address _beneficiary) public view returns (uint256) {
    return caps[_beneficiary];
  }

  function getUserContribution(address _beneficiary) public view returns (uint256) {
    return contributions[_beneficiary];
  }

  function _postValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    super._postValidatePurchase(_beneficiary, _weiAmount);
    contributions[_beneficiary] = contributions[_beneficiary].add(_weiAmount);
    require(contributions[_beneficiary] <= caps[_beneficiary]);
  }
}
