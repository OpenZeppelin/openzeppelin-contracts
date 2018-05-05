pragma solidity ^0.4.21;

import "./StandardToken.sol";
import "../../ownership/rbac/RBACWithAdmin.sol";


/**
 * @title RBACMintableToken
 * @author Vittorio Minacori (@vittominacori)
 * @dev Simple ERC20 Mintable Token, with RBAC minter permissions
 */
contract RBACMintableToken is StandardToken, RBACWithAdmin {
  event Mint(address indexed to, uint256 amount);
  event MintFinished();

  /**
   * A constant role name for indicating minters.
   */
  string public constant ROLE_MINTER = "minter";

  bool public mintingFinished = false;


  modifier canMint() {
    require(!mintingFinished);
    _;
  }

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

  /**
   * @dev Function to stop minting new tokens.
   * @return True if the operation was successful.
   */
  function finishMinting() onlyAdmin canMint public returns (bool) {
    mintingFinished = true;
    emit MintFinished();
    return true;
  }
}
