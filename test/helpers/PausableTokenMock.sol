pragma solidity ^0.4.11;

import '../../contracts/token/PausableToken.sol';

// mock class using PausableToken
contract PausableTokenMock is PausableToken {

  function PausableTokenMock(address initialAccount, uint initialBalance) {
    balances[initialAccount] = initialBalance;
  }

}
