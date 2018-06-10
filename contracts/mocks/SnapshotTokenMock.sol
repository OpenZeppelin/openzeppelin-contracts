pragma solidity ^0.4.23;

import { SnapshotToken } from "../token/ERC20/SnapshotToken.sol";


contract SnapshotTokenMock is SnapshotToken {
  constructor() public {
    uint256 initial_balance = 10000;
    balances[msg.sender] = initial_balance;
    totalSupply_ = initial_balance;
    emit Transfer(address(0), msg.sender, initial_balance);
  }
}
