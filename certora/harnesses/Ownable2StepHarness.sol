// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../patched/access/Ownable2Step.sol";

contract Ownable2StepHarness is Ownable2Step {
  function restricted() external onlyOwner {}
}
