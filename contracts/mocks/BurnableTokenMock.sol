pragma solidity ^0.4.24;

import "./StandardTokenMock.sol";
import "../token/ERC20/BurnableToken.sol";


contract BurnableTokenMock is StandardTokenMock, BurnableToken {
  constructor(address _initialAccount, uint256 _initialBalance)
    StandardTokenMock(_initialAccount, _initialBalance)
    public
  { }
}
