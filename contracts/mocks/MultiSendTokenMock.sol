pragma solidity ^0.4.24;


import "../token/ERC20/MultiSendToken.sol";


contract MultiSendTokenMock is MultiSendToken {

  constructor(address initialAccount, uint256 initialBalance) public {
    balances[initialAccount] = initialBalance;
    totalSupply_ = initialBalance;
  }
}