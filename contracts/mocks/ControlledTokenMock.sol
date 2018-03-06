pragma solidity ^0.4.18;

import "../token/ERC20/ControlledToken.sol";


contract ControlledTokenMock is ControlledToken {

  function ControlledTokenMock(address initialAccount, uint256 initialBalance) public {
    balances[initialAccount] = initialBalance;
    totalSupply_ = initialBalance;
  }
}
