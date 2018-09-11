pragma solidity ^0.4.24;

// When this line is split, truffle parsing fails.
// See: https://github.com/ethereum/solidity/issues/4871
// solium-disable-next-line max-len
import {BreakInvariantBounty, Target} from "../bounties/BreakInvariantBounty.sol";


contract InsecureInvariantTargetMock is Target {
  function checkInvariant() public returns(bool) {
    return false;
  }
}


contract InsecureInvariantTargetBounty is BreakInvariantBounty {
  function _deployContract() internal returns (address) {
    return new InsecureInvariantTargetMock();
  }
}
