pragma solidity ^0.4.13;


import '../token/SmartToken.sol';


// mock class using SmartToken
contract SmartTokenMock is SmartToken {

  function SmartTokenMock(address initialAccount, uint256 initialBalance) {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }

}
