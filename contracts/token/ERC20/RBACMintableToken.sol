pragma solidity ^0.4.21;

import "./MintableToken.sol";
import "../../ownership/rbac/RBACWithAdmin.sol";


/**
 * @title RBACMintableToken
 * @author Vittorio Minacori (@vittominacori)
 * @dev Simple ERC20 Mintable Token, with RBAC minter permissions
 */
contract RBACMintableToken is MintableToken, RBACWithAdmin {
  /**
   * A constant role name for indicating minters.
   */
  string public constant ROLE_MINTER = "minter";

  modifier hasMintPermission() {
    checkRole(msg.sender, ROLE_MINTER);
    _;
  }

  modifier hasFinishMintingPermission() {
    checkRole(msg.sender, ROLE_ADMIN);
    _;
  }
}
