pragma solidity ^0.4.24;

import "../token/ERC20/ERC20.sol";


// mock class using ERC20
contract ERC20Mock is ERC20 {

  constructor(address _initialAccount, uint256 _initialBalance) public {
    _mint(_initialAccount, _initialBalance);
  }

  function mint(address _account, uint256 _amount) public {
    _mint(_account, _amount);
  }

  function burn(address _account, uint256 _amount) public {
    _burn(_account, _amount);
  }

  function burnFrom(address _account, uint256 _amount) public {
    _burnFrom(_account, _amount);
  }

}
