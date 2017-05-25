pragma solidity ^0.4.8;


import '../../contracts/token/RefundableToken.sol';


// mock class using RefundableToken
contract RefundableTokenMock is RefundableToken {

  function RefundableTokenMock(address initialAccount, uint initialBalance) payable {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }

  function canRefund() internal returns (bool) {
    return true;
  }

}
