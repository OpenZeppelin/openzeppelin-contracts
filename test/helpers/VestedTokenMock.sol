pragma solidity ^0.4.11;

import '../../contracts/token/VestedToken.sol';

// mock class using StandardToken
contract VestedTokenMock is VestedToken {
  function VestedTokenMock(address initialAccount, uint256 initialBalance) {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }
}
