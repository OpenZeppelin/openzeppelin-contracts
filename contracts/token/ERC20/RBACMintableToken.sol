pragma solidity ^0.4.21;

import "./MintableToken.sol";
import "../../ownership/rbac/RBACWithAdmin.sol";


/**
 * @title RBACMintable token
 * @author Vittorio Minacori (@vittominacori)
 * @dev Simple ERC20 Mintable Token, with RBAC minter permissions
 */
contract RBACMintableToken is MintableToken, RBACWithAdmin {
  /**
   * A constant role name for indicating minters.
   */
  string public constant ROLE_MINTER = "minter";

  /**
   * @dev modifier to scope access to minters
   * // reverts
   */
  modifier onlyMinter()
  {
    checkRole(msg.sender, ROLE_MINTER);
    _;
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address _to, uint256 _amount) onlyMinter canMint public returns (bool) {
    totalSupply_ = totalSupply_.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    emit Mint(_to, _amount);
    emit Transfer(address(0), _to, _amount);
    return true;
  }
}
