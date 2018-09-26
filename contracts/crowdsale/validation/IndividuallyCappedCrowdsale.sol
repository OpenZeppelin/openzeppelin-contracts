pragma solidity ^0.4.24;

import "../../math/SafeMath.sol";
import "../Crowdsale.sol";
import "../../access/roles/CapperRole.sol";


/**
 * @title IndividuallyCappedCrowdsale
 * @dev Crowdsale with per-beneficiary caps.
 */
contract IndividuallyCappedCrowdsale is Crowdsale, CapperRole {
  using SafeMath for uint256;

  mapping(address => uint256) private _contributions;
  mapping(address => uint256) private _caps;

  /**
   * @dev Sets a specific beneficiary's maximum contribution.
   * @param beneficiary Address to be capped
   * @param cap Wei limit for individual contribution
   */
  function setCap(address beneficiary, uint256 cap) external onlyCapper {
    _caps[beneficiary] = cap;
  }

  /**
   * @dev Returns the cap of a specific beneficiary.
   * @param beneficiary Address whose cap is to be checked
   * @return Current cap for individual beneficiary
   */
  function getCap(address beneficiary) public view returns (uint256) {
    return _caps[beneficiary];
  }

  /**
   * @dev Returns the amount contributed so far by a specific beneficiary.
   * @param beneficiary Address of contributor
   * @return Beneficiary contribution so far
   */
  function getContribution(address beneficiary)
    public view returns (uint256)
  {
    return _contributions[beneficiary];
  }

  /**
   * @dev Extend parent behavior requiring purchase to respect the beneficiary's funding cap.
   * @param beneficiary Token purchaser
   * @param weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(
    address beneficiary,
    uint256 weiAmount
  )
    internal
  {
    super._preValidatePurchase(beneficiary, weiAmount);
    require(
      _contributions[beneficiary].add(weiAmount) <= _caps[beneficiary]);
  }

  /**
   * @dev Extend parent behavior to update beneficiary contributions
   * @param beneficiary Token purchaser
   * @param weiAmount Amount of wei contributed
   */
  function _updatePurchasingState(
    address beneficiary,
    uint256 weiAmount
  )
    internal
  {
    super._updatePurchasingState(beneficiary, weiAmount);
    _contributions[beneficiary] = _contributions[beneficiary].add(
      weiAmount);
  }

}
