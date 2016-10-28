pragma solidity ^0.4.0;
import '../StandardToken.sol';

// mock class using StandardToken
contract StandardTokenMock is StandardToken {

  function StandardTokenMock(address initialAccount, uint initialBalance) {
    balances[initialAccount] = initialBalance;
  }

}
