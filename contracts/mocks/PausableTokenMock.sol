pragma solidity ^0.4.18;

import "../token/ERC20/PausableToken.sol";


// mock class using PausableToken
contract PausableTokenMock is PausableToken {

  function PausableTokenMock(address initialAccount, uint initialBalance) public {
    balances[initialAccount] = initialBalance;
  }

}
