pragma solidity ^0.4.24;

import "../drafts/ERC20Migrator.sol";


contract ERC20MigratorMock is ERC20Migrator {

  constructor(IERC20 legacyToken) public {
    ERC20Migrator.initialize(legacyToken);
  }

}
