pragma solidity ^0.4.18;

import '../../contracts/token/BurnableToken.sol';

contract BurnableTokenMock is BurnableToken {

  function BurnableTokenMock(address initialAccount, uint initialBalance) public {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }

}
