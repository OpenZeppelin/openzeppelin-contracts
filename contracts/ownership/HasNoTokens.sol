pragma solidity ^0.4.8;

import "./Ownable.sol";
import "../token/ERC20Basic.sol";

/// @title Contracts that should not own Tokens
/// @author Remco Bloemen <remco@2π.com>
///
/// This blocks incoming ERC23 tokens to prevent accidental
/// loss of tokens. Should tokens (any ERC20Basic compatible)
/// end up in the contract, it allows the owner to reclaim
/// the tokens.
contract HasNoTokens is Ownable {

  /// Reject all ERC23 compatible tokens
  function tokenFallback(address from_, uint value_, bytes data_) external {
    throw;
  }

  /// Reclaim all ERC20Basic compatible tokens
  function reclaimToken(address tokenAddr) external onlyOwner {
    ERC20Basic tokenInst = ERC20Basic(tokenAddr);
    uint256 balance = tokenInst.balanceOf(this);
    tokenInst.transfer(owner, balance);
  }
}
