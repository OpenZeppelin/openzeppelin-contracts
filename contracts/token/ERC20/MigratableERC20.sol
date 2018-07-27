pragma solidity ^0.4.24;

import "./ERC20.sol";
import "./SafeERC20.sol";


/**
 * @title MigratableERC20
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
contract MigratableERC20 {
  using SafeERC20 for ERC20;

  /// Burn address where the old tokens are going to be transferred
  address public constant BURN_ADDRESS = address(0xdead);

  /// Address of the old token contract
  ERC20 public legacyToken;

  /**
   * @dev Constructor function. It initializes the new token contract
   * @param _legacyToken address of the old token contract
   */
  constructor(ERC20 _legacyToken) public {
    legacyToken = _legacyToken;
  }

  /**
   * @dev Migrates the total balance of the token holder to this token contract
   * @dev This function will burn the old token balance and mint the same balance in the new token contract
   */
  function migrate() public {
    uint256 amount = legacyToken.balanceOf(msg.sender);
    migrateToken(amount);
  }

  /**
   * @dev Migrates a given amount of old-token balance to the new token contract
   * @dev This function will burn a given amount of tokens from the old contract and mint the same amount in the new one
   * @param _amount uint256 representing the amount of tokens to be migrated
   */
  function migrateToken(uint256 _amount) public {
    migrateTokenTo(msg.sender, _amount);
  }

  /**
   * @dev Burns a given amount of the old token contract for a token holder and mints the same amount of
   * @dev new tokens for a given recipient address
   * @param _amount uint256 representing the amount of tokens to be migrated
   * @param _to address the recipient that will receive the new minted tokens
   */
  function migrateTokenTo(address _to, uint256 _amount) public {
    _mint(_to, _amount);
    legacyToken.safeTransferFrom(msg.sender, BURN_ADDRESS, _amount);
  }

  /**
   * @dev Internal minting function
   * This function must be overwritten by the implementation
   */
  function _mint(address _to, uint256 _amount) internal;
}
