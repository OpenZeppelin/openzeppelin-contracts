pragma solidity ^0.4.24;

import "../token/ERC20/ERC20Snapshot.sol";


contract ERC20SnapshotMock is ERC20Snapshot {

  constructor(address initialAccount, uint256 initialBalance) public {
    _mint(initialAccount, initialBalance);
  }

}
