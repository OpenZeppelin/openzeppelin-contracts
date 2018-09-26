pragma solidity ^0.4.24;

// When this line is split, truffle parsing fails.
// See: https://github.com/ethereum/solidity/issues/4871
// solium-disable-next-line max-len
import {BreakInvariantBounty, Target} from "../drafts/BreakInvariantBounty.sol";


contract TargetMock is Target {
  bool private exploited;

  function exploitVulnerability() public {
    exploited = true;
  }

  function checkInvariant() public returns (bool) {
    if (exploited) {
      return false;
    }

    return true;
  }
}

contract BreakInvariantBountyMock is BreakInvariantBounty {
  function _deployContract() internal returns (address) {
    return new TargetMock();
  }
}
