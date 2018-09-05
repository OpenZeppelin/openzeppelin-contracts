pragma solidity ^0.4.24;


import "../ownership/Ownable.sol";
import "../access/rbac/RBAC.sol";


/**
 * @title Whitelist
 * @dev The Whitelist contract has a whitelist of addresses, and provides basic authorization control functions.
 * This simplifies the implementation of "user permissions".
 */
contract Whitelist is Ownable, RBAC {

  // Name of the whitelisted role.
  string private constant _ROLE_WHITELISTED = "whitelist";

  /**
   * @dev Throws if operator is not whitelisted.
   * @param operator address
   */
  modifier onlyIfWhitelisted(address operator) {
    checkRole(operator, _ROLE_WHITELISTED);
    _;
  }

  /**
   * @dev add an address to the whitelist
   * @param operator address
   * @return true if the address was added to the whitelist, false if the address was already in the whitelist
   */
  function addAddressToWhitelist(address operator)
    public
    onlyOwner
  {
    _addRole(operator, _ROLE_WHITELISTED);
  }

  /**
   * @dev Determine if an account is whitelisted.
   * @return true if the account is whitelisted, false otherwise.
   */
  function isWhitelisted(address operator)
    public
    view
    returns (bool)
  {
    return hasRole(operator, _ROLE_WHITELISTED);
  }

  /**
   * @dev add addresses to the whitelist
   * @param operators addresses
   * @return true if at least one address was added to the whitelist,
   * false if all addresses were already in the whitelist
   */
  function addAddressesToWhitelist(address[] operators)
    public
    onlyOwner
  {
    for (uint256 i = 0; i < operators.length; i++) {
      addAddressToWhitelist(operators[i]);
    }
  }

  /**
   * @dev remove an address from the whitelist
   * @param operator address
   * @return true if the address was removed from the whitelist,
   * false if the address wasn't in the whitelist in the first place
   */
  function removeAddressFromWhitelist(address operator)
    public
    onlyOwner
  {
    _removeRole(operator, _ROLE_WHITELISTED);
  }

  /**
   * @dev remove addresses from the whitelist
   * @param operators addresses
   * @return true if at least one address was removed from the whitelist,
   * false if all addresses weren't in the whitelist in the first place
   */
  function removeAddressesFromWhitelist(address[] operators)
    public
    onlyOwner
  {
    for (uint256 i = 0; i < operators.length; i++) {
      removeAddressFromWhitelist(operators[i]);
    }
  }

}
