pragma solidity ^0.4.4;

import '../token/GrantableToken.sol';

// mock class using StandardToken
contract GrantableTokenMock is GrantableToken {
  function GrantableTokenMock(address initialAccount, uint initialBalance) {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }
}
