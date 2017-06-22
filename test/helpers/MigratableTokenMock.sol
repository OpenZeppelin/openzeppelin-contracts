pragma solidity ^0.4.11;


import '../../contracts/token/MigratableToken.sol';


// mock class using MigratableToken
contract MigratableTokenMock is MigratableToken {
  function MigratableTokenMock(address initialAccount, uint initialBalance) {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }
}
