pragma solidity ^0.4.24;

import "../token/ERC20/ERC20Burnable.sol";


contract ERC20BurnableMock is ERC20Burnable {

  constructor(address _initialAccount, uint256 _initialBalance) public {
    _mint(_initialAccount, _initialBalance);
  }

}
