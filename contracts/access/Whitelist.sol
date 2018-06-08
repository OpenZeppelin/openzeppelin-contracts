pragma solidity ^0.4.24;


import "../ownership/Ownable.sol";
import "../ownership/rbac/RBAC.sol";


/**
 * @title Whitelist
 * @dev The Whitelist contract has a whitelist of addresses, and provides basic authorization control functions.
 * This simplifies the implementation of "user permissions".
 */
contract Whitelist is Ownable, RBAC {
  string public constant ROLE_WHITELISTED = "whitelist";

  /**
   * @dev Throws if called by any account that's not whitelisted.
   * @dev kept as `onlyWhitelisted` for backwards compatibility
   * @dev use isWhitelisted(address) and pass in msg.sender for more readable code
   */
  modifier onlyWhitelisted() {
    checkRole(msg.sender, ROLE_WHITELISTED);
    _;
  }

  /**
   * @dev Throws if beneficiary is not whitelisted.
   */
  modifier isWhitelisted(address _beneficiary) {
    checkRole(_beneficiary, ROLE_WHITELISTED);
    _;
  }

  /**
   * @dev add an address to the whitelist
   * @param _addr address
   * @return true if the address was added to the whitelist, false if the address was already in the whitelist
   */
  function addAddressToWhitelist(address _addr)
    onlyOwner
    public
  {
    addRole(_addr, ROLE_WHITELISTED);
  }

  /**
   * @dev getter to determine if address is in whitelist
   */
  function whitelist(address _addr)
    public
    view
    returns (bool)
  {
    return hasRole(_addr, ROLE_WHITELISTED);
  }

  /**
   * @dev add addresses to the whitelist
   * @param _addrs addresses
   * @return true if at least one address was added to the whitelist,
   * false if all addresses were already in the whitelist
   */
  function addAddressesToWhitelist(address[] _addrs)
    onlyOwner
    public
  {
    for (uint256 i = 0; i < _addrs.length; i++) {
      addAddressToWhitelist(_addrs[i]);
    }
  }

  /**
   * @dev remove an address from the whitelist
   * @param _addr address
   * @return true if the address was removed from the whitelist,
   * false if the address wasn't in the whitelist in the first place
   */
  function removeAddressFromWhitelist(address _addr)
    onlyOwner
    public
  {
    removeRole(_addr, ROLE_WHITELISTED);
  }

  /**
   * @dev remove addresses from the whitelist
   * @param _addrs addresses
   * @return true if at least one address was removed from the whitelist,
   * false if all addresses weren't in the whitelist in the first place
   */
  function removeAddressesFromWhitelist(address[] _addrs)
    onlyOwner
    public
  {
    for (uint256 i = 0; i < _addrs.length; i++) {
      removeAddressFromWhitelist(_addrs[i]);
    }
  }

}
