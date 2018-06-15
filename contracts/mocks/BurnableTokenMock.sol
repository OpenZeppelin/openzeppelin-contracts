pragma solidity ^0.4.24;

import "../token/ERC20/BurnableToken.sol";


contract BurnableTokenMock is BurnableToken {

  constructor(address initialAccount, uint initialBalance) public {
    balances[initialAccount] = initialBalance;
    totalSupply_ = initialBalance;
  }

}
