pragma solidity ^0.4.11;

import '../examples/SimpleToken.sol';
import './TokenDistributionStrategy.sol';
import '../token/ERC20.sol';
import '../math/SafeMath.sol';

/**
 * @title FixedRateTokenDistributionStrategy
 * @dev Strategy that distributes a fixed number of tokens among the contributors.
 * It's done in two steps. First, it registers all of the contributions while the sale is active.
 * After the crowdsale has ended the contract compensate buyers proportionally to their contributions.
 */
contract FixedPoolTokenDistributionStrategy is TokenDistributionStrategy {
  using SafeMath for uint256;

  // The token being sold
  ERC20 token;
  mapping(address => uint256) contributions;
  uint256 totalContributed;

  function FixedPoolTokenDistributionStrategy(ERC20 _token) {
    token = _token;
  }

  function distributeTokens(address _beneficiary, uint256 _amount) onlyCrowdsale {
    contributions[_beneficiary] = contributions[_beneficiary].add(_amount);
    totalContributed = totalContributed.add(_amount);
  }

  function compensate(address _beneficiary) {
    require(crowdsale.hasEnded());
    uint256 amount = contributions[_beneficiary].mul(token.totalSupply()).div(totalContributed);
    if (token.transfer(_beneficiary, amount)) {
      contributions[_beneficiary] = 0;
    }
  }

  function getToken() constant returns(ERC20) {
    return token;
  }
}
