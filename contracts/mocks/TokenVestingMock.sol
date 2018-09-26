pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../drafts/TokenVesting.sol";

contract TokenVestingMock is Initializable, TokenVesting {
  constructor(
    address beneficiary,
    uint256 start,
    uint256 cliffDuration,
    uint256 duration,
    bool revocable
  ) public {
    TokenVesting.initialize(
      beneficiary,
      start,
      cliffDuration,
      duration,
      revocable
    );
  }
}
