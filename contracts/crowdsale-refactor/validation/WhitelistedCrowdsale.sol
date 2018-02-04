pragma solidity ^ 0.4.18;

import "../CrowdsaleBase.sol";
import "../../ownership/Ownable.sol";

contract WhitelistedCrowdsale is CrowdsaleBase, Ownable {
  
  mapping(address => bool) public whitelist;

  function addToWhitelist(address _beneficiary) external onlyOwner {
    whitelist[_beneficiary] = true;
  }

  function removeFromWhitelist(address _beneficiary) external onlyOwner {
    whitelist[_beneficiary] = false;
  }

  function isWhitelisted(address _beneficiary) public view returns (bool) {
    return whitelist[_beneficiary];
  }

  function preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    super.preValidatePurchase(_beneficiary, _weiAmount);
    require(isWhitelisted(_beneficiary));
  }
}
