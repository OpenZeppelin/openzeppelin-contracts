pragma solidity ^0.4.23;

import "./RBAC.sol";


/**
 * @title RBACMintable
 * @author Matt Condon (@shrugs)
 * @dev Mintable logic using RBAC.
 * @dev You must add any logic for addMinter/removeMinter yourself because
 * @dev security concerns will vary.
 */
contract RBACMintable is RBAC {
  string public constant ROLE_MINTER = "minter";

  modifier onlyMinter() {
    checkRole(msg.sender, ROLE_MINTER);
    _;
  }
}
