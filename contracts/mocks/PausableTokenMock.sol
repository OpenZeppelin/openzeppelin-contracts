pragma solidity ^0.4.24;

import "../token/ERC20/PausableToken.sol";


// mock class using PausableToken
contract PausableTokenMock is PausableToken {

  constructor(address _initialAccount, uint _initialBalance) public {
    _mint(_initialAccount, _initialBalance);
  }

}
