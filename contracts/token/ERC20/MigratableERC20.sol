pragma solidity ^0.4.24;

import "./IERC20.sol";
import "./ERC20Mintable.sol";
import "./SafeERC20.sol";
import "../../math/Math.sol";


/**
 * @title ERC20Migrator
 * @dev This contract provides a logic to migrate an ERC20 token from one contract to another.
 * The strategy provided carries out an optional migration of the token balances. This migration is performed and paid
 * for by the token holders. The new token contract starts with no initial supply and no balances. The only way to
 * "mint" the new tokens is for users to "turn in" their old ones. This is done by first approving the amount they
 * want to migrate via `ERC20.approve(newTokenAddress, amountToMigrate)` and then calling a function of the new
 * token called `migrateTokens`. The old tokens are sent to a burn address, and the holder receives an equal amount
 * in the new contract.
 * This contract does not force any custom minting logic. Thus, it has to be used in combination with a contract that
 * provides one. For instance, you can see MigratedERC20Mock.sol as an example.
 *
 * Although this contract can be used in many different scenarios, the main motivation was to provide a way of how an
 * ERC20 token can be migrated to an upgradeable version of it using ZeppelinOS. To read more about how this can be
 * done using this implementation, please follow the official documentation site of ZeppelinOS:
 * https://docs.zeppelinos.org/docs/erc20_onboarding.html
 */
contract ERC20Migrator {
  using SafeERC20 for IERC20;

  /// Address of the old token contract
  IERC20 private _legacyToken;

  /// Address of the new token contract
  ERC20Mintable private _newToken;

  /**
   * @dev Constructor function. It initializes the new token contract
   * @param _legacyToken address of the old token contract
   */
  constructor(IERC20 legacyToken) public {
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
