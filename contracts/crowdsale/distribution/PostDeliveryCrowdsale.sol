pragma solidity ^0.4.24;

import "../validation/TimedCrowdsale.sol";
import "../../token/ERC20/IERC20.sol";
import "../../math/SafeMath.sol";


/**
 * @title PostDeliveryCrowdsale
 * @dev Crowdsale that locks tokens from withdrawal until it ends.
 */
contract PostDeliveryCrowdsale is TimedCrowdsale {
  using SafeMath for uint256;

  mapping(address => uint256) private balances_;

  /**
   * @dev Withdraw tokens only after crowdsale ends.
   * @param _beneficiary Whose tokens will be withdrawn.
   */
  function withdrawTokens(address _beneficiary) public {
    require(hasClosed());
    uint256 amount = balances_[_beneficiary];
    require(amount > 0);
    balances_[_beneficiary] = 0;
    _deliverTokens(_beneficiary, amount);
  }

  /**
   * @return the balance of an account.
   */
  function balanceOf(address _account) public view returns(uint256) {
    return balances_[_account];
  }

  /**
   * @dev Overrides parent by storing balances instead of issuing tokens right away.
   * @param _beneficiary Token purchaser
   * @param _tokenAmount Amount of tokens purchased
   */
  function _processPurchase(
    address _beneficiary,
    uint256 _tokenAmount
  )
    internal
  {
    balances_[_beneficiary] = balances_[_beneficiary].add(_tokenAmount);
  }

}
