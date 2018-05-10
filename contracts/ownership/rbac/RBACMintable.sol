pragma solidity ^0.4.23;

import "./RBAC.sol";


/**
 * @title RBACMintable
 * @author Matt Condon (@shrugs)
 * @dev Mintable logic using RBAC
 */
contract RBACMintable is RBAC {
  string public constant ROLE_MINTER = "minter";

  modifier onlyMinter() {
    checkRole(msg.sender, ROLE_MINTER);
    _;
  }
}
