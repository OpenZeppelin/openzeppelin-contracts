pragma solidity ^0.4.24;

import "./Ownable.sol";
import "../token/ERC20/IERC20.sol";
import "../token/ERC20/SafeERC20.sol";


/**
 * @title Contracts that should be able to recover tokens
 * @author SylTi
 * @dev This allow a contract to recover any ERC20 token received in a contract by transferring the balance to the contract owner.
 * This will prevent any accidental loss of tokens.
 */
contract CanReclaimToken is Ownable {
  using SafeERC20 for IERC20;

  /**
   * @dev Reclaim all ERC20 compatible tokens
   * @param _token ERC20 The address of the token contract
   */
  function reclaimToken(IERC20 _token) external onlyOwner {
    uint256 balance = _token.balanceOf(this);
    _token.safeTransfer(owner(), balance);
  }

}
