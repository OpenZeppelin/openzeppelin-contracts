pragma solidity ^0.4.24;

import "../token/ERC20/StandardBurnableToken.sol";


contract StandardBurnableTokenMock is StandardBurnableToken {

  constructor(address _initialAccount, uint _initialBalance) public {
    balances[_initialAccount] = _initialBalance;
    totalSupply_ = _initialBalance;
  }

}
