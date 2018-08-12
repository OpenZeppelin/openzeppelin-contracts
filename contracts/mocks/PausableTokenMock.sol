pragma solidity ^0.4.24;

import "./StandardTokenMock.sol";
import "../token/ERC20/PausableToken.sol";


// mock class using PausableToken
contract PausableTokenMock is StandardTokenMock, PausableToken {

  constructor(address _initialAccount, uint256 _initialBalance)
    StandardTokenMock(_initialAccount, _initialBalance)
    public
  { }

}
