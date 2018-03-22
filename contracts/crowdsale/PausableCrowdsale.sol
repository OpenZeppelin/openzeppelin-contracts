pragma solidity ^0.4.18;

import "./Crowdsale.sol";
import "../lifecycle/Pausable.sol";


/**
 * @title PausableCrowdsale
 * @dev Extension of Crowdsale contract that can be paused and unpaused by owner
 */
contract PausableCrowdsale is Crowdsale, Pausable {

  /**
   * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use super to concatenate validations.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal whenNotPaused {
    return super._preValidatePurchase(_beneficiary, _weiAmount);
  }
}
