pragma solidity ^0.4.18;


import "./Ownable.sol";


/**
 * @title Whitelist
 * @dev The Whitelist contract has a whitelist of addresses, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Whitelist is Ownable {
  mapping(address => bool) public whitelist;
  
  event WhitelistedAddressAdded(address addr);
  event WhitelistedAddressRemoved(address addr);

  /**
   * @dev Throws if called by any account that's not whitelisted and not an owner.
   */
  modifier onlyWhitelisted() {
    require(whitelist[msg.sender]);
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
    WhitelistedAddressAdded(addr);
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
    WhitelistedAddressRemoved(addr);
    return true;
  }

}
