pragma solidity ^0.4.24;

import "../token/ERC20/MintableToken.sol";


// Mock contract exposing internal methods
contract MintableTokenMock is MintableToken {
  constructor(address[] minters) MintableToken(minters) public {
  }

  function addMinter(address _account) public {
    _addMinter(_account);
  }

  function removeMinter(address _account) public {
    _removeMinter(_account);
  }

  function onlyMinterMock() public view onlyMinter {
  }
}
