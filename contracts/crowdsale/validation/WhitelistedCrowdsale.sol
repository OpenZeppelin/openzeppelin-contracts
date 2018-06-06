pragma solidity ^0.4.24;

import "../Crowdsale.sol";
import "../../ownership/Whitelist.sol";
import "../../ownership/Ownable.sol";


/**
 * @title WhitelistedCrowdsale
 * @dev Crowdsale in which only whitelisted users can contribute.
 * @dev (using explicit Ownable inheritance even though Whitelist already inherits)
 */
contract WhitelistedCrowdsale is Ownable, Whitelist, Crowdsale {
  /**
   * @dev Extend parent behavior requiring beneficiary to be in whitelist.
   * @param _beneficiary Token beneficiary
   * @param _weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(
    address _beneficiary,
    uint256 _weiAmount
  )
    isWhitelisted(_beneficiary)
    internal
  {
    super._preValidatePurchase(_beneficiary, _weiAmount);
  }

}
