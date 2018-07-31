pragma solidity ^0.4.24;


import "../token/ERC20/BasicToken.sol";


// mock class using BasicToken
contract BasicTokenMock is BasicToken {

  constructor(address _initialAccount, uint256 _initialBalance) public {
    balances[_initialAccount] = _initialBalance;
    totalSupply_ = _initialBalance;
  }

}
