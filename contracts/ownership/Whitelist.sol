pragma solidity ^0.4.18;


import "./Ownable.sol";


/**
 * @title Whitelist
 * @dev The Whitelist contract has a whitelist of addresses, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Whitelist is Ownable {
  mapping(address => bool) public whitelist;
  
  event WhitelistItemAdded(address addr);
  event WhitelistItemRemoved(address addr);

  /**
   * @dev Throws if called by any account that's not whitelisted and not an owner.
   */
  modifier onlyWhitelisted() {
    require(whitelist[msg.sender] || owner == msg.sender);
    _;
  }

  /**
   * @dev add an address to the whitelist
   * @param addr address
   */
  function addToWhitelist(address addr) onlyOwner public returns(bool) {
    if (whitelist[addr]) {
      return false; 
    }
    whitelist[addr] = true;
    WhitelistItemAdded(addr);
    return true;
  }

  /**
   * @dev remove an address from the whitelist
   * @param addr address
   */
  function removeFromWhitelist(address addr) onlyOwner public returns(bool) {
    if (!whitelist[addr]) {
      return false;
    }
    whitelist[addr] = false;
    WhitelistItemRemoved(addr);
    return true;
  }

}
