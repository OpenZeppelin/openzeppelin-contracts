pragma solidity ^0.4.24;

// When this line is split, truffle parsing fails.
// See: https://github.com/ethereum/solidity/issues/4871
// solium-disable-next-line max-len
import {BreakInvariantBounty, Target} from "../../contracts/drafts/BreakInvariantBounty.sol";


contract SecureInvariantTargetMock is Target {
  function checkInvariant() public returns(bool) {
    return true;
  }
}


contract SecureInvariantTargetBounty is BreakInvariantBounty {
  function _deployContract() internal returns (address) {
    return new SecureInvariantTargetMock();
  }
}
