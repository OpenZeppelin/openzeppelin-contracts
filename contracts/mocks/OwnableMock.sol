pragma solidity ^0.4.24;

import { Ownable } from "../ownership/Ownable.sol";

contract OwnableMock is Ownable {
  constructor() {
    Ownable.initialize(msg.sender);
  }
}
