pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../drafts/ERC20Migrator.sol";


contract ERC20MigratorMock is Initializable, ERC20Migrator {

  constructor(IERC20 legacyToken) public {
    ERC20Migrator.initialize(legacyToken);
  }

}
