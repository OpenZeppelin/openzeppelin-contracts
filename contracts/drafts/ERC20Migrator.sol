pragma solidity ^0.4.24;

import "../token/ERC20/IERC20.sol";
import "../token/ERC20/ERC20Mintable.sol";
import "../token/ERC20/SafeERC20.sol";
import "../math/Math.sol";


/**
 * @title ERC20Migrator
 * @dev This contract can be used to to migrate an ERC20 token from one
 * contract to another, where each token holder has to opt-in to the migration.
 * To opt-in, users must approve for this contract the number of tokens they
 * want to migrate. Once the allowance is set up, anyone can trigger the
 * migration to the new token contract. In this way, token holders "turn in"
 * their old balance and will be minted an equal amount in the new token.
 * The new token contract must be mintable. For the precise interface refer to
 * OpenZeppelin's ERC20Mintable, but the only functions that are needed are
 * `isMinter(address)` and `mint(address, amount)`. The migrator will check
 * that it is a minter for the token.
 * The balance from the legacy token will be transfered to the migrator, as it
 * is migrated, and remain here forever.
 *
 * Although this contract can be used in many different scenarios, the main
 * motivation was to provide a way of how an ERC20 token can be migrated to an
 * upgradeable version of it using ZeppelinOS. To read more about how this can
 * be done using this implementation, please follow the official documentation
 * site of ZeppelinOS: https://docs.zeppelinos.org/docs/erc20_onboarding.html
 */
contract ERC20Migrator {
  using SafeERC20 for IERC20;

  /// Address of the old token contract
  IERC20 private _legacyToken;

  /// Address of the new token contract
  ERC20Mintable private _newToken;

  /**
   * @dev Constructor function. It initializes the new token contract
   * @param legacyToken address of the old token contract
   */
  constructor(IERC20 legacyToken) public {
    require(legacyToken != address(0))
    _legacyToken = legacyToken;
  }

  function beginMigration(ERC20Mintable newToken) public {
    require(_newToken == address(0));
    require(newToken != address(0));
    require(newToken.isMinter(this));

    _newToken = newToken;
  }

  /**
   * @dev Burns a given amount of the old token contract for a token holder and mints the same amount of
   * @dev new tokens for a given recipient address
   * @param account uint256 representing the amount of tokens to be migrated
   * @param amount address the recipient that will receive the new minted tokens
   */
  function migrate(address account, uint256 amount) public {
    _newToken.mint(account, amount);
    _legacyToken.safeTransferFrom(account, this, amount);
  }

  /**
   * @dev Migrates the total balance of the token holder to this token contract
   * @dev This function will burn the old token balance and mint the same balance in the new token contract
   * @param account uint256 representing the amount of tokens to be migrated
   */
  function migrateAll(address account) public {
    uint256 balance = _legacyToken.balanceOf(account);
    uint256 allowance = _legacyToken.allowance(account, this);
    uint256 amount = Math.min(balance, allowance);
    migrate(account, amount);
  }
}
