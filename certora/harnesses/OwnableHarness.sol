// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../patched/access/Ownable.sol";

contract OwnableHarness is Ownable {
  function restricted() external onlyOwner {}
}
