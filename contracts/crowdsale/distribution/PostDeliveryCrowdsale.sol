pragma solidity ^0.4.18;

import "../validation/TimedCrowdsale.sol";
import "../../token/ERC20/ERC20.sol";
import "../../math/SafeMath.sol";

/**
 * @title PostDeliveryCrowdsale
 * @dev Crowdsale that locks funds from withdrawal until it ends
 */
contract PostDeliveryCrowdsale is TimedCrowdsale {
  using SafeMath for uint256;

  mapping(address => uint256) public promises;

  function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
    promises[_beneficiary] = promises[_beneficiary].add(_tokenAmount);
  }

  /**
   * @dev Withdraw tokens only after crowdsale ends
   */
  function withdrawTokens() public {
    require(hasExpired());
    uint256 amount = promises[msg.sender];
    require(amount > 0);
    promises[msg.sender] = 0;
    _emitTokens(msg.sender, amount);
  }
}
