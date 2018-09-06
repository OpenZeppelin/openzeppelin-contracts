pragma solidity ^0.4.24;

import "../Crowdsale.sol";
import "../../access/Whitelist.sol";


/**
 * @title WhitelistedCrowdsale
 * @dev Crowdsale in which only whitelisted users can contribute.
 */
contract WhitelistedCrowdsale is Whitelist, Crowdsale {
  /**
   * @dev Extend parent behavior requiring beneficiary to be in whitelist.
   * @param beneficiary Token beneficiary
   * @param weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(
    address beneficiary,
    uint256 weiAmount
  )
    internal
    onlyIfWhitelisted(beneficiary)
  {
    super._preValidatePurchase(beneficiary, weiAmount);
  }

}
