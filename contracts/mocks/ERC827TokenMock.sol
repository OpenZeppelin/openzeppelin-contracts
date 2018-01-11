pragma solidity ^0.4.13;


import '../token/ERC827.sol';


// mock class using ERC827 Token
contract ERC827TokenMock is ERC827 {

  function ERC827TokenMock(address initialAccount, uint256 initialBalance) {
    balances[initialAccount] = initialBalance;
    totalSupply = initialBalance;
  }

}
