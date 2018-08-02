pragma solidity ^0.4.24;

import "../token/ERC20/StandardToken.sol";


// mock class using StandardToken
contract StandardTokenMock is StandardToken {

  constructor(address _initialAccount, uint256 _initialBalance) public {
    balances[_initialAccount] = _initialBalance;
    totalSupply_ = _initialBalance;
  }

}
