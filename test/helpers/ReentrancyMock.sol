pragma solidity ^0.4.11;

import '../../contracts/ReentrancyGuard.sol';
import './ReentrancyAttack.sol';

contract ReentrancyMock is ReentrancyGuard {

  uint256 public counter;

  function ReentrancyMock() {
    counter = 0;
  }

  function count() private {
    counter += 1;
  }

  function countLocalRecursive(uint n) public nonReentrant {
    if(n > 0) {
      count();
      countLocalRecursive(n - 1);
    }
  }

  function countThisRecursive(uint256 n) public nonReentrant {
    bytes4 func = bytes4(keccak256("countThisRecursive(uint256)"));
    if(n > 0) {
      count();
      bool result = this.call(func, n - 1);
      if(result != true) {
        throw;
      }
    }
  }

  function countAndCall(ReentrancyAttack attacker) public nonReentrant {
    count();
    bytes4 func = bytes4(keccak256("callback()"));
    attacker.callSender(func);
  }

  function callback() external nonReentrant {
    count();
  }

}
