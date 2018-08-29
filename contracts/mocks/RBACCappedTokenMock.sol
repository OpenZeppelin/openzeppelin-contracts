pragma solidity ^0.4.24;

import "../token/ERC20/RBACMintableToken.sol";
import "../token/ERC20/CappedToken.sol";


contract RBACCappedTokenMock is ERC20Capped, RBACMintableToken {
  constructor(uint256 _cap)
    ERC20Capped(_cap)
    public
  {}
}
