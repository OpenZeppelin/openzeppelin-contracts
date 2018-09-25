pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../token/ERC20/ERC20Mintable.sol";
import "./MinterRoleMock.sol";


contract ERC20MintableMock is Initializable, ERC20Mintable, MinterRoleMock {

  constructor() public {
    ERC20Mintable.initialize();
  }

}
