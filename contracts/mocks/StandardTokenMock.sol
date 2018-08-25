pragma solidity ^0.4.24;

import "../token/ERC20/StandardToken.sol";


// mock class using StandardToken
contract StandardTokenMock is StandardToken {

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
