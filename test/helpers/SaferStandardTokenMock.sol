pragma solidity ^0.4.11;


import '../../contracts/token/SaferStandardToken.sol';


// mock class using StandardToken
contract SaferStandardTokenMock is SaferStandardToken {

  function SaferStandardTokenMock(address initialAccount, uint256 initialBalance) {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }

}