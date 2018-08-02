pragma solidity ^0.4.24;

import "../token/ERC20/PreserveBalancesOnTransferToken.sol";


contract PreserveBalancesMock is PreserveBalancesOnTransferToken {
  // without modifiers. allow anyone to call this
  function startNewEvent() public returns(uint) {
    // do nothing. just for tests
    return 0;
  }

  // without modifiers. allow anyone to call this
  function finishEvent(uint _eventID) public {
    // do nothing. just for tests
  }

  function testCallStartForSnapshot(SnapshotToken _st) public {
    _st.start();
  }

  function testCallFinishForSnapshot(SnapshotToken _st) public {
    _st.finish();
  }
}
