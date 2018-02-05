pragma solidity ^0.4.18;

import "../token/ERC20/ERC20.sol";
import "../math/SafeMath.sol";

/**
 * @title Crowdsale
 * @dev Crowdsale is a base contract for managing a token crowdsale, 
 * allowing investors to purchase tokens with ether. This contract implements 
 * such functionality in it's most fundamental form and can be extended to provide additional
 * functionality and/or custom behavior.
 */
contract Crowdsale {
  using SafeMath for uint256;

  // The token being sold
  ERC20 public token;

  // Address where funds are collected
  address public wallet;

  // How many token units a buyer gets per wei
  uint256 public rate;

  // Amount of wei raised
  uint256 public weiRaised;

  /**
   * Event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

  function Crowdsale(uint256 _rate, address _wallet, ERC20 _token) public {
    require(_rate > 0);
    require(_wallet != address(0));
    require(_token != address(0));

    rate = _rate;
    wallet = _wallet;
    token = _token;
  }

  // -----------------------------------------
  // Crowdsale external interface
  // -----------------------------------------

  /** 
  * These functions represent the basic 
  * interface for purchasing tokens, conform
  * the base architecture for crowdsales,
  * and are not intended to be modified / overriden.
  */

  // Fallback function routes to buyTokens()
  // *** DO NOT OVERRIDE ***
  function () external payable {
    buyTokens(msg.sender);
  }

  // Low level token purchase function
  // *** DO NOT OVERRIDE ***
  function buyTokens(address beneficiary) public payable {

    uint256 weiAmount = msg.value;
    _preValidatePurchase(beneficiary, weiAmount);

    // calculate token amount to be created
    uint256 tokens = _getTokenAmount(weiAmount);

    // update state
    weiRaised = weiRaised.add(weiAmount);

    _processPurchase(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    _forwardFunds();
    _postValidatePurchase(beneficiary, weiAmount);
  }

  // -----------------------------------------
  // Internal (extensible) implementations
  // -----------------------------------------

  /** 
  * These functions conform the extensible 
  * and modifyable surface of crowdsales. 
  * Override the methods to add additional functionality.
  * Consider using 'super' where appropiate to concatenate
  * behavior.
  */

  // Validation of an incoming purchase.
  // Use require to revert when conditions are not met.
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    require(_beneficiary != address(0));
    require(_weiAmount != 0);
  }

  // Validation of an executed purchase.
  // Observe state and use revert/require to undo changes.
  function _postValidatePurchase(address beneficiary, uint256 weiAmount) internal {
    // optional override
  }
  
  // Ultimate source of tokens.
  // Override this method to modify how the crowdsale ultimately gets and 
  // sends its tokens.
  function _emitTokens(address _beneficiary, uint256 _tokenAmount) internal {
    token.transfer(_beneficiary, _tokenAmount);
  }

  // Executed when a purchase has been validated and is ready to be executed.
  // Might not necessarily emit/send tokens.
  function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
    _emitTokens(_beneficiary, _tokenAmount);
  }

  // Determines the relationship of ETH to amount of tokens.
  // Not necessarily determined directly by rate.
  function _getTokenAmount(uint256 weiAmount) internal view returns (uint256) {
    return weiAmount.mul(rate);
  }

  // Determines how ETH is stored/forwarded on purchases.
  function _forwardFunds() internal {
    wallet.transfer(msg.value);
  }
}
