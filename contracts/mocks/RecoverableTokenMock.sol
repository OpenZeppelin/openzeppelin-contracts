pragma solidity ^0.4.24;

import "../token/ERC20/RecoverableToken.sol";


// mock class using RecoverableToken
contract RecoverableTokenMock is RecoverableToken {

  constructor(address initialAccount, uint256 initialBalance) public {
    balances[initialAccount] = initialBalance;
    totalSupply_ = initialBalance;
  }

}
