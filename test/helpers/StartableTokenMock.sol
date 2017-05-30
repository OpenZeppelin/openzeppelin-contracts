pragma solidity ^0.4.8;

import '../../contracts/token/StartableToken.sol';

// mock class using UnpausableToken
contract StartableTokenMock is StartableToken {

  function StartableTokenMock(address initialAccount, uint initialBalance) {
    balances[initialAccount] = initialBalance;
  }

}
