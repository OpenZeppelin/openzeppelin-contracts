pragma solidity ^0.4.24;

import "../../math/SafeMath.sol";
import "../Crowdsale.sol";
import "../../ownership/Ownable.sol";


/**
 * @title IndividuallyCappedCrowdsale
 * @dev Crowdsale with per-user caps.
 */
contract IndividuallyCappedCrowdsale is Ownable, Crowdsale {
  using SafeMath for uint256;

  mapping(address => uint256) private _contributions;
  mapping(address => uint256) private _caps;

  /**
   * @dev Sets a specific user's maximum contribution.
   * @param beneficiary Address to be capped
   * @param cap Wei limit for individual contribution
   */
  function setUserCap(address beneficiary, uint256 cap) external onlyOwner {
    _caps[beneficiary] = cap;
  }

  /**
   * @dev Sets a group of users' maximum contribution.
   * @param beneficiaries List of addresses to be capped
   * @param cap Wei limit for individual contribution
   */
  function setGroupCap(
    address[] beneficiaries,
    uint256 cap
  )
    external
    onlyOwner
  {
    for (uint256 i = 0; i < beneficiaries.length; i++) {
      _caps[beneficiaries[i]] = cap;
    }
  }

  /**
   * @dev Returns the cap of a specific user.
   * @param beneficiary Address whose cap is to be checked
   * @return Current cap for individual user
   */
  function getUserCap(address beneficiary) public view returns (uint256) {
    return _caps[beneficiary];
  }

  /**
   * @dev Returns the amount contributed so far by a sepecific user.
   * @param beneficiary Address of contributor
   * @return User contribution so far
   */
  function getUserContribution(address beneficiary)
    public view returns (uint256)
  {
    return _contributions[beneficiary];
  }

  /**
   * @dev Extend parent behavior requiring purchase to respect the user's funding cap.
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
   * @dev Extend parent behavior to update user contributions
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
