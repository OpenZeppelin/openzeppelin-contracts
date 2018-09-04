pragma solidity ^0.4.24;

import "../token/ERC20/ERC20Mintable.sol";


// Mock contract exposing internal methods
contract ERC20MintableMock is ERC20Mintable {
  constructor(address[] minters) ERC20Mintable(minters) public {
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
