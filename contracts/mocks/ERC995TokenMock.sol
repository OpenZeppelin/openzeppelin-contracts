pragma solidity ^0.4.21;


import "../token/ERC995/ERC995Token.sol";


// mock class using ERC995 Token
contract ERC995TokenMock is ERC995Token {

  function ERC995TokenMock(address initialAccount, uint256 initialBalance) public {
    balances[initialAccount] = initialBalance;
    totalSupply_ = initialBalance;
  }

}
