// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "../patched/access/Ownable.sol";

contract OwnableHarness is Ownable {
  function restricted() external onlyOwner {}
}
