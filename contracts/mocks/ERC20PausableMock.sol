pragma solidity ^0.4.24;

import "../token/ERC20/ERC20Pausable.sol";


// mock class using ERC20Pausable
contract ERC20PausableMock is ERC20Pausable {

  constructor(address _initialAccount, uint _initialBalance) public {
    _mint(_initialAccount, _initialBalance);
  }

}
