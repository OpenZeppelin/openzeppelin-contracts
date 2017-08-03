pragma solidity ^0.4.11;

import '../math/SafeMath.sol';
import './Crowdsale.sol';

/**
 * @title WhitelistedCrowdsale
 * @dev Extension of Crowsdale where an owner can whitelist addresses
 * which can invest in crowdsale before it opens to the public 
 */
contract WhitelistedCrowdsale is Crowdsale, Ownable {
  using SafeMath for uint256;

  // list of addresses that can purchase before crowdsale opens
  mapping (address => bool) public whitelist;

  function addToWhitelist(address investor) public onlyOwner {
    whitelist[investor] = true; 
  }

  // @return true if investor is whitelisted
  function isWhitelisted(address investor) public constant returns (bool) {
    return whitelist[investor];
  }

  // overriding Crowdsale#validPurchase to add whitelist logic
  // @return true if investors can buy at the moment
  function validPurchase() internal constant returns (bool) {
    // [TODO] issue with overriding and associativity of logical operators
    return super.validPurchase() || (!hasEnded() && isWhitelisted(msg.sender)); 
  }

}
