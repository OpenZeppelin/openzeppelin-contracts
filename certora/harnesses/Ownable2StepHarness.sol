pragma solidity ^0.8.0;

import "../munged/access/Ownable2Step.sol";

contract Ownable2StepHarness is Ownable2Step {
  function restricted() external onlyOwner {
  }
}