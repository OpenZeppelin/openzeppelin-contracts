pragma solidity ^0.4.23;

import "../token/ERC20/PausableToken.sol";


// mock class using PausableToken
contract PausableTokenMock is PausableToken {

  constructor(address initialAccount, uint initialBalance) public {
    balances[initialAccount] = initialBalance;
  }

}
