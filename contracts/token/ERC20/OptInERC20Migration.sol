pragma solidity ^0.4.21;

import "./ERC20.sol";
import "./SafeERC20.sol";
import "./StandardToken.sol";
import "zos-lib/contracts/migrations/Migratable.sol";

/**
 * @title Opt in ERC20 migration
 * @dev This strategy carries out an optional migration of the token balances. This migration is performed and paid for
 * @dev by the token holders. The new token contract starts with no initial supply and no balances. The only way to
 * @dev "mint" the new tokens is for users to "turn in" their old ones. This is done by first approving the amount they
 * @dev want to migrate via `ERC20.approve(newTokenAddress, amountToMigrate)` and then calling a function of the new
 * @dev token called `migrateTokens`. The old tokens are sent to a burn address, and the holder receives an equal amount
 * @dev in the new contract.
 */
contract OptInERC20Migration is Migratable, StandardToken {
  using SafeERC20 for ERC20;

  /// Burn address where the old tokens are going to be transferred
  address public constant BURN_ADDRESS = address(0xdead);

  /// Address of the old token contract
  ERC20 public legacyToken;

  /**
   * @dev Initializes the new token contract
   * @param _legacyToken address of the old token contract
   */
  function initialize(ERC20 _legacyToken) isInitializer("OptInERC20Migration", "1.9.0") public {
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
   * @dev Migrates the a given amount of old-token balance to the new token contract
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
   * @dev Private minting function
   * This function will be removed in favour of our new upcoming version of StandardToken
   */
  function _mint(address _to, uint256 _amount) private {
    require(_to != address(0));
    totalSupply_ = totalSupply_.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    emit Transfer(address(0), _to, _amount);
  }
}
