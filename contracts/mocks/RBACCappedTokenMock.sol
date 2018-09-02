pragma solidity ^0.4.24;

import "../token/ERC20/RBACMintableToken.sol";
import "../token/ERC20/ERC20Capped.sol";


contract RBACCappedTokenMock is ERC20Capped, RBACMintableToken {
  constructor(uint256 _cap)
    ERC20Capped(_cap)
    public
  {}
}
