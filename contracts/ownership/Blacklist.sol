pragma solidity ^0.4.21;


import "./Ownable.sol";


/**
 * @title Blacklist
 * @dev The Blacklist contract has a blacklist of addresses, and provides basic authorization control functions.
 * @dev This simplifies the implementation of "user permissions".
 */
contract Blacklist is Ownable {
  mapping(address => bool) blacklist;
  address[] public blacklistAddresses;

  event BlacklistedAddressAdded(address addr);
  event BlacklistedAddressRemoved(address addr);

  /**
   * @dev Throws if called by any account that's whitelist (a.k.a not blacklist)
   */
  modifier isBlacklisted() {
    require(blacklist[msg.sender]);
    _;
  }
  
  /**
   * @dev Throws if called by any account that's blacklist.
   */
  modifier isNotBlacklisted() {
    require(!blacklist[msg.sender]);
    _;
  }

  /**
   * @dev Add an address to the blacklist
   * @param addr address
   * @return true if the address was added to the blacklist, false if the address was already in the blacklist
   */
  function addAddressToBlacklist(address addr) onlyOwner public returns(bool success) {
    if (!blacklist[addr]) {
      blacklistAddresses.push(addr);
      blacklist[addr] = true;
      emit BlacklistedAddressAdded(addr);
      success = true;
    }
  }

  /**
   * @dev Add addresses to the blacklist
   * @param addrs addresses
   * @return true if at least one address was added to the blacklist,
   * false if all addresses were already in the blacklist
   */
  function addAddressesToBlacklist(address[] addrs) onlyOwner public returns(bool success) {
    for (uint256 i = 0; i < addrs.length; i++) {
      if (addAddressToBlacklist(addrs[i])) {
        success = true;
      }
    }
  }

  /**
   * @dev Remove an address from the blacklist
   * @param addr address
   * @return true if the address was removed from the blacklist,
   * false if the address wasn't in the blacklist in the first place
   */
  function removeAddressFromBlacklist(address addr) onlyOwner public returns(bool success) {
    if (blacklist[addr]) {
      blacklist[addr] = false;
      for (uint i = 0; i < blacklistAddresses.length; i++) {
        if (addr == blacklistAddresses[i]) {
          delete blacklistAddresses[i];
        }
      }
      emit BlacklistedAddressRemoved(addr);
      success = true;
    }
  }

  /**
   * @dev Remove addresses from the blacklist
   * @param addrs addresses
   * @return true if at least one address was removed from the blacklist,
   * false if all addresses weren't in the blacklist in the first place
   */
  function removeAddressesFromBlacklist(address[] addrs) onlyOwner public returns(bool success) {
    for (uint256 i = 0; i < addrs.length; i++) {
      if (removeAddressFromBlacklist(addrs[i])) {
        success = true;
      }
    }
  }

  /**
   * @dev Get all blacklist wallet addresses
   */
  function getBlacklist() public returns (address[]) {
    return blacklistAddresses;
  }

}
