pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../token/ERC20/ERC20Pausable.sol";
import "./PauserRoleMock.sol";


// mock class using ERC20Pausable
contract ERC20PausableMock is Initializable, ERC20Pausable, PauserRoleMock {

  constructor(address initialAccount, uint initialBalance) public {
    ERC20Pausable.initialize();

    _mint(initialAccount, initialBalance);
  }

}
